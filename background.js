chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

  if (reason === 'install') {
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    if (!apiKey) {
      chrome.runtime.openOptionsPage();
    }
  }
});
