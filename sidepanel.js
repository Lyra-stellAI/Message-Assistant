let customCache = {
  customPrompts: {},
  customTemplates: {},
  toneOverrides: {},
  lengthOverrides: {},
};

const DEFAULT_TONE = 'friendly';
const DEFAULT_LENGTH = 'medium';

async function loadCustomizations() {
  const storage = await chrome.storage.sync.get(CUSTOM_STORAGE_KEYS);
  customCache = getCustomizations(storage);
  rebuildDropdowns();
}

function rebuildDropdowns() {
  rebuildTemplateDropdown();
  rebuildToneDropdown();
  rebuildLengthDropdown();
}

function rebuildTemplateDropdown() {
  const prev = els.template.value;
  els.template.innerHTML = '';
  const builtIns = getEffectiveTemplates(customCache).filter((t) => !t.isCustom);
  const customs = getEffectiveTemplates(customCache).filter((t) => t.isCustom);

  for (const t of builtIns) {
    const opt = document.createElement('option');
    opt.value = t.key;
    opt.textContent = t.name;
    els.template.appendChild(opt);
  }
  if (customs.length) {
    const group = document.createElement('optgroup');
    group.label = 'Your message types';
    for (const t of customs) {
      const opt = document.createElement('option');
      opt.value = t.key;
      opt.textContent = t.name;
      group.appendChild(opt);
    }
    els.template.appendChild(group);
  }

  const all = [...builtIns, ...customs];
  els.template.value = all.some((t) => t.key === prev) ? prev : all[0]?.key || '';
}

function rebuildToneDropdown() {
  const prev = els.tone.value || DEFAULT_TONE;
  els.tone.innerHTML = '';
  const tones = getEffectiveTones(customCache);
  for (const t of tones) {
    const opt = document.createElement('option');
    opt.value = t.key;
    opt.textContent = t.label;
    els.tone.appendChild(opt);
  }
  els.tone.value = tones.some((t) => t.key === prev) ? prev : DEFAULT_TONE;
}

function rebuildLengthDropdown() {
  const prev = els.length.value || DEFAULT_LENGTH;
  els.length.innerHTML = '';
  const lengths = getEffectiveLengths(customCache);
  for (const l of lengths) {
    const opt = document.createElement('option');
    opt.value = l.key;
    opt.textContent = l.label;
    els.length.appendChild(opt);
  }
  els.length.value = lengths.some((l) => l.key === prev) ? prev : DEFAULT_LENGTH;
}

function currentTemplate() {
  return getEffectiveTemplates(customCache).find((t) => t.key === els.template.value);
}

const els = {
  template: document.getElementById('template'),
  context: document.getElementById('context'),
  goal: document.getElementById('goal'),
  tone: document.getElementById('tone'),
  length: document.getElementById('length'),
  model: document.getElementById('model'),
  customRow: document.getElementById('custom-row'),
  customProvider: document.getElementById('custom-provider'),
  customModel: document.getElementById('custom-model'),
  generate: document.getElementById('generate'),
  output: document.getElementById('output'),
  charCount: document.getElementById('char-count'),
  error: document.getElementById('error'),
  outputActions: document.getElementById('output-actions'),
  copyBtn: document.getElementById('copy-btn'),
  insertBtn: document.getElementById('insert-btn'),
  regenerateBtn: document.getElementById('regenerate-btn'),
  openSettings: document.getElementById('open-settings'),
  gotoSettings: document.getElementById('goto-settings'),
  noKeyWarning: document.getElementById('no-key-warning'),
  promptPreview: document.getElementById('prompt-preview'),
  promptCustomizedBadge: document.getElementById('prompt-customized-badge'),
  editPromptsLink: document.getElementById('edit-prompts-link'),
};

const PRESET_MODELS = new Set(
  Array.from(els.model.querySelectorAll('optgroup option'))
    .map((o) => o.value)
    .filter((v) => v && v !== '__custom__'),
);

