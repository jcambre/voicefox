/* globals communicate, pageMetadataContentScript, log */

this.contentScript = (function() {
  const types = {};
  const PASTE_SELECTORS = [
    "textarea",
    "*[contenteditable]",
    `
    input[type=text],
    input[type=search],
    input[type=url],
    input[type=email],
    input[type=password],
    input[type=date],
    input[type=datetime-local],
    input[type=time],
    input[type=color]
    `,
  ];

  const DOMAIN_FOCUS_TIMES = {
    "twitter.com": 3000,
  };
  const DEFAULT_FOCUS_TIME = 500;

  const meta = pageMetadataContentScript.getMetadata;

  function copyElement(el) {
    document.body.appendChild(el);
    const oldRanges = [];
    const sel = window.getSelection();
    for (let i = 0; i < sel.rangeCount; i++) {
      oldRanges.push(sel.getRangeAt(i));
    }
    sel.empty();
    const newRange = document.createRange();
    newRange.selectNode(el);
    sel.addRange(newRange);
    document.execCommand("copy");
    sel.empty();
    for (const range of oldRanges) {
      sel.addRange(range);
    }
    el.remove();
  }

  function createScreenshot({ x, y, width, height }) {
    const canvas = document.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "canvas"
    );
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    const ctx = canvas.getContext("2d");
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.drawWindow(window, x, y, width, height, "#fff");
    return canvas.toDataURL();
  }

  function getDocumentWidth() {
    return Math.max(
      document.body && document.body.clientWidth,
      document.documentElement.clientWidth,
      document.body && document.body.scrollWidth,
      document.documentElement.scrollWidth
    );
  }

  function getDocumentHeight() {
    return Math.max(
      document.body && document.body.clientHeight,
      document.documentElement.clientHeight,
      document.body && document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
  }

  function copyImage(url) {
    return browser.runtime.sendMessage({
      type: "copyImage",
      url,
    });
  }

  communicate.register("copy", message => {
    const { copyType } = message;
    const result = types[copyType]();
    if (result) {
      navigator.clipboard.writeText(result);
    }
  });

  types.copyLink = function() {
    return meta().canonical;
  };

  types.copyTitle = function() {
    return meta().title;
  };

  types.copyMarkdownLink = function() {
    const m = meta();
    return `[${m.title}](${m.canonical || m.url});`;
  };

  types.copySelection = function() {
    document.execCommand("copy");
  };

  types.copyRichLink = function() {
    const m = meta();
    const anchor = document.createElement("a");
    anchor.href = m.canonical;
    anchor.textContent = m.title;
    copyElement(anchor);
  };

  types.copyScreenshot = function() {
    const url = createScreenshot({
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight,
    });
    copyImage(url);
  };

  types.copyFullPageScreenshot = function() {
    const url = createScreenshot({
      x: 0,
      y: 0,
      height: getDocumentHeight(),
      width: getDocumentWidth(),
    });
    copyImage(url);
  };

  function isPasteable(el) {
    while (el && el.tagName) {
      if (["INPUT", "TEXTAREA"].includes(el.tagName)) {
        return true;
      }
      if (el.getAttribute("contenteditable")) {
        return true;
      }
      el = el.parentNode;
    }
    return false;
  }

  types.paste = function() {
    let timeout = 0;
    if (!isPasteable(document.activeElement)) {
      let el;
      for (const selector of PASTE_SELECTORS) {
        el = document.querySelector(selector);
        if (el) {
          break;
        }
      }
      if (el) {
        el.focus();
        timeout = DOMAIN_FOCUS_TIMES[location.hostname] || DEFAULT_FOCUS_TIME;
      }
    }
    setTimeout(() => {
      const result = document.execCommand("paste");
      if (!result) {
        // Though AFAICT this will often return false even when it did succeed
        log.info("Paste appeared to fail");
      }
    }, timeout);
  };
})();
