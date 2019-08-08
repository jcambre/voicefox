/* globals Fuse */

this.intents.find = (function() {
  this.intentRunner.registerIntent("find", async (desc) => {
    const query = desc.slots.query;
    console.log("the most likely query text is", query);

    // Fuse options
    const options = {
      id: "tabId",
      shouldSort: true,
      tokenize: true,
      findAllMatches: true,
      includeScore: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 3,
      keys: [
        {
          name: "title",
          weight: 0.8,
        },
        {
          name: "url",
          weight: 0.2,
        },
      ],
    };

    let combinedTabContent = [];

    const tabs = await browser.tabs.query({});

    for (const tab of tabs) {
      const result = {
        tabId: tab.id,
        title: tab.title,
        url: tab.url,
      };

      combinedTabContent.push(result);
      console.log("i am on tab " + tab.id);
    }

    combinedTabContent = combinedTabContent.flat();

    // use Fuse.js to parse the most probable response?
    const fuse = new Fuse(combinedTabContent, options);
    const matches = fuse.search(query);
    console.log(matches);
    // TODO account for multiple matches
    const topMatch = parseInt(matches[0].item);
    await browser.tabs.update(topMatch, {
      active: true,
    });
    // TODO: close the popup for show status
  });
})();
