/* globals util, voice, vad */

this.popup = (function() {
  const PERMISSION_REQUEST_TIME = 500;
  const FAST_PERMISSION_CLOSE = 500;
  let stream;
  let isWaitingForPermission = null;

  async function init() {
    document.addEventListener("beforeunload", () => {
      if (
        isWaitingForPermission &&
        Date.now() - isWaitingForPermission < FAST_PERMISSION_CLOSE
      ) {
        startOnboarding();
      }
    });
    try {
      isWaitingForPermission = Date.now();
      await startMicrophone();
      isWaitingForPermission = null;
    } catch (e) {
      isWaitingForPermission = false;
      if (e.name === "NotAllowedError" || e.name === "TimeoutError") {
        startOnboarding();
        window.close();
        return;
      }
      throw e;
    }

    console.info("starting...");
    await vad.stm_vad_ready;
    console.info("stm_vad is ready");
    startRecorder(stream);
    console.info("finished startRecorder...");
  }

  async function requestMicrophone() {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    return stream;
  }

  async function startMicrophone() {
    const sleeper = util.sleep(PERMISSION_REQUEST_TIME).then(() => {
      const exc = new Error("Permission Timed Out");
      exc.name = "TimeoutError";
      throw exc;
    });
    await Promise.race([requestMicrophone(), sleeper]);
  }

  async function startOnboarding() {
    await browser.tabs.create({
      url: browser.extension.getURL("onboarding/onboard.html"),
    });
  }

  function startRecorder(stream) {
    const recorder = new voice.Recorder(stream);
    const intervalId = setInterval(() => {
      const volumeLevel = recorder.getVolumeLevel();
      console.info("Volume level:", volumeLevel);
      ui.setAnimationForVolume(volumeLevel);
    }, 500);
    recorder.onBeginRecording = () => {
      console.info("started recording");
      ui.setState("listening");
      ui.onStartTextInput = () => {
        console.log("detected text from the popup");
        recorder.stop(); // not sure if this is working as expected?
      };
      ui.onTextInput = text => {
        console.log("received text from popup");
        console.log(text);
      };
    };
    recorder.onEnd = json => {
      console.info("Got a response:", json && json.data);
      if (json === null) {
        // It was cancelled
      }
      clearInterval(intervalId);
      ui.setState("success");
      ui.setTranscript(json.data[0].text);
    };
    recorder.onError = error => {
      console.error("Got error:", String(error), error);
      clearInterval(intervalId);
    };
    recorder.startRecording();
  }

  init();
})();
