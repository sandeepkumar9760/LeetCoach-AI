chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  if (request.action === "getProblem") {

    try {
      // Title selector (new LeetCode UI)
      const titleElement = document.querySelector('[class*="text-title"]');

      // Description selector (confirmed working)
      const descriptionElement = document.querySelector('[data-track-load="description_content"]');

      if (!titleElement || !descriptionElement) {
        sendResponse({ error: "Problem elements not found" });
        return true;
      }

      const title = titleElement.innerText.trim();
      const description = descriptionElement.innerText.trim();

      sendResponse({
        title,
        description
      });

    } catch (error) {
      sendResponse({
        error: "Extraction failed",
        details: error.message
      });
    }

    return true;
  }

});