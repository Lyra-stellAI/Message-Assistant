const FIELDS = [
  { id: 'anthropicApiKey', storage: 'anthropicApiKey', statusId: 'anthropic-status', name: 'Anthropic', expectedPrefix: 'sk-ant-' },
  { id: 'openaiApiKey', storage: 'openaiApiKey', statusId: 'openai-status', name: 'OpenAI', expectedPrefix: 'sk-' },
  { id: 'deepseekApiKey', storage: 'deepseekApiKey', statusId: 'deepseek-status', name: 'DeepSeek', expectedPrefix: 'sk-' },
  { id: 'qwenApiKey', storage: 'qwenApiKey', statusId: 'qwen-status', name: 'Qwen', expectedPrefix: 'sk-' },
];

const saveBtn = document.getElementById('save');
const saveStatus = document.getElementById('save-status');
const toggleBtns = document.querySelectorAll('.toggle-visibility');
const templatesSection = document.getElementById('templates-section');
const tonesSection = document.getElementById('tones-section');
const lengthsSection = document.getElementById('lengths-section');
const addTemplateBtn = document.getElementById('add-template');

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
    if (stored[field.storage]) input.value = stored[field.storage];
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

async function updateStorageEntry(parentKey, itemKey, value) {
  const stored = await chrome.storage.sync.get(parentKey);
  const dict = { ...(stored[parentKey] || {}) };
  if (value === null || value === undefined || value === '') {
    delete dict[itemKey];
  } else {
    dict[itemKey] = value;
  }
  if (Object.keys(dict).length === 0) {
    await chrome.storage.sync.remove(parentKey);
  } else {
    await chrome.storage.sync.set({ [parentKey]: dict });
  }
}

function flashStatus(el, text, kind = 'success') {
  el.textContent = text;
  el.className = `status ${kind}`;
  setTimeout(() => {
    el.textContent = '';
  }, 1500);
}

async function renderCustomizations() {
  const storage = await chrome.storage.sync.get(CUSTOM_STORAGE_KEYS);
  const c = getCustomizations(storage);

  templatesSection.innerHTML = '';
  for (const t of getEffectiveTemplates(c)) {
    templatesSection.appendChild(
      t.isCustom ? makeCustomTemplateEditor(t) : makeBuiltinTemplateEditor(t),
    );
  }

  tonesSection.innerHTML = '';
  for (const tone of getEffectiveTones(c)) {
    tonesSection.appendChild(makeDescriptorEditor(tone, 'toneOverrides'));
  }

  lengthsSection.innerHTML = '';
  for (const length of getEffectiveLengths(c)) {
    lengthsSection.appendChild(makeDescriptorEditor(length, 'lengthOverrides'));
  }
}

function makeSummaryRow(labelText, badgeText, badgeVisible, badgeStyle) {
  const summary = document.createElement('summary');
  const labelSpan = document.createElement('span');
  labelSpan.textContent = labelText;
  summary.appendChild(labelSpan);

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = badgeText;
  badge.style.display = badgeVisible ? '' : 'none';
  if (badgeStyle === 'custom') {
    badge.style.background = '#dbeafe';
    badge.style.color = '#1e40af';
    badge.style.borderColor = '#bfdbfe';
  }
  summary.appendChild(badge);
  return { summary, badge, labelSpan };
}

function makeBuiltinTemplateEditor(t) {
  const details = document.createElement('details');
  details.className = 'prompt-editor';
  if (t.hasPromptOverride) details.open = true;

  const { summary, badge } = makeSummaryRow(t.name, 'customized', t.hasPromptOverride);
  details.appendChild(summary);

  const defaultLabel = document.createElement('div');
  defaultLabel.className = 'default-prompt-label';
  defaultLabel.textContent = 'Default (built-in):';
  details.appendChild(defaultLabel);

  const defaultPre = document.createElement('pre');
  defaultPre.className = 'default-prompt';
  defaultPre.textContent = t.defaultSystemPrompt;
  details.appendChild(defaultPre);

  const overrideLabel = document.createElement('div');
  overrideLabel.className = 'override-prompt-label';
  overrideLabel.textContent = 'Your override (leave empty to use the default):';
  details.appendChild(overrideLabel);

  const textarea = document.createElement('textarea');
  textarea.rows = 10;
  textarea.value = t.hasPromptOverride ? t.systemPrompt : '';
  textarea.placeholder = 'Type your custom prompt here. Leave empty to keep using the default above.';
  details.appendChild(textarea);

  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  const saveBtn2 = document.createElement('button');
  saveBtn2.type = 'button';
  saveBtn2.textContent = 'Save';
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'secondary';
  copyBtn.textContent = 'Copy default into editor';
  copyBtn.addEventListener('click', () => {
    textarea.value = t.defaultSystemPrompt;
    textarea.focus();
  });
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'secondary';
  clearBtn.textContent = 'Clear override';
  const status = document.createElement('span');
  status.className = 'status';

  saveBtn2.addEventListener('click', async () => {
    const value = textarea.value.trim();
    await updateStorageEntry('customPrompts', t.key, value || null);
    badge.style.display = value ? '' : 'none';
    flashStatus(status, value ? 'Saved.' : 'Cleared. Using default.');
  });
  clearBtn.addEventListener('click', async () => {
    textarea.value = '';
    await updateStorageEntry('customPrompts', t.key, null);
    badge.style.display = 'none';
    flashStatus(status, 'Cleared. Using default.');
  });

  actions.appendChild(saveBtn2);
  actions.appendChild(copyBtn);
  actions.appendChild(clearBtn);
  actions.appendChild(status);
  details.appendChild(actions);
  return details;
}