function extractAnthropicDelta(data) {
  if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
    return data.delta.text;
  }
  return '';
}

function extractOpenAIDelta(data) {
  return data.choices?.[0]?.delta?.content || '';
}

function buildAnthropicRequest({ model, apiKey, system, user }) {
  return {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      stream: true,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  };
}

function openAICompatibleBuilder(url, maxTokensKey) {
  return ({ model, apiKey, system, user }) => ({
    url,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      stream_options: { include_usage: true },
      [maxTokensKey]: 4096,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
}

const PROVIDERS = {
  anthropic: {
    name: 'Anthropic',
    keyField: 'anthropicApiKey',
    inferPatterns: [/^claude-/i],
    buildRequest: buildAnthropicRequest,
    extractDelta: extractAnthropicDelta,
  },
  openai: {
    name: 'OpenAI',
    keyField: 'openaiApiKey',
    inferPatterns: [/^gpt-/i, /^o\d/i, /^chatgpt-/i],
    buildRequest: openAICompatibleBuilder('https://api.openai.com/v1/chat/completions', 'max_completion_tokens'),
    extractDelta: extractOpenAIDelta,
  },
  deepseek: {
    name: 'DeepSeek',
    keyField: 'deepseekApiKey',
    inferPatterns: [/^deepseek-/i],
    buildRequest: openAICompatibleBuilder('https://api.deepseek.com/chat/completions', 'max_tokens'),
    extractDelta: extractOpenAIDelta,
  },
  qwen: {
    name: 'Qwen',
    keyField: 'qwenApiKey',
    inferPatterns: [/^qwen/i, /^qwq/i],
    buildRequest: openAICompatibleBuilder('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', 'max_tokens'),
    extractDelta: extractOpenAIDelta,
  },
};

function inferProvider(model) {
  if (!model) return null;
  for (const [key, config] of Object.entries(PROVIDERS)) {
    if (config.inferPatterns.some((p) => p.test(model))) return key;
  }
  return null;
}

const REASONING_MODEL_PATTERNS = [
  /^o\d/i,
  /^gpt-5/i,
  /deepseek-reasoner/i,
  /^qwq/i,
];

function looksLikeReasoningModel(model) {
  return REASONING_MODEL_PATTERNS.some((p) => p.test(model || ''));
}

function emptyOutputMessage(usage, model) {
  const reasoning =
    usage?.completion_tokens_details?.reasoning_tokens ||
    usage?.output_tokens_details?.reasoning_tokens;
  const completion = usage?.completion_tokens ?? usage?.output_tokens;

  if (reasoning && reasoning > 0) {
    return `No visible output — the model used ${reasoning} reasoning tokens but the token budget ran out before it could produce an answer. Reasoning models (GPT-5, o-series, deepseek-reasoner, QwQ) need more headroom. Try a non-reasoning model (e.g. gpt-4o, deepseek-chat, qwen-plus), or shorten your prompt.`;
  }

  if (looksLikeReasoningModel(model)) {
    return `No visible output. "${model}" looks like a reasoning model — it may have used the entire token budget on internal reasoning. Try a non-reasoning model (gpt-4o, deepseek-chat, qwen-plus) or shorten your prompt.`;
  }

  if (completion === 0) {
    return 'The model returned 0 output tokens. Check the model ID and that your API key has access to it.';
  }

  return 'No output. Try again or check your settings (model ID, API key, custom prompt).';
}

async function migrateLegacyKey() {
  const stored = await chrome.storage.sync.get(['apiKey', 'anthropicApiKey']);
  if (stored.apiKey && !stored.anthropicApiKey) {
    await chrome.storage.sync.set({ anthropicApiKey: stored.apiKey });
    await chrome.storage.sync.remove('apiKey');
  }
}

async function checkApiKey() {
  await migrateLegacyKey();
  const keyFields = Object.values(PROVIDERS).map((p) => p.keyField);
  const stored = await chrome.storage.sync.get(keyFields);
  const hasAnyKey = keyFields.some((f) => !!stored[f]);
  els.noKeyWarning.classList.toggle('hidden', hasAnyKey);
  return hasAnyKey;
}

async function loadModel() {
  const { model, provider } = await chrome.storage.sync.get(['model', 'provider']);
  const saved = model || 'claude-opus-4-7';

  if (PRESET_MODELS.has(saved)) {
    els.model.value = saved;
    els.customRow.classList.add('hidden');
    els.customModel.value = '';
  } else {
    els.model.value = '__custom__';
    els.customRow.classList.remove('hidden');
    els.customModel.value = saved;
    els.customProvider.value = provider || inferProvider(saved) || 'anthropic';
  }
}

function getEffectiveModel() {
  if (els.model.value === '__custom__') {
    return els.customModel.value.trim() || 'claude-opus-4-7';
  }
  return els.model.value;
}

function getEffectiveProvider() {
  if (els.model.value === '__custom__') {
    return els.customProvider.value;
  }
  return inferProvider(els.model.value) || 'anthropic';
}

async function persistModelChoice() {
  const model = getEffectiveModel();
  const provider = getEffectiveProvider();
  if (!model) return;
  await chrome.storage.sync.set({ model, provider });
}

function buildPrompt() {
  const tmpl = currentTemplate();
  if (!tmpl) return { system: '', user: '' };

  const system = buildSystemPrompt({
    templateKey: tmpl.key,
    tone: els.tone.value,
    length: els.length.value,
    custom: customCache,
  });

  const ctx = els.context.value.trim();
  const goal = els.goal.value.trim();

  let user = '';
  if (ctx) user += `About the recipient:\n${ctx}\n\n`;
  if (goal) user += `My goal / what I want to say:\n${goal}\n\n`;
  if (!ctx && !goal) {
    user += 'Draft a generic example. ';
  }
  user += `Draft the ${tmpl.name.toLowerCase()}.`;

  return { system, user };
}

function updatePromptPreview() {
  const tmpl = currentTemplate();
  if (!tmpl) {
    els.promptPreview.textContent = '';
    return;
  }
  const system = buildSystemPrompt({
    templateKey: tmpl.key,
    tone: els.tone.value,
    length: els.length.value,
    custom: customCache,
  });
  els.promptPreview.textContent = system;
  els.promptCustomizedBadge.classList.toggle(
    'hidden',
    !isAnyCustomizationActive({
      templateKey: tmpl.key,
      tone: els.tone.value,
      length: els.length.value,
      custom: customCache,
    }),
  );
}

function showError(msg) {
  els.error.textContent = msg;
  els.error.classList.remove('hidden');
}

function clearError() {
  els.error.classList.add('hidden');
  els.error.textContent = '';
}

function updateCharCount() {
  const tmpl = currentTemplate();
  const text = els.output.innerText || '';
  const count = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (tmpl?.charLimit) {
    els.charCount.textContent = `${count} / ${tmpl.charLimit} characters`;
    els.charCount.classList.toggle('over-limit', count > tmpl.charLimit);
  } else {
    els.charCount.textContent = `${count} characters · ${words} words`;
    els.charCount.classList.remove('over-limit');
  }
  els.charCount.classList.toggle('hidden', !text);
}

async function generate() {
  clearError();
  els.outputActions.classList.add('hidden');
  els.output.textContent = '';
  els.charCount.classList.add('hidden');
  els.generate.disabled = true;
  els.generate.textContent = 'Generating...';

  const provider = getEffectiveProvider();
  const model = getEffectiveModel();
  const { system, user } = buildPrompt();

  try {
    await persistModelChoice();
    await migrateLegacyKey();

    const config = PROVIDERS[provider];
    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const stored = await chrome.storage.sync.get(config.keyField);
    const apiKey = stored[config.keyField];
    if (!apiKey) {
      throw new Error(`No ${config.name} API key configured. Open Settings to add one.`);
    }

    const { url, headers, body } = config.buildRequest({ model, apiKey, system, user });

    const response = await fetch(url, { method: 'POST', headers, body });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errText;
      } catch {}
      throw new Error(`HTTP ${response.status}: ${errMsg}`);
    }

    const extractDelta = config.extractDelta;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let lastUsage = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6).trim();
        if (!dataStr || dataStr === '[DONE]') continue;

        let data;
        try {
          data = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (data.error) {
          throw new Error(data.error?.message || 'Stream error');
        }

        if (data.usage) lastUsage = data.usage;
        if (data.type === 'message_delta' && data.usage) lastUsage = data.usage;

        const text = extractDelta(data);
        if (text) {
          fullText += text;
          els.output.textContent = fullText;
          updateCharCount();
        }
      }
    }

    if (!fullText.trim()) {
      throw new Error(emptyOutputMessage(lastUsage, model));
    }

    els.outputActions.classList.remove('hidden');
    updateCharCount();
  } catch (err) {
    showError(err.message || 'Failed to generate. Check your API key and try again.');
    els.output.textContent = '';
    els.charCount.classList.add('hidden');
  } finally {
    els.generate.disabled = false;
    els.generate.textContent = 'Generate';
  }
}

