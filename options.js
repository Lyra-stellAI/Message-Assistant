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

async function renderPromptEditors() {
  const promptsSection = document.getElementById('prompts-section');
  const { customPrompts } = await chrome.storage.sync.get('customPrompts');
  const overrides = customPrompts || {};

  promptsSection.innerHTML = '';

  for (const [key, tmpl] of Object.entries(TEMPLATES)) {
    const override = overrides[key] || '';
    const isCustomized = !!override.trim();

    const details = document.createElement('details');
    details.className = 'prompt-editor';
    if (isCustomized) details.open = true;

    const summary = document.createElement('summary');
    summary.innerHTML = `<span>${tmpl.name}</span>`;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = 'customized';
    badge.style.display = isCustomized ? '' : 'none';
    summary.appendChild(badge);
    details.appendChild(summary);

    const defaultLabel = document.createElement('div');
    defaultLabel.className = 'default-prompt-label';
    defaultLabel.textContent = 'Default (built-in):';
    details.appendChild(defaultLabel);

    const defaultPre = document.createElement('pre');
    defaultPre.className = 'default-prompt';
    defaultPre.textContent = tmpl.systemPrompt;
    details.appendChild(defaultPre);

    const overrideLabel = document.createElement('div');
    overrideLabel.className = 'override-prompt-label';
    overrideLabel.textContent = 'Your override (leave empty to use the default):';
    details.appendChild(overrideLabel);

    const textarea = document.createElement('textarea');
    textarea.dataset.templateKey = key;
    textarea.rows = 10;
    textarea.placeholder = 'Type your custom prompt here. Leave empty to keep using the default above.';
    textarea.value = override;
    details.appendChild(textarea);

    const actions = document.createElement('div');
    actions.className = 'prompt-actions';

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => savePrompt(key, textarea, badge, details));
    actions.appendChild(saveBtn);

    const copyDefaultBtn = document.createElement('button');
    copyDefaultBtn.type = 'button';
    copyDefaultBtn.className = 'secondary';
    copyDefaultBtn.textContent = 'Copy default into editor';
    copyDefaultBtn.title = 'Pre-fill the override with the default so you can edit from there';
    copyDefaultBtn.addEventListener('click', () => {
      textarea.value = tmpl.systemPrompt;
      textarea.focus();
    });
    actions.appendChild(copyDefaultBtn);

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'secondary';
    clearBtn.textContent = 'Clear override';
    clearBtn.addEventListener('click', () => {
      textarea.value = '';
      savePrompt(key, textarea, badge, details);
    });
    actions.appendChild(clearBtn);

    const promptStatus = document.createElement('span');
    promptStatus.className = 'status';
    actions.appendChild(promptStatus);
    saveBtn.dataset.statusTarget = '';
    saveBtn.addEventListener('click', () => {
      promptStatus.textContent = 'Saved.';
      promptStatus.className = 'status success';
      setTimeout(() => {
        promptStatus.textContent = '';
      }, 1500);
    });
    clearBtn.addEventListener('click', () => {
      promptStatus.textContent = 'Cleared. Using default.';
      promptStatus.className = 'status success';
      setTimeout(() => {
        promptStatus.textContent = '';
      }, 1500);
    });

    details.appendChild(actions);
    promptsSection.appendChild(details);
  }
}

async function savePrompt(key, textarea, badge, details) {
  const value = textarea.value.trim();
  const { customPrompts } = await chrome.storage.sync.get('customPrompts');
  const updated = { ...(customPrompts || {}) };

  if (value) {
    updated[key] = value;
    badge.style.display = '';
  } else {
    delete updated[key];
    badge.style.display = 'none';
  }

  await chrome.storage.sync.set({ customPrompts: updated });
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
renderPromptEditors();
