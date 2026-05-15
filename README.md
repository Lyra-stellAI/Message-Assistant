# Message Assistant

<p align="center">
<img width="280" height="150" alt="Gemini_Generated_Image_qbdqjlqbdqjlqbdq" src="https://github.com/user-attachments/assets/9b809208-dbcd-4552-aee9-150a831e900c" />
</p>

<p align="center">
  An AI-powered Chrome extension that drafts LinkedIn notes, cold messages, emails, follow-ups, and more — directly in your browser sidebar. Saves your personal context (resume, projects, expertise) so every draft is grounded in who you actually are.
</p>

---

## What it does

Click the extension icon → a side panel opens that stays visible across tabs. Pick a message type, paste the recipient's info, say what you want to convey, choose tone and length, click **Generate** — a polished draft streams in. **Copy** to clipboard or **Insert** directly into the focused text field on the active page.

## Features

- **6 built-in message types** — LinkedIn connection note (with 300-char enforcement), LinkedIn cold message, cold email (auto subject line), follow-up, thank you, and a free-form custom mode
- **Your profile, sent automatically** — save your bio / resume / projects once in Settings; every generation can reference it without copy-pasting. Toggleable per-generation.
- **Add your own message types** — define entirely new templates (e.g. "Business email to partner") with name, system prompt, and optional character limit. Appear in a `Your message types` group in the side panel dropdown.
- **5 LLM providers, ~30 models in the dropdown** — Anthropic, OpenAI (GPT-5 family + GPT-4.1/4o), DeepSeek (V3 + R1), Qwen 3.x family, plus any custom model ID
- **Editable prompts, tones, and lengths** — every default the model sees is overridable from Settings; overrides take effect instantly
- **Live system-prompt preview** — see the exact prompt that will be sent before you generate; updates as you tweak any dropdown
- **Live streaming** — watch the draft appear token by token
- **Copy & Insert** — put on clipboard, or push directly into LinkedIn / Gmail / Twitter / any text field on the active tab
- **Reasoning-model aware** — when GPT-5 / o-series / DeepSeek-Reasoner / QwQ use the entire token budget on reasoning, the empty-output error tells you so explicitly rather than failing silently

## Supported models

| Provider | Models in the dropdown |
|---|---|
| **Anthropic** | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5, Opus 4.6, Sonnet 4.5 |
| **OpenAI** | GPT-5.5, GPT-5.5 Pro, GPT-5.4 (+ Pro / Mini / Nano), GPT-5.2 (+ Pro), GPT-5 (+ Mini / Nano), GPT-4.1 (+ Mini), GPT-4o (+ Mini), GPT-4 Turbo |
| **DeepSeek** | DeepSeek Chat (V3), DeepSeek Reasoner (R1) |
| **Qwen (Alibaba)** | Qwen3.6 Max Preview / Plus / Flash, Qwen3.5 Plus / Flash, Qwen3 Max / Max Preview, Qwen Plus (+ Latest) / Flash / Turbo, QwQ Plus (reasoning), Qwen Max (legacy) |
| **Custom** | Any model ID from any of the four providers above — picked from the Custom slot in the dropdown |

## Installation

The extension isn't on the Chrome Web Store — you install it manually as an **unpacked extension**. Takes about two minutes. Detailed walkthrough below.

### Step 1 — Get the code onto your computer

Pick whichever you prefer:

**Option A — Git (recommended if you'll pull updates later):**
```sh
git clone https://github.com/Lyra-stellAI/Message-Assistant.git
cd Message-Assistant
```

**Option B — ZIP download (no git needed):**
1. Open https://github.com/Lyra-stellAI/Message-Assistant in your browser
2. Click the green **Code** button (top-right of the file list)
3. Click **Download ZIP**
4. Unzip it somewhere stable on your computer — e.g. `~/Documents/Message-Assistant/` on macOS/Linux, or `C:\Users\<you>\Documents\Message-Assistant\` on Windows
5. **Don't put it in Downloads** — Chrome will keep using whatever path you pick, so use a folder you won't move or delete

### Step 2 — Open the Chrome Extensions page

- Open Chrome
- In the address bar, type `chrome://extensions` and press Enter
- (Alternative: click the three-dot menu top-right → **Extensions** → **Manage Extensions**)

### Step 3 — Enable Developer mode

- Look for the **Developer mode** toggle in the **top-right** of the extensions page
- Switch it **on**
- A new row of buttons appears at the top: **Load unpacked**, **Pack extension**, **Update**

### Step 4 — Load the unpacked extension

- Click **Load unpacked**
- A folder picker opens. Navigate to the project folder you cloned or unzipped
- **Important:** select the folder that contains `manifest.json` directly (not a parent folder, not a subfolder). The selected folder should show `manifest.json`, `sidepanel.html`, `options.html`, `templates.js`, etc. when you peek inside.
- Click **Select Folder** / **Open**

You should now see a **Message Assistant** card on the extensions page. The Settings page opens automatically on first install.

### Step 5 — Pin the extension to your toolbar (so you can find it)

By default Chrome hides newly-installed extensions in a puzzle-piece menu.

- Click the **puzzle-piece icon** in the Chrome toolbar (right of the address bar)
- Find **Message Assistant** in the list
- Click the **pin icon** next to it
- The extension's icon now lives in your toolbar permanently

### Step 6 — Add your API keys

If the Settings page didn't open automatically, right-click the extension's toolbar icon → **Options** (or click **Details** on the extensions page → **Extension options**).

- Paste an API key for **at least one** provider — Anthropic, OpenAI, DeepSeek, or Qwen (see the "Where to get API keys" table below)
- Click **Save settings**

You only need keys for the providers you'll use. Keys are stored locally in `chrome.storage.sync` and sent only to that provider's API.

### Step 7 — Start drafting

- Click the **Message Assistant** icon in your toolbar
- The side panel opens on the right
- Pick a message type, paste recipient info and your goal, hit **Generate**

That's it.

---

### Updating the extension

When you pull new code or someone pushes a change:

```sh
cd Message-Assistant
git pull
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Find the **Message Assistant** card
3. Click the **circular refresh icon** in the bottom-right corner of the card
4. Reopen the side panel (the old one may still show the previous version until refreshed)

For some changes — particularly manifest changes — a full Chrome restart picks them up reliably. For most code changes, the refresh icon is enough.

### Uninstalling

- `chrome://extensions` → find Message Assistant → click **Remove** → confirm
- Stored data (API keys, profile, customizations) is wiped along with the extension. Back up first if you want to keep your profile / overrides.

### Troubleshooting

| Symptom | Likely cause + fix |
|---|---|
| "Manifest file is missing or unreadable" on Load unpacked | You selected a folder that doesn't contain `manifest.json`. Re-pick the folder one level deeper (the one that actually contains the JS/HTML files). |
| Extension card shows red **Errors** button | Click it to see the stack trace. Often a missing referenced file (e.g. icon paths in `manifest.json` that don't resolve). |
| Side panel doesn't open when I click the icon | Make sure you're on Chrome **114 or newer** (`chrome://settings/help` to check). Side panels need 114+. |
| Side panel opens blank or stuck on a spinner | Open DevTools on the side panel: right-click inside the panel → **Inspect**. Check the **Console** tab for errors. |
| "No API key configured" warning | You haven't added an API key for the provider whose model is selected. Either pick a model from a provider you do have a key for, or add the key in Settings. |
| HTTP 401 / 403 from a provider | Wrong or expired API key. Generate a new one and update Settings. |
| HTTP 429 | Rate-limited. Wait, or switch to a different provider/model. |
| "No visible output" with a reasoning model | The model burned the entire token budget on internal reasoning. Switch to a non-reasoning model (gpt-4o, deepseek-chat, qwen-plus) — they're faster and cheaper for short messages anyway. |
| Toolbar shows a generic puzzle piece, not a custom icon | The icon files aren't set up. See **Setting up the toolbar icon** below — optional, the extension still works. |
| Settings button missing in side panel header | Side panel is too narrow and the button is being clipped. Drag the left edge of the panel to widen it. |

### Where to get API keys

| Provider | Key page | Key prefix |
|---|---|---|
| Anthropic | https://console.anthropic.com/settings/keys | `sk-ant-` |
| OpenAI | https://platform.openai.com/api-keys | `sk-` |
| DeepSeek | https://platform.deepseek.com/api_keys | `sk-` |
| Qwen / DashScope | https://dashscope.console.aliyun.com/apiKey | `sk-` |

You only need keys for the providers you actually want to use. Keys stay in `chrome.storage.sync` locally and are sent only to that provider's API endpoint.

## Usage

1. Click the extension icon → the side panel opens
2. **Message type** — pick the kind of message
3. **About the recipient** — paste their LinkedIn profile blurb, role, company, something specific you noticed
4. **What do you want to say** — your reason for reaching out, your ask, talking points
5. **Tone**, **Length**, **Model** — tune
6. **Include my profile** — checkbox at the top of the form (visible once you've saved a profile in Settings). Default on.
7. **Generate** — watch it stream in
8. Edit the output in place if needed, then **Copy** or click into a text field on the active tab and **Insert**

## Your profile (context engineering)

The single biggest quality boost for cold outreach: store your background once, get it injected into every generation automatically.

1. Open Settings (button in the side panel header, or right-click the extension icon → Options)
2. Scroll to **Your profile**
3. Paste a free-form bio: current role, company, years of experience, notable projects with measurable outcomes, education, skills, anything you want the model to reference
4. **Save profile**

From then on, every generation includes a labelled "About the sender" block in the system prompt — the model uses it to ground the message in your real background and to reference specifics that strengthen the connection to the recipient. The full effective prompt is visible via **View system prompt** in the side panel.

**Toggle per generation** — a `☑ Include my profile` checkbox appears at the top of the side panel form whenever a profile is set. Default is on; flip it off for one-off generations (e.g., writing on behalf of someone else).

**Storage** — lives in `chrome.storage.sync` under `userProfile` and `includeUserProfile`. Sent to the LLM provider you pick along with each request, nowhere else.

## Settings — the five customization sections

Click **Settings** in the side panel header (or right-click the extension icon → Options) to open the Settings page. Five sections after the API keys:

1. **Your profile** — your bio, sent with every generation. Toggle per-message in the side panel.
2. **Message types** — override the system prompt of any built-in message type, or click **Add new message type** to create a new one with its own name, system prompt, and optional character limit. New types appear in a `Your message types` group in the side panel dropdown.
3. **Tones** — override the descriptor sentence the model sees for any built-in tone (Professional, Friendly, Casual, Direct, Warm). The dropdown labels stay the same.
4. **Lengths** — same pattern for Short / Medium / Long.

The side panel listens for storage changes, so changes in Settings show up in the side panel immediately — no reload needed.

The **View system prompt** section in the side panel shows the full effective prompt assembled from: the (possibly overridden) template body, the "About the sender" block from your profile (when included), the tone descriptor, the length descriptor, and the character-limit reminder if applicable. Tweak any dropdown and the preview updates live.

## Project layout

```
manifest.json          Manifest V3 — sidePanel + storage + scripting permissions
background.js          Service worker (opens side panel on icon click)
sidepanel.{html,css,js} Main UI, API calls, streaming, copy/insert
options.{html,js}      Settings page (API keys, profile, customizations)
templates.js           Built-in prompts/tones/lengths, profile injection, merge logic
icons/                 Toolbar icons and README logo
README.md              This file
```

API requests route automatically by the picked model's prefix:

| Provider | Endpoint | Auth | Streaming format |
|---|---|---|---|
| Anthropic | `api.anthropic.com/v1/messages` | `x-api-key` + `anthropic-dangerous-direct-browser-access: true` | `content_block_delta` events with `delta.text` |
| OpenAI | `api.openai.com/v1/chat/completions` | Bearer | `choices[0].delta.content` |
| DeepSeek | `api.deepseek.com/chat/completions` | Bearer | OpenAI-compatible |
| Qwen | `dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | Bearer | OpenAI-compatible |

Provider inference patterns (in `sidepanel.js` `PROVIDERS` registry):

- `claude-*` → Anthropic
- `gpt-*` / `o\d*` / `chatgpt-*` → OpenAI
- `deepseek-*` → DeepSeek
- `qwen*` / `qwq*` → Qwen

For models with unusual prefixes (fine-tunes, custom deployments), pick the provider explicitly via the Custom slot in the dropdown.

## Storage shape

Everything in `chrome.storage.sync` (roams with your Google account):

| Key | Shape | Purpose |
|---|---|---|
| `anthropicApiKey` / `openaiApiKey` / `deepseekApiKey` / `qwenApiKey` | string | Provider API keys |
| `model` | string | Last-picked model ID |
| `provider` | string | Resolved provider for custom model IDs |
| `userProfile` | string | Your saved bio (free-form text) |
| `includeUserProfile` | boolean | Toggle state for the side panel profile checkbox |
| `customPrompts` | `{ templateKey: "override text" }` | Overrides for any template body (built-in or custom) |
| `customTemplates` | `{ templateKey: { name, systemPrompt, charLimit } }` | Entirely new templates |
| `toneOverrides` | `{ toneKey: "override descriptor" }` | Overrides for built-in tone descriptors |
| `lengthOverrides` | `{ lengthKey: "override descriptor" }` | Overrides for built-in length descriptors |

## Setting up the toolbar icon

For a crisp toolbar icon, save **square** PNG versions of the mascot at:

- `icons/icon-16.png` — 16×16
- `icons/icon-48.png` — 48×48
- `icons/icon-128.png` — 128×128

Then add this block to `manifest.json` (sibling of `"action"`):

```json
"icons": {
  "16": "icons/icon-16.png",
  "48": "icons/icon-48.png",
  "128": "icons/icon-128.png"
},
```

The extension still works without icons — Chrome falls back to a default puzzle-piece in the toolbar.

## Editing built-in defaults

You can override everything from the Settings UI without touching code. To change the *shipped* defaults that every fresh install starts with, edit these files:

| What | Where | How |
|---|---|---|
| Template prompts | `templates.js` — the `TEMPLATES` constant | Edit each entry's `systemPrompt` |
| Tone descriptors | `templates.js` — the `TONE_DESCRIPTORS` constant | Edit the sentence after each key |
| Length descriptors | `templates.js` — the `LENGTH_DESCRIPTORS` constant | Same pattern |
| Profile injection wording | `templates.js` — `buildSystemPrompt`, the "About the sender" block | Edit the framing text |
| Model dropdown | `sidepanel.html` — the `<select id="model">` block | Add `<option>` inside the right `<optgroup>` |
| Provider inference regex | `sidepanel.js` — `PROVIDERS` registry | Extend `inferPatterns` for unusual model-ID prefixes |

After editing, reload the extension at `chrome://extensions` (refresh icon on the Message Assistant card).

If you've already saved overrides in Settings, those still win — clear them from each editor in Settings to fall back to the freshly-edited defaults.

## Reasoning-model gotcha

Reasoning models (GPT-5 family, o-series, DeepSeek-Reasoner, QwQ) consume tokens internally before they produce visible output, and both reasoning and output count against `max_completion_tokens`. The extension uses a 4096 token budget — comfortable for normal-length messages with moderate reasoning, but very hard problems may still exhaust it.

If a reasoning model returns empty output, the error message tells you exactly how many reasoning tokens were burned and suggests switching to a non-reasoning model (`gpt-4o`, `deepseek-chat`, `qwen-plus`, etc.) — those are faster and cheaper for short message drafts anyway.

## Privacy

- API keys, your profile, and all customizations live in `chrome.storage.sync` on your machine
- Requests go directly from your browser to the provider's API — no proxy, no third-party server
- No telemetry, no analytics
- Your profile is sent to the LLM provider with each generation along with the rest of the prompt; remove sensitive info from it if you don't want it on a third-party server

## License

No license specified. Use at your own discretion.