function makeCustomTemplateEditor(t) {
  const details = document.createElement('details');
  details.className = 'prompt-editor';
  details.open = true;

  const { summary, labelSpan } = makeSummaryRow(t.name || 'Untitled', 'custom', true, 'custom');
  details.appendChild(summary);

  const nameLabel = document.createElement('div');
  nameLabel.className = 'override-prompt-label';
  nameLabel.textContent = 'Message type name (shown in the dropdown):';
  details.appendChild(nameLabel);
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = t.name || '';
  nameInput.placeholder = 'e.g. Business email to partner';
  details.appendChild(nameInput);

  const promptLabel = document.createElement('div');
  promptLabel.className = 'override-prompt-label';
  promptLabel.textContent = 'System prompt:';
  details.appendChild(promptLabel);
  const textarea = document.createElement('textarea');
  textarea.rows = 10;
  textarea.value = t.systemPrompt || '';
  textarea.placeholder = 'Write the system prompt the model will follow for this message type. Tone and length descriptors are appended automatically.';
  details.appendChild(textarea);

  const limitLabel = document.createElement('div');
  limitLabel.className = 'override-prompt-label';
  limitLabel.textContent = 'Character limit (optional — leave empty for no limit):';
  details.appendChild(limitLabel);
  const limitInput = document.createElement('input');
  limitInput.type = 'number';
  limitInput.min = '1';
  limitInput.value = t.charLimit ?? '';
  limitInput.placeholder = 'e.g. 300 for a LinkedIn-style note';
  details.appendChild(limitInput);

  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  const saveBtn2 = document.createElement('button');
  saveBtn2.type = 'button';
  saveBtn2.textContent = 'Save';
  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'secondary delete-btn';
  deleteBtn.textContent = 'Delete';
  const status = document.createElement('span');
  status.className = 'status';

  saveBtn2.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const systemPrompt = textarea.value.trim();
    if (!name) return flashStatus(status, 'Name is required.', 'error');
    if (!systemPrompt) return flashStatus(status, 'System prompt is required.', 'error');
    const charLimitRaw = limitInput.value.trim();
    const charLimit = charLimitRaw ? parseInt(charLimitRaw, 10) : null;
    if (charLimitRaw && (isNaN(charLimit) || charLimit < 1)) {
      return flashStatus(status, 'Character limit must be a positive number.', 'error');
    }
    await updateStorageEntry('customTemplates', t.key, { name, systemPrompt, charLimit });
    labelSpan.textContent = name;
    flashStatus(status, 'Saved.');
  });

  deleteBtn.addEventListener('click', async () => {
    if (!confirm(`Delete "${t.name || 'this message type'}"?`)) return;
    await updateStorageEntry('customTemplates', t.key, null);
    await updateStorageEntry('customPrompts', t.key, null);
    await renderCustomizations();
  });

  actions.appendChild(saveBtn2);
  actions.appendChild(deleteBtn);
  actions.appendChild(status);
  details.appendChild(actions);
  return details;
}

function makeDescriptorEditor(item, storageKey) {
  const details = document.createElement('details');
  details.className = 'prompt-editor';
  if (item.hasOverride) details.open = true;

  const { summary, badge } = makeSummaryRow(item.label, 'customized', item.hasOverride);
  details.appendChild(summary);

  const defaultLabel = document.createElement('div');
  defaultLabel.className = 'default-prompt-label';
  defaultLabel.textContent = 'Default (built-in):';
  details.appendChild(defaultLabel);
  const defaultPre = document.createElement('pre');
  defaultPre.className = 'default-prompt';
  defaultPre.textContent = item.defaultDescriptor;
  details.appendChild(defaultPre);

  const overrideLabel = document.createElement('div');
  overrideLabel.className = 'override-prompt-label';
  overrideLabel.textContent = 'Your override (leave empty to use the default):';
  details.appendChild(overrideLabel);
  const textarea = document.createElement('textarea');
  textarea.rows = 2;
  textarea.value = item.hasOverride ? item.descriptor : '';
  textarea.placeholder = item.defaultDescriptor;
  details.appendChild(textarea);

  const actions = document.createElement('div');
  actions.className = 'prompt-actions';
  const saveBtn2 = document.createElement('button');
  saveBtn2.type = 'button';
  saveBtn2.textContent = 'Save';
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'secondary';
  clearBtn.textContent = 'Clear override';
  const status = document.createElement('span');
  status.className = 'status';

  saveBtn2.addEventListener('click', async () => {
    const value = textarea.value.trim();
    await updateStorageEntry(storageKey, item.key, value || null);
    badge.style.display = value ? '' : 'none';
    flashStatus(status, value ? 'Saved.' : 'Cleared. Using default.');
  });
  clearBtn.addEventListener('click', async () => {
    textarea.value = '';
    await updateStorageEntry(storageKey, item.key, null);
    badge.style.display = 'none';
    flashStatus(status, 'Cleared. Using default.');
  });

  actions.appendChild(saveBtn2);
  actions.appendChild(clearBtn);
  actions.appendChild(status);
  details.appendChild(actions);
  return details;
}

addTemplateBtn.addEventListener('click', async () => {
  const newKey = `custom_${Date.now()}`;
  await updateStorageEntry('customTemplates', newKey, {
    name: 'New message type',
    systemPrompt:
      'You help draft a message. Follow the user\'s instructions about what to write. Be specific to the context they\'ve given you. No emojis unless asked. Output only the message text. No preamble or labels.',
    charLimit: null,
  });
  await renderCustomizations();
  const editors = templatesSection.querySelectorAll(':scope > details');
  const last = editors[editors.length - 1];
  last?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  last?.querySelector('input[type="text"]')?.focus();
});

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
renderCustomizations();
