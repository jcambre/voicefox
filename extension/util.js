this.util = (function() {
  const exports = {};

  exports.sleep = function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  /** If the promise takes longer than the given number of milliseconds, throw a promise error
   * (error.name === "TimeoutError") */
  exports.promiseTimeout = function(promise, time) {
    const sleeper = exports.sleep(time).then(() => {
      const exc = new Error("Timed Out");
      exc.name = "TimeoutError";
      throw exc;
    });
    return Promise.race([promise, sleeper]);
  };

  /** Try func() several times, eventually timing out after timeout milliseconds
   * func() should return undefined when the results are indeterminate. Any other
   * return value ends the attempts successfully.
   */
  exports.trySeveralTimes = function({
    func,
    timeout,
    interval,
    returnOnTimeout,
  }) {
    timeout = timeout || 1000;
    interval = interval || 100;
    return new Promise((resolve, reject) => {
      const intervalId = setInterval(async () => {
        try {
          const resp = await func();
          if (resp !== undefined) {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            resolve(resp);
          }
        } catch (e) {
          clearTimeout(timeoutId);
          clearInterval(intervalId);
          reject(e);
        }
      }, interval);
      const timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        if (returnOnTimeout !== undefined) {
          resolve(returnOnTimeout);
        } else {
          const exc = new Error("Timed out");
          exc.name = "TimeoutError";
          reject(exc);
        }
      }, timeout);
    });
  };

  /** Creates a Promise with .resolve and .reject attributes, so you can pre-create it and then
   * resolve it somewhere else (like after initialization has run) */
  exports.makeNakedPromise = function() {
    let _resolve, _reject;
    const promise = new Promise((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    promise.resolve = _resolve;
    promise.reject = _reject;
    return promise;
  };

  exports.cmp = function(a, b) {
    if (a < b) {
      return -1;
    } else if (b < a) {
      return 1;
    }
    return 0;
  };

  exports.randomString = function randomString(length, chars) {
    const randomStringChars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    chars = chars || randomStringChars;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  };

  return exports;
})();
