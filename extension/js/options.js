function saveOptions(e) {
  e.preventDefault();
  browser.storage.sync.set({
    language: document.querySelector("#language").value,
    searchProvider: document.querySelector("#search-provider").value,
  });
}

function restoreOptions() {
  const languageSelect = document.querySelector("#language");
  const providerSelect = document.querySelector("#search-provider");
  let languages;

  fetch(browser.extension.getURL("/js/languages.json"))
    .then(response => {
      return response.json();
    })
    .then(l => {
      languages = l;

      Object.entries(languages)
        .sort((a, b) => {
          return a[1].localeCompare(b[1]);
        })
        .map(([code, language]) => {
          const option = document.createElement("option");
          option.value = code;
          option.innerText = language;
          languageSelect.appendChild(option);
        });

      return browser.storage.sync.get("language");
    })
    .then(result => {
      const defaultLanguage =
        navigator.language in languages ? navigator.language : "en-US";

      languageSelect.value = result.language || defaultLanguage;
    })
    .catch(error => {
      console.log(`Error: ${error}`);
    });

  let manifest;
  Promise.resolve()
    .then(() => {
      manifest = browser.runtime.getManifest();

      return browser.storage.sync.get("lastVersion");
    })
    .then(result => {
      if (result.lastVersion !== manifest.version) {
        return browser.storage.sync
          .set({
            lastVersion: manifest.version,
          })
          .then(() => {
            browser.tabs.create({
              active: true,
              url: browser.extension.getURL("/views/CHANGELOG.html"),
            });
          });
      }

      return Promise.resolve();
    })
    .then(() => {
      const domains = Array.from(
        new Set(
          manifest.content_scripts[0].matches.map(d => {
            return d.replace(/\/\*$/, "").replace(/\*\./, "");
          })
        ).values()
      ).sort();

      domains.map(domain => {
        const option = document.createElement("option");
        option.value = domain;
        option.innerText = domain;
        providerSelect.appendChild(option);
      });

      return browser.storage.sync.get("searchProvider");
    })
    .then(result => {
      const defaultProvider = "https://www.google.com";
      providerSelect.value = result.searchProvider || defaultProvider;
    })
    .catch(error => {
      console.log(`Error: ${error}`);
    });

  languageSelect.addEventListener("change", saveOptions);
  providerSelect.addEventListener("change", saveOptions);
}

document.addEventListener("DOMContentLoaded", restoreOptions);
