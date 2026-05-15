const apiKeyEl = document.getElementById('apiKey');
const saveBtn = document.getElementById('save');
const toggleBtn = document.getElementById('toggle-visibility');
const saveStatus = document.getElementById('save-status');
const keyStatus = document.getElementById('key-status');

async function loadSettings() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  if (apiKey) {
    apiKeyEl.value = apiKey;
    keyStatus.textContent = 'API key saved.';
    keyStatus.className = 'status success';
  } else {
    keyStatus.textContent = 'No API key configured yet.';
    keyStatus.className = 'status error';
  }
}

async function saveSettings() {
  const apiKey = apiKeyEl.value.trim();

  if (!apiKey) {
    saveStatus.textContent = 'API key cannot be empty.';
    saveStatus.className = 'status error';
    return;
  }

  if (!apiKey.startsWith('sk-ant-')) {
    saveStatus.textContent = 'That does not look like an Anthropic API key (should start with "sk-ant-").';
    saveStatus.className = 'status error';
    return;
  }

  await chrome.storage.sync.set({ apiKey });
  saveStatus.textContent = 'Saved.';
  saveStatus.className = 'status success';
  keyStatus.textContent = 'API key saved.';
  keyStatus.className = 'status success';

  setTimeout(() => {
    saveStatus.textContent = '';
  }, 2000);
}

toggleBtn.addEventListener('click', () => {
  if (apiKeyEl.type === 'password') {
    apiKeyEl.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    apiKeyEl.type = 'password';
    toggleBtn.textContent = 'Show';
  }
});

saveBtn.addEventListener('click', saveSettings);
apiKeyEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') saveSettings();
});

loadSettings();
