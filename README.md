# Firefox Voice

Firefox Voice is an experiment from [Mozilla Emerging Technologies](https://research.mozilla.org/).

Firefox Voice is a browser extension that allows you to give voice commands to your browser, such as "what is the weather?" or "find the gmail tab". Ultimately the goal is to see if we can facilitate meaningful user interactions with the web using just voice-based interactions. Initially the goal is to provide _any_ useful interactions.

## Developing

There is some documentation in the [docs/](./docs/) directory, notably [writing an intent](./docs/writing-an-intent.md).

If you are using Windows, please install [WSL](https://docs.microsoft.com/en-us/windows/wsl/install-win10), as the installation won't work from a normal Windows command prompt.

The developer installation is:

```sh
npm install
npm start
```

This will launch a new Firefox browser with the extension installed. You should probably have [Nightly or Developer Edition](https://www.mozilla.org/en-US/firefox/channel/desktop/) installed.

By default this will use Firefox Nightly, but you can override this with the environmental variable `$FIREFOX` (you can point it to a release version, but some things may not work; also you can use a localized Firefox or an unbranded Firefox). You can also set `$PROFILE` to a directory where the profile information is kept (it defaults to `./Profile/`).

By default messaging-related logging messages aren't shown, you can turn logging up slightly with `$LOG_LEVEL=messaging` (or like `LOG_LEVEL=messaging npm start`).

Any changes you make should cause any .jsx files to be recompiled and the extension will be reloaded.

### Debugging

In Firefox Voice there are several separate processes where things run (see also [Anatomy of an extension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)):

1. The "background page". This is a persistent page that belongs to the extension, and is where most of the work is done. For debugging this specifically see [this `about:debugging` document](https://developer.mozilla.org/en-US/docs/Tools/about:debugging).
2. The popup. This is it's own page (in `extension/popup/`) and handles some of the initial lifecycle of invoking an intent. In most ways it is a normal page, but it runs in the short-lived popup. See the next section for a technique to debug this.
3. The recorder tab. This is its own pinned tab that holds the media stream (because we have to keep this open to avoid permission issues). It is its own page. You can use the normal debugging tools on it.
4. The search tab. This is also its own pinned tab that holds Google searches. It is not long-lived (each search causes it to reload), but it is specifically managed by the extension. The extension-specific code is run in content scripts, and normal debugging tools mostly work but can be finicky.
5. Other [content scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts). Any page that the extension manages directly (e.g., clicking controls, reading information) has content scripts injected.

The most reliable way to debug these is with the Browser Console, which should open automatically, or you can open with **Tools > Web Developer > Browser Console**. You should change the settings on the console using the gear icon in the upper-right, and turn on **Show Content Messages** (otherwise logging from the popup and some of these other sources will not be displayed). This setting should persist.

### Debugging the popup

The popup can be hard to debug, since it disappears and there's no debugging tools. But the popup can also run in a tab. The easiest way to do this is to run:

```sh
OPEN_POPUP_ON_START=1 npm start
```

This will open the popup in a tab and reopen it whenever the extension restarts. Reloading the tab is equivalent to reopening the popup.

### Writing a new command / intent

Please see [Writing An Intent](./docs/writing-an-intent.md).

## Using in-development versions

It's possible to install and use in-development versions of the extension. Every commit to `master` is built into the dev build, and when we prepare for a release and merge to `stage` is used to create the stage build.

**NOTE THAT THESE VERSIONS INCLUDE EXTRA DATA COLLECTION**

We are using these builds for internal testing with more-than-normal data collection. We have not yet implemented data collection controls.

- [Install dev version](https://va.allizom.org/releases/dev/firefox-voice.xpi?src=github)
- [Install stage version](https://va.allizom.org/releases/stage/firefox-voice.xpi?src=github) (Note: stage isn't always updated!)
- [Install production version](https://va.allizom.org/releases/prod/firefox-voice.xpi?src=github)
- [Logs of updates](https://va.allizom.org/releases/public-update-log.txt)

The version numbers are increased for each release and each commit, but are _not_ sequential.

### Viewing Intent Information

There is an index of intents (commands) that is viewable if you open the panel, click on the gear/settings, and follow the "Intent Viewer" link.

## Developing in Android

This is very experimental, but to develop for Firefox for Android (not Fenix), install Firefox (release) on your Android device.

To try, run:

```sh
npm run start-android
```

You may see an error message `Android device ... was not found in list: ["99EAP164UC"]`: if so, then 99EAP164UC (for example) is your Android device name. Try again:

```sh
export ANDROID_DEVICE=99EAP164UC
npm run start-android
```

You might have to install `adb` and enable some permissions as well, look in the console for more instructions.

For some more information:

- This tutorial on [Developing extensions for Firefox for Android](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/)
- See the [web-ext docs](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext#testing-in-firefox-for-android) and the section "Testing in Firefox for Android"
- [How to get developer options on Android](https://www.digitaltrends.com/mobile/how-to-get-developer-options-on-android/) (to turn on USB access)

## Contributing

See the [guidelines](docs/contributing.md) for contributing to this project.

This project is governed by a [Code Of Conduct](docs/code_of_conduct.md).

To disclose potential a security vulnerability please see our [security](docs/security.md) documentation.

### Contributors

<a href="https://github.com/mozilla/firefox-voice/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=mozilla/firefox-voice" />
</a>

Made with [contributors-img](https://contributors-img.firebaseapp.com).

## [License](/LICENSE)

This module is licensed under the [Mozilla Public License, version 2.0](/LICENSE).

```

```
