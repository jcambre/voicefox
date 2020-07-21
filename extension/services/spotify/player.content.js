import { Runner } from "../../content/helpers.js";

const SEARCH_PLAY = "#searchPage div button[style='--size:48px;']";

class Player extends Runner {
  action_play() {
    const button = this.querySelector("button[title='Play']");
    button.click();
  }

  async search(query) {
    // try to find the error page; if found, throw a DRM error; otherwise search
    const errorDiv = document.querySelector("div.ErrorPage");
    if (errorDiv) {
      throw new Error("You must enable DRM.");
    }

    const searchButton = await this.waitForSelector(
      "a[aria-label='Search'], a[href$='search']",
      {
        timeout: 5000,
      }
    );
    searchButton.click();

    const input = await this.waitForSelector(
      "div[role=search] input, input.SearchInputBox__input"
    );
    this.setReactInputValue(input, query);
  }

  async action_search({ query, thenPlay }) {
    await this.search(query);
    if (thenPlay) {
      try {
        const playerButton = await this.waitForSelector(SEARCH_PLAY, {
          timeout: 10000,
        });

        playerButton.click();
      } catch (e) {
        const notFound = document.querySelector("#searchPage h1");

        if (notFound) {
          if (notFound.innerText.includes("No results found")) {
            throw new Error("No search results");
          }
        } else if (e.name === "TimeoutError") {
          throw new Error("Timeout during search");
        }
      }
    }
  }

  action_pause() {
    const button = this.querySelector("button[title='Pause']");
    button.click();
  }

  action_unpause() {
    const button = this.querySelector(".control-button[title='Play']");
    button.click();
  }

  action_mute() {
    const button = this.querySelector(".control-button[aria-label='Mute']");
    button.click();
  }

  action_unmute() {
    const button = this.querySelector(".control-button[aria-label='Unmute']");
    button.click();
  }

  async action_move({ direction }) {
    if (direction === "next") {
      const selector = ".control-button[title='Next']";
      const button = this.querySelector(selector);
      button.click();
    } else if (direction === "previous") {
      const selector = ".control-button[title='Previous']";
      // Player time
      const time = this.querySelector(".playback-bar__progress-time").innerHTML;
      if (
        /\b0:00\b/gi.test(time) ||
        /\b0:01\b/gi.test(time) ||
        /\b0:02\b/gi.test(time)
      ) {
        const firstClickBtn = this.querySelector(selector);
        firstClickBtn.click();
        return;
      }
      const firstClickBtn = this.querySelector(selector);
      firstClickBtn.click();
      // Since after the first click there is a delay in the selector
      const secondClickBtn = await this.waitForSelector(selector);
      secondClickBtn.click();
    }
  }

  async action_playAlbum({ query, thenPlay }) {
    await this.search(query);
    const ALBUM_SECTION = "section[aria-label='Albums']";
    if (thenPlay) {
      try {
        const playerButton = await this.waitForSelector(
          ALBUM_SECTION + " button",
          {
            timeout: 10000,
          }
        );
        playerButton.click();

        // Clicking on card to get into album playlist.
        // Important: The selectors to be changed when spotify updates their website.
        const cards = this.querySelectorAll(
          ALBUM_SECTION + " .react-contextmenu-wrapper"
        )[0];
        cards.childNodes[3].click();
      } catch (e) {
        if (e.name === "TimeoutError") {
          throw new Error("No search results");
        }
      }
    }
  }

  async action_playPlaylist({ query, thenPlay }) {
    await this.search(query);
    const PLAYLIST_SECTION = "section[aria-label='Playlists']";
    if (thenPlay) {
      try {
        const playerButton = await this.waitForSelector(
          PLAYLIST_SECTION + " button",
          {
            timeout: 10000,
          }
        );
        playerButton.click();

        // Clicking on card to get into album playlist.
        // Important: The selectors to be changed when spotify updates their website.
        const cards = this.querySelectorAll(
          PLAYLIST_SECTION + " .react-contextmenu-wrapper"
        )[0];
        cards.childNodes[3].click();
      } catch (e) {
        if (e.name === "TimeoutError") {
          throw new Error("No search results");
        }
      }
    }
  }
}

Player.register();
