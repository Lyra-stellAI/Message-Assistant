# Message Assistant

<p align="center">
<img width="280" height="150" alt="Gemini_Generated_Image_qbdqjlqbdqjlqbdq" src="https://github.com/user-attachments/assets/9b809208-dbcd-4552-aee9-150a831e900c" />
</p>

<p align="center">
  An AI-powered Chrome extension that drafts LinkedIn notes, cold messages, emails, follow-ups, and more — directly in your browser sidebar.
</p>

---

## What it does

Click the extension icon → a side panel opens that stays visible across tabs. Pick a message type, paste the recipient's info, say what you want to convey, choose tone and length, click **Generate** — a polished draft streams in. **Copy** to clipboard or **Insert** directly into the focused text field on the active page.

## Features

- **6 built-in message types** — LinkedIn connection note (300-char enforcement), LinkedIn cold message, cold email (with auto subject line), follow-up, thank you, free-form custom
- **4 LLM providers** — Anthropic, OpenAI, DeepSeek, Qwen — plus any custom model ID
- **Live streaming** — watch the draft appear token by token
- **Copy & Insert** — put on clipboard, or push directly into LinkedIn / Gmail / Twitter / any text field on the page
- **Fully customizable prompts** — override any built-in or add your own message types from Settings (e.g. "Business email to partner")
- **Editable tone & length** — every descriptor the model sees is editable
- **Live system-prompt preview** — see exactly what gets sent to the model before you generate
- **Character counter** with hard-limit enforcement for LinkedIn notes

## Supported models

| Provider | Models in the dropdown |
|---|---|
| **Anthropic** | Claude Opus 4.7, Sonnet 4.6, Haiku 4.5, Opus 4.6, Sonnet 4.5 |
| **OpenAI** | GPT-4o, GPT-4o mini, GPT-4 Turbo, o1, o1-mini |
| **DeepSeek** | DeepSeek Chat (V3), DeepSeek Reasoner (R1) |
| **Qwen (Alibaba)** | Qwen Max, Plus, Turbo, Max long-context, QwQ 32B |
| **Custom** | Any model ID from any of the four providers above |

## Installation

1. Clone the repo:
   ```sh
   git clone https://github.com/lyra-stellai/web-assistant.git
   cd web-assistant
   ```
2. In Chrome, open `chrome://extensions`
3. Toggle **Developer mode** (top-right)
4. Click **Load unpacked** and pick the project folder
5. The Settings page opens automatically on first install — paste an API key for at least one provider

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
5. **Tone** + **Length** + **Model** — tune
6. **Generate** — watch it stream in
7. Edit the output in place if needed, then **Copy** or click into a text field on the active tab and **Insert**

## Customization

Click **Settings** (top-right of the side panel) for four customization sections beneath the API keys:

- **Message types** — override the built-in prompts, or click **Add new message type** to create your own. Each new type has a name, system prompt, and optional character limit. New types appear in a `Your message types` group in the side panel dropdown.
- **Tones** — override the descriptor sentence the model sees for any built-in tone (Professional, Friendly, Casual, Direct, Warm). The label in the dropdown stays the same.
- **Lengths** — same pattern for Short / Medium / Long.

The side panel listens for storage changes, so changes in Settings show up in the side panel immediately (no reload needed).

The **View system prompt** section in the side panel shows the full effective prompt that will be sent — template body + tone descriptor + length descriptor + character-limit reminder. Tweak any of the dropdowns and the preview updates live.

## Project layout

```
manifest.json          Manifest V3 — sidePanel + storage + scripting permissions
background.js          Service worker (opens side panel on icon click)
sidepanel.{html,css,js} Main UI, API calls, streaming, copy/insert
options.{html,js}      Settings page (API keys + customizations)
templates.js           Built-in prompts/tones/lengths + merge logic
icons/                 Toolbar icons and README logo
```

API requests route by model name:

| Provider | Endpoint | Auth | Streaming format |
|---|---|---|---|
| Anthropic | `api.anthropic.com/v1/messages` | `x-api-key` + `anthropic-dangerous-direct-browser-access: true` | `content_block_delta` events with `delta.text` |
| OpenAI | `api.openai.com/v1/chat/completions` | Bearer | `choices[0].delta.content` |
| DeepSeek | `api.deepseek.com/chat/completions` | Bearer | OpenAI-compatible |
| Qwen | `dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions` | Bearer | OpenAI-compatible |

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

## Logo

Save the project logo at `icons/logo.png`. The image referenced at the top of this README will appear once that file exists.

## Editing built-in defaults

| What | Where | How |
|---|---|---|
| Template prompts | `templates.js:1–77` | Edit each entry's `systemPrompt` |
| Tone descriptors | `templates.js:79–85` | Edit the sentence after each key |
| Length descriptors | `templates.js:87–91` | Same pattern |
| Model dropdown | `sidepanel.html:51–75` | Add `<option>` inside the right `<optgroup>` |
| Provider inference regex | `sidepanel.js` `PROVIDERS` registry | Extend `inferPatterns` for unusual model-ID prefixes |

After editing, reload the extension at `chrome://extensions` (refresh icon on the Message Assistant card).

## Privacy

- API keys live in `chrome.storage.sync` on your machine
- Requests go directly from your browser to the provider's API — no proxy, no third-party server
- No telemetry, no analytics

## License

No license specified. Use at your own discretion.