async function copyOutput() {
  const text = els.output.innerText;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    els.copyBtn.textContent = 'Copied';
    setTimeout(() => {
      els.copyBtn.textContent = 'Copy';
    }, 1500);
  } catch {
    showError('Failed to copy to clipboard.');
  }
}

function insertIntoFocusedElement(text) {
  const el = document.activeElement;
  if (!el || el === document.body || el.tagName === 'HTML') {
    return { success: false, reason: 'No focused text field on this page. Click into a text field first, then click Insert.' };
  }

  const tag = el.tagName;
  if (tag === 'TEXTAREA' || (tag === 'INPUT' && /^(text|search|email|url|tel)$/i.test(el.type))) {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { success: true };
  }

  if (el.isContentEditable) {
    el.focus();
    const ok = document.execCommand('insertText', false, text);
    if (!ok) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
      } else {
        el.textContent += text;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return { success: true };
  }

  return { success: false, reason: 'Focused element is not a text input. Click into a text field first.' };
}

async function insertOutput() {
  const text = els.output.innerText;
  if (!text) return;
  clearError();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('No active tab.');

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: insertIntoFocusedElement,
      args: [text],
    });

    const result = results[0]?.result;
    if (!result?.success) {
      throw new Error(result?.reason || 'Could not insert.');
    }

    els.insertBtn.textContent = 'Inserted';
    setTimeout(() => {
      els.insertBtn.textContent = 'Insert';
    }, 1500);
  } catch (err) {
    showError(`Insert failed: ${err.message}`);
  }
}

els.generate.addEventListener('click', generate);
els.copyBtn.addEventListener('click', copyOutput);
els.insertBtn.addEventListener('click', insertOutput);
els.regenerateBtn.addEventListener('click', generate);
els.output.addEventListener('input', updateCharCount);
els.template.addEventListener('change', () => {
  if (els.output.innerText.trim()) updateCharCount();
  updatePromptPreview();
});
els.tone.addEventListener('change', updatePromptPreview);
els.length.addEventListener('change', updatePromptPreview);
els.editPromptsLink?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (CUSTOM_STORAGE_KEYS.some((k) => k in changes)) {
    loadCustomizations().then(updatePromptPreview);
  }
});
els.model.addEventListener('change', async () => {
  const isCustom = els.model.value === '__custom__';
  els.customRow.classList.toggle('hidden', !isCustom);
  if (isCustom) {
    els.customModel.focus();
  } else {
    await persistModelChoice();
  }
});
els.customProvider.addEventListener('change', persistModelChoice);
els.customModel.addEventListener('change', persistModelChoice);
els.openSettings.addEventListener('click', () => chrome.runtime.openOptionsPage());
els.gotoSettings?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

checkApiKey();
loadModel();
loadCustomizations().then(updatePromptPreview);
