export const STORAGE_KEY = 'creator_hq_brand';
export const SNAPSHOTS_KEY = 'creator_hq_snapshots';
export const MILESTONES_KEY = 'creator_hq_milestones';
export const JOURNAL_KEY = 'creator_hq_journal';
export const COMPETITORS_KEY = 'creator_hq_competitors';
export const INTEL_KEY = 'creator_hq_intel';
export const CONTENT_PLAN_KEY = 'creator_hq_content_plan';
export const CONTENT_PERF_KEY = 'creator_hq_content_perf';
export const PROFILE_KEY = 'creator_hq_profile';
export const LIBRARY_KEY = 'creator_hq_library';

export const LIBRARY_CATEGORIES = ['Caption', 'Hook', 'Image Prompt', 'Bio', 'Brief Insight', 'Other'];

export function loadStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function saveStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export async function callClaude(apiKey, messages, maxTokens = 1000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      messages,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content[0].text;
}

export function engagementScore(post) {
  return (post.likes || 0) + (post.comments || 0) * 3 + (post.saves || 0) * 5;
}

export function formatNumber(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

export const MILESTONE_VALUES = [100, 250, 500, 1000, 5000, 10000];

export const NICHE_TEMPLATES = {
  fashion: ['@zara', '@hm', '@fashionnova'],
  lifestyle: ['@minimalismlife', '@bemorewithless', '@theminimalists'],
  beauty: ['@fentybeauty', '@glossier', '@rarebebauty'],
  virtual: ['@lilmiquela', '@imma.gram', '@noonoouri'],
  digital: ['@aiartists.org', '@refikanadol', '@beeple_crap'],
};

export const ACCENT_PRESETS = [
  { label: 'Rose', value: '#d47dbc' },
  { label: 'Violet', value: '#6366f1' },
  { label: 'Slate', value: '#4f6d8a' },
  { label: 'Amber', value: '#c4821a' },
  { label: 'Emerald', value: '#2d7d5e' },
  { label: 'Midnight', value: '#3b3d8a' },
];
