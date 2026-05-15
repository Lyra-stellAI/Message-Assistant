const FIELDS = [
  { id: 'anthropicApiKey', storage: 'anthropicApiKey', statusId: 'anthropic-status', name: 'Anthropic', expectedPrefix: 'sk-ant-' },
  { id: 'openaiApiKey', storage: 'openaiApiKey', statusId: 'openai-status', name: 'OpenAI', expectedPrefix: 'sk-' },
  { id: 'deepseekApiKey', storage: 'deepseekApiKey', statusId: 'deepseek-status', name: 'DeepSeek', expectedPrefix: 'sk-' },
  { id: 'qwenApiKey', storage: 'qwenApiKey', statusId: 'qwen-status', name: 'Qwen', expectedPrefix: 'sk-' },
];

const saveBtn = document.getElementById('save');
const saveStatus = document.getElementById('save-status');
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
  const keys = FIELDS.map((f) => f.storage);
  const stored = await chrome.storage.sync.get(keys);
  for (const field of FIELDS) {
    const input = document.getElementById(field.id);
    const status = document.getElementById(field.statusId);
    if (stored[field.storage]) {
      input.value = stored[field.storage];
    }
    setStatus(status, !!stored[field.storage]);
  }
}

function validate(field, value) {
  if (!value) return { ok: true };
  if (!value.startsWith(field.expectedPrefix)) {
    return { ok: false, msg: `${field.name} key should start with "${field.expectedPrefix}".` };
  }
  return { ok: true };
}

async function saveSettings() {
  const values = FIELDS.map((f) => ({
    field: f,
    value: document.getElementById(f.id).value.trim(),
  }));

  if (values.every((v) => !v.value)) {
    saveStatus.textContent = 'Add at least one API key.';
    saveStatus.className = 'status error';
    return;
  }

  for (const { field, value } of values) {
    const check = validate(field, value);
    if (!check.ok) {
      saveStatus.textContent = check.msg;
      saveStatus.className = 'status error';
      return;
    }
  }

  const updates = {};
  const removes = [];
  for (const { field, value } of values) {
    if (value) updates[field.storage] = value;
    else removes.push(field.storage);
  }

  if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
  if (removes.length) await chrome.storage.sync.remove(removes);

  for (const { field, value } of values) {
    const status = document.getElementById(field.statusId);
    setStatus(status, !!value);
  }

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
FIELDS.forEach((f) => {
  const input = document.getElementById(f.id);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveSettings();
  });
});

loadSettings();
