const TEMPLATES = {
  linkedin_connection: {
    name: 'LinkedIn connection note',
    charLimit: 300,
    systemPrompt: `You write LinkedIn connection request notes that get accepted.

Rules:
- LinkedIn connection notes have a 300-character hard limit. Stay well under it.
- Be specific to the recipient — reference something concrete from their background.
- State the genuine reason for connecting in one short sentence.
- No emojis. No buzzwords ("synergy", "leverage", "circle back"). No "I hope this finds you well".
- Sound like a person, not a template.
- Output only the note text. No preamble, no quotes, no labels.`,
  },
  linkedin_message: {
    name: 'LinkedIn cold message',
    charLimit: null,
    systemPrompt: `You write cold LinkedIn messages that get replies.

Rules:
- Open with a specific reference to the recipient's work — not generic flattery.
- One clear ask. Make it easy to say yes (a 15-minute call, a quick reply, an intro).
- No multi-paragraph pitches. People scan on mobile.
- No emojis. No buzzwords. No "I hope this finds you well".
- Sign off naturally.
- Output only the message text. No preamble, no subject line, no labels.`,
  },
  cold_email: {
    name: 'Cold email',
    charLimit: null,
    systemPrompt: `You write cold emails that get opened, read, and replied to.

Rules:
- Start with a subject line on its own line, prefixed exactly "Subject: ".
- The first sentence must earn the second sentence. Specific, not generic.
- Show you've done research on the recipient and their context.
- One clear ask. Lower the activation energy for a reply.
- 4 to 7 sentences in the body. Short paragraphs.
- No emojis. No marketing-speak. No "Just following up" or "Quick question".
- Output the subject line, a blank line, then the email body. No other preamble or labels.`,
  },
  followup: {
    name: 'Follow-up',
    charLimit: null,
    systemPrompt: `You write follow-up messages that re-engage without nagging.

Rules:
- Acknowledge the prior context briefly — one short sentence.
- Add new value or a fresh angle. Don't just bump the thread.
- Make the next step easy and explicit.
- Keep it short. Respect their time.
- No "Just circling back", no "Per my last email", no guilt.
- Output only the follow-up text. No preamble or labels.`,
  },
  thank_you: {
    name: 'Thank you note',
    charLimit: null,
    systemPrompt: `You write thank you notes that feel personal and genuine.

Rules:
- Reference the specific thing you're thanking them for.
- Note what it meant or what came of it.
- Keep it warm and unhurried. Don't pivot to an ask.
- Short is fine. Sincere is the goal.
- Output only the note text. No preamble or labels.`,
  },
  custom: {
    name: 'Custom message',
    charLimit: null,
    systemPrompt: `You help draft messages, emails, and notes.

Rules:
- Follow the user's instructions about what to write.
- Be specific to the context they've given you.
- Match the requested tone and length.
- No emojis unless asked.
- Output only the message text. No preamble or labels.`,
  },
};

const TONE_DESCRIPTORS = {
  professional: 'Professional and polished — appropriate for business communication.',
  friendly: 'Friendly and warm — approachable but still respectful.',
  casual: 'Casual and conversational — relaxed, like writing to a peer.',
  direct: 'Direct and concise — no fluff, get to the point fast.',
  warm: 'Warm and personable — human, with genuine care for the recipient.',
};

const LENGTH_DESCRIPTORS = {
  short: 'Keep it very short — under 50 words.',
  medium: 'Medium length — roughly 60 to 120 words.',
  long: 'Longer — up to 200 words if the content justifies it.',
};

const els = {
  template: document.getElementById('template'),
  context: document.getElementById('context'),
  goal: document.getElementById('goal'),
  tone: document.getElementById('tone'),
  length: document.getElementById('length'),
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
};

async function checkApiKey() {
  const { apiKey } = await chrome.storage.sync.get('apiKey');
  els.noKeyWarning.classList.toggle('hidden', !!apiKey);
  return !!apiKey;
}

function buildPrompt() {
  const tmpl = TEMPLATES[els.template.value];
  const tone = TONE_DESCRIPTORS[els.tone.value];
  const length = LENGTH_DESCRIPTORS[els.length.value];

  let system = `${tmpl.systemPrompt}\n\nTone: ${tone}\n${length}`;
  if (tmpl.charLimit) {
    system += `\n\nHARD CHARACTER LIMIT: ${tmpl.charLimit} characters. Do not exceed.`;
  }

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

function showError(msg) {
  els.error.textContent = msg;
  els.error.classList.remove('hidden');
}

function clearError() {
  els.error.classList.add('hidden');
  els.error.textContent = '';
}

function updateCharCount() {
  const tmpl = TEMPLATES[els.template.value];
  const text = els.output.innerText || '';
  const count = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (tmpl.charLimit) {
    els.charCount.textContent = `${count} / ${tmpl.charLimit} characters`;
    els.charCount.classList.toggle('over-limit', count > tmpl.charLimit);
  } else {
    els.charCount.textContent = `${count} characters · ${words} words`;
    els.charCount.classList.remove('over-limit');
  }
  els.charCount.classList.toggle('hidden', !text);
}

async function generate() {
  if (!(await checkApiKey())) return;

  clearError();
  els.outputActions.classList.add('hidden');
  els.output.textContent = '';
  els.charCount.classList.add('hidden');
  els.generate.disabled = true;
  els.generate.textContent = 'Generating...';

  const { system, user } = buildPrompt();

  try {
    const { apiKey, model } = await chrome.storage.sync.get(['apiKey', 'model']);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: model || 'claude-opus-4-7',
        max_tokens: 1024,
        stream: true,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errText;
      } catch {}
      throw new Error(`HTTP ${response.status}: ${errMsg}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6);
        if (!dataStr) continue;

        let data;
        try {
          data = JSON.parse(dataStr);
        } catch {
          continue;
        }

        if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
          fullText += data.delta.text;
          els.output.textContent = fullText;
          updateCharCount();
        } else if (data.type === 'error') {
          throw new Error(data.error?.message || 'Stream error');
        }
      }
    }

    if (!fullText.trim()) {
      throw new Error('No output. Try again or check your settings.');
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
});
els.openSettings.addEventListener('click', () => chrome.runtime.openOptionsPage());
els.gotoSettings?.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

checkApiKey();
