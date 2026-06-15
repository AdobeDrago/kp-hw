import { fetchArticles } from '../../utils/kp-api.js';

const LOCALE_TO_LANGUAGE = {
  en: 'english',
  es: 'spanish',
  zh: 'chinese',
  ko: 'korean',
  vi: 'vietnamese',
  tl: 'tagalog',
};

function resolveLanguage(authored) {
  if (authored) return authored.trim().toLowerCase();
  const lang = (document.documentElement.lang || '').split('-')[0].toLowerCase();
  return LOCALE_TO_LANGUAGE[lang] || 'english';
}

function readConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    const [keyEl, valEl] = row.querySelectorAll(':scope > div');
    if (!keyEl || !valEl) return;
    config[keyEl.textContent.trim().toLowerCase()] = valEl.textContent.trim();
  });
  return config;
}

export default async function init(block) {
  const config = readConfig(block);
  const tags = (config.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const taxonomicID = config.taxonomicid || config.taxonomicID || '';
  const language = resolveLanguage(config.language);

  block.textContent = '';

  try {
    // eslint-disable-next-line no-console
    const data = await fetchArticles({ tags, language, taxonomicID });
    // eslint-disable-next-line no-console
    console.log('[related-articles-lucid] response:', data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[related-articles-lucid] fetch failed:', err);
  }
}
