const TEMPLATES = {
  linkedin_connection: {
    name: 'LinkedIn connection note',
    charLimit: 300,
    systemPrompt: `You write LinkedIn connection request notes that get accepted.

Rules:
- LinkedIn connection notes have a 300-character hard limit. Stay under it.
- Be specific to the recipient, reference something concrete from their background, make my background sounds relevant to their background. For example study same major, comes from same region, graduated from same school, mutual connetions, mutual group, etc.
- State the genuine reason for connecting. 
- Use formal language and common polite phrases, such as I would be grateful for the opportunity, I genuinely appreciate, If it would be possible.`,
  },
  linkedin_message: {
    name: 'LinkedIn cold message',
    charLimit: 1028,
    systemPrompt: `You write cold LinkedIn messages that get replies.

Rules:
- Open with warm and short self introduction.
- When introduce background in more details, be critical and informative, and make it tailored to the company/team/person.
- Briefly explain why this person or why company or why team. 
- One clear and very polite ask. (a 15-minute call, a quick reply, an intro, a referral). Use common polite phrases: Could you please, Would you mind, I would appreciate it if, I was hoping you could, May I ask, etc.
`,
  },
  cold_email: {
    name: 'Cold email',
    charLimit: null,
    systemPrompt: `You write cold emails that get opened, read, and replied to.

Rules:
- Start with a subject line on its own line, prefixed exactly "Subject: ".
- Show you've done research on the recipient and their context.
- Personalize your message: Reference recent achievements, posts, or industry trends relevant to the recipient.
- 4 to 7 sentences in the body. Short paragraphs.
- Use measurable results: Include numbers or case studies to build credibility, e.g., “helped a company reduce costs by 20%.”
- Clear language: Avoid jargon; ensure the message is understandable to someone outside your organization..
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
    charLimit: 1028,
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

const CUSTOM_STORAGE_KEYS = [
  'customPrompts',
  'customTemplates',
  'toneOverrides',
  'lengthOverrides',
  'userProfile',
  'includeUserProfile',
];

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getCustomizations(storage) {
  return {
    customPrompts: storage?.customPrompts || {},
    customTemplates: storage?.customTemplates || {},
    toneOverrides: storage?.toneOverrides || {},
    lengthOverrides: storage?.lengthOverrides || {},
  };
}

function getEffectiveTemplates(custom) {
  const list = [];
  for (const [key, t] of Object.entries(TEMPLATES)) {
    list.push({
      key,
      name: t.name,
      systemPrompt: custom.customPrompts[key] || t.systemPrompt,
      defaultSystemPrompt: t.systemPrompt,
      charLimit: t.charLimit,
      isCustom: false,
      hasPromptOverride: !!custom.customPrompts[key],
    });
  }
  for (const [key, t] of Object.entries(custom.customTemplates)) {
    list.push({
      key,
      name: t.name,
      systemPrompt: custom.customPrompts[key] || t.systemPrompt,
      defaultSystemPrompt: t.systemPrompt,
      charLimit: t.charLimit ?? null,
      isCustom: true,
      hasPromptOverride: !!custom.customPrompts[key],
    });
  }
  return list;
}

function getEffectiveTones(custom) {
  return Object.entries(TONE_DESCRIPTORS).map(([key, descriptor]) => ({
    key,
    label: capitalize(key),
    descriptor: custom.toneOverrides[key] || descriptor,
    defaultDescriptor: descriptor,
    hasOverride: !!custom.toneOverrides[key],
  }));
}

function getEffectiveLengths(custom) {
  return Object.entries(LENGTH_DESCRIPTORS).map(([key, descriptor]) => ({
    key,
    label: capitalize(key),
    descriptor: custom.lengthOverrides[key] || descriptor,
    defaultDescriptor: descriptor,
    hasOverride: !!custom.lengthOverrides[key],
  }));
}

function buildSystemPrompt({ templateKey, tone, length, custom, userProfile }) {
  const templates = getEffectiveTemplates(custom);
  const tmpl = templates.find((t) => t.key === templateKey);
  if (!tmpl) return '';

  const tones = getEffectiveTones(custom);
  const lengths = getEffectiveLengths(custom);
  const toneDesc = tones.find((t) => t.key === tone)?.descriptor || '';
  const lengthDesc = lengths.find((l) => l.key === length)?.descriptor || '';

  let system = tmpl.systemPrompt;

  if (userProfile && userProfile.trim()) {
    system += `\n\nAbout the sender (the person whose voice you're writing in — use this to ground the message in their real background, projects, and credibility; reference specifics where they make the message more relevant to the recipient):\n${userProfile.trim()}`;
  }

  system += `\n\nTone: ${toneDesc}\n${lengthDesc}`;
  if (tmpl.charLimit) {
    system += `\n\nHARD CHARACTER LIMIT: ${tmpl.charLimit} characters. Do not exceed.`;
  }
  return system;
}

function isAnyCustomizationActive({ templateKey, tone, length, custom, profileIncluded }) {
  return (
    !!custom.customPrompts[templateKey] ||
    !!custom.toneOverrides[tone] ||
    !!custom.lengthOverrides[length] ||
    !!custom.customTemplates[templateKey] ||
    !!profileIncluded
  );
}
