const anthropicInput = document.getElementById('anthropicApiKey');
const openaiInput = document.getElementById('openaiApiKey');
const saveBtn = document.getElementById('save');
const saveStatus = document.getElementById('save-status');
const anthropicStatus = document.getElementById('anthropic-status');
const openaiStatus = document.getElementById('openai-status');
const toggleBtns = document.querySelectorAll('.toggle-visibility');

async function migrateLegacyKey() {
  const stored = await chrome.storage.sync.get(['apiKey', 'anthropicApiKey']);
  if (stored.apiKey && !stored.anthropicApiKey) {
    await chrome.storage.sync.set({ anthropicApiKey: stored.apiKey });
    await chrome.storage.sync.remove('apiKey');
  }
}

function setStatus(el, present) {
  if (present) {
    el.textContent = 'Saved.';
    el.className = 'status success';
  } else {
    el.textContent = 'Not configured.';
    el.className = 'status error';
  }
}

async function loadSettings() {
  await migrateLegacyKey();
  const { anthropicApiKey, openaiApiKey } = await chrome.storage.sync.get([
    'anthropicApiKey',
    'openaiApiKey',
  ]);
  if (anthropicApiKey) anthropicInput.value = anthropicApiKey;
  if (openaiApiKey) openaiInput.value = openaiApiKey;
  setStatus(anthropicStatus, !!anthropicApiKey);
  setStatus(openaiStatus, !!openaiApiKey);
}

function validateAnthropic(key) {
  if (!key) return { ok: true };
  if (!key.startsWith('sk-ant-')) {
    return { ok: false, msg: 'Anthropic key should start with "sk-ant-".' };
  }
  return { ok: true };
}

function validateOpenAI(key) {
  if (!key) return { ok: true };
  if (!key.startsWith('sk-')) {
    return { ok: false, msg: 'OpenAI key should start with "sk-".' };
  }
  return { ok: true };
}

async function saveSettings() {
  const anthropic = anthropicInput.value.trim();
  const openai = openaiInput.value.trim();

  if (!anthropic && !openai) {
    saveStatus.textContent = 'Add at least one API key.';
    saveStatus.className = 'status error';
    return;
  }

  const aCheck = validateAnthropic(anthropic);
  if (!aCheck.ok) {
    saveStatus.textContent = aCheck.msg;
    saveStatus.className = 'status error';
    return;
  }
  const oCheck = validateOpenAI(openai);
  if (!oCheck.ok) {
    saveStatus.textContent = oCheck.msg;
    saveStatus.className = 'status error';
    return;
  }

  const updates = {};
  const removes = [];
  if (anthropic) updates.anthropicApiKey = anthropic;
  else removes.push('anthropicApiKey');
  if (openai) updates.openaiApiKey = openai;
  else removes.push('openaiApiKey');

  if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
  if (removes.length) await chrome.storage.sync.remove(removes);

  setStatus(anthropicStatus, !!anthropic);
  setStatus(openaiStatus, !!openai);
  saveStatus.textContent = 'Saved.';
  saveStatus.className = 'status success';

  setTimeout(() => {
    saveStatus.textContent = '';
  }, 2000);
}

toggleBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (target.type === 'password') {
      target.type = 'text';
      btn.textContent = 'Hide';
    } else {
      target.type = 'password';
      btn.textContent = 'Show';
    }
  });
});

saveBtn.addEventListener('click', saveSettings);
[anthropicInput, openaiInput].forEach((input) => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveSettings();
  });
});

loadSettings();
