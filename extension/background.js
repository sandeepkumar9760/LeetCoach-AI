console.log("LeetCoach background loaded");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");

  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });
  }
});

chrome.runtime.onStartup.addListener(() => {
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({
      openPanelOnActionClick: true
    });
  }
});