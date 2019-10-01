/* globals log, intentParser, telemetry, catcher */
// This gets used elsewhere as a namespace for the intent modules:
this.intents = {};

this.intentRunner = (function() {
  const exports = {};

  const intents = (exports.intents = {});

  class IntentContext {
    constructor(desc) {
      this.closePopupOnFinish = true;
      Object.assign(this, desc);
    }

    keepPopup() {
      this.closePopupOnFinish = false;
    }

    done() {
      this.closePopupOnFinish = false;
      return browser.runtime.sendMessage({
        type: "closePopup",
      });
    }

    failed(message) {
      telemetry.add({ intentSuccess: false });
      telemetry.send({});
      try {
        this.onError(message);
      } catch (e) {
        log.error("Error in onError handler:", e);
      }
      return browser.runtime.sendMessage({
        type: "displayFailure",
        message,
      });
    }

    async failedAutoplay(tab) {
      this.keepPopup();
      await browser.tabs.update(tab.id, { active: true });
      await browser.runtime.sendMessage({ type: "displayAutoplayFailure" });
    }

    showCard(cardData) {
      this.keepPopup();
      telemetry.add({ hasCard: true });
      browser.runtime.sendMessage({
        type: "showCard",
        cardData,
      });
    }

    /** This is some ad hoc information this specific intent wants to add */
    addExtraTelemetryData(intentExtraData) {
      telemetry.add({ intentExtraData });
    }

    addTelemetryServiceName(intentServiceName) {
      telemetry.add({ intentServiceName });
    }

    initTelemetry() {
      telemetry.add({
        inputLength: this.utterance.length,
        intent: this.name,
        intentCategory: this.name.split(".")[0],
        intentFallback: this.fallback,
        intentParseSuccess: !this.fallback,
        intentSuccess: true,
        utterance: this.utterance,
        utteranceParsed: { slots: this.slots },
      });
    }

    createTab(options) {
      return browser.tabs.create(options);
    }

    onError(message) {
      // Can be overridden
    }
  }

  exports.registerIntent = function(intent) {
    if (intents[intent.name]) {
      throw new Error(`Attempt to reregister intent: ${intent.name}`);
    }
    intents[intent.name] = intent;
    if (!intent.match) {
      throw new Error(`Intent missing .match: ${intent.name}`);
    }
    intentParser.registerMatcher(
      intent.name,
      intent.match,
      intent.priority || ""
    );
  };

  exports.runIntent = async function(desc) {
    if (!intents[desc.name]) {
      throw new Error(`No intent found with name ${desc.name}`);
    }
    const intent = intents[desc.name];
    const context = new IntentContext(desc);
    context.initTelemetry();
    try {
      log.info(
        `Running intent ${desc.name}`,
        Object.keys(desc.slots).length
          ? `with slots: ${JSON.stringify(desc.slots)}`
          : "with no slots"
      );
      await intent.run(context);
      if (context.closePopupOnFinish) {
        context.done();
      }
      // FIXME: this isn't necessarily the right time to send the ping, if the intent
      // isn't actually complete:
      telemetry.send();
    } catch (e) {
      const display = e.displayMessage || `Internal error: ${e}`;
      context.failed(display);
      if (e.displayMessage) {
        log.info(
          "Expected error in intent",
          desc.name,
          ":",
          String(e),
          e.stack
        );
      } else {
        log.error("Error in intent", desc.name, ":", String(e), e.stack);
        catcher.capture(e);
      }
    }
  };

  exports.getIntentSummary = function() {
    const names = intentParser.getNamesByPriority();
    return names.map(name => {
      const intent = Object.assign({}, intents[name]);
      delete intent.run;
      const matchSet =
        typeof intent.match === "string"
          ? new intentParser.MatchSet(intent.match)
          : intent.match;
      const matchers = matchSet.getMatchers();
      delete intent.match;
      intent.matchers = matchers.map(m => {
        return {
          phrase: m.phrase,
          slots: m.slots,
          regex: String(m.regex),
        };
      });
      if (intent.examples) {
        intent.examples = intent.examples.map(e => {
          const parsed = intentParser.parse(e, true) || {
            name: "NO MATCH",
            slots: {},
          };
          return {
            parsedIntent: parsed.name,
            text: e,
            slots: parsed.slots,
          };
        });
      }
      return intent;
    });
  };

  return exports;
})();
