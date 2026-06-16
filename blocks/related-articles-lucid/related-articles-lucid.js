import { fetchArticles } from '../../utils/kp-api.js';

const KP_BASE = 'https://healthy.kaiserpermanente.org';
const MAX_ARTICLES = 6;

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
  const config = { topics: [] };
  block.querySelectorAll(':scope > div').forEach((row) => {
    const cells = row.querySelectorAll(':scope > div');
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase();
    if (key === 'topic') {
      config.topics.push({
        label: cells[1].textContent.trim(),
        tags: cells[2] ? cells[2].textContent.trim().split(',').map((t) => t.trim()).filter(Boolean) : [],
      });
    } else {
      config[key] = cells[1].textContent.trim();
    }
  });
  return config;
}

function getRegion() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[0] || 'northern-california';
}

// Always use the base `value` (English), not the language variations.
function resolveField(element) {
  return element?.value || '';
}

function buildCard(article, region, language) {
  const headline = resolveField(article.headline);
  const imageValue = article.primaryImageOfPage?.value || '';
  const imageSrc = imageValue ? `${KP_BASE}${imageValue}` : '';
  const langCode = language === 'english' ? 'en' : language.slice(0, 2);
  const imageAlt = article.primaryImageOfPage?.[`alt-${langCode}`]
    || article.primaryImageOfPage?.['alt-en']
    || headline;
  const href = `${KP_BASE}/${region}/health-wellness/healtharticle.${article.name}`;

  const card = document.createElement('a');
  card.className = 'ral-card';
  card.href = href;

  if (imageSrc) {
    const imageWrap = document.createElement('div');
    imageWrap.className = 'ral-card-image';
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = imageAlt;
    img.loading = 'lazy';
    imageWrap.append(img);
    card.append(imageWrap);
  }

  const body = document.createElement('div');
  body.className = 'ral-card-body';

  const category = document.createElement('span');
  category.className = 'ral-card-category';
  category.textContent = 'Health and wellness';

  const headlineEl = document.createElement('p');
  headlineEl.className = 'ral-card-headline';
  headlineEl.textContent = headline;

  body.append(category, headlineEl);
  card.append(body);
  return card;
}

function renderGrid(grid, articles, region, language) {
  grid.innerHTML = '';
  articles.forEach((article) => grid.append(buildCard(article, region, language)));
}

export default async function init(block) {
  const config = readConfig(block);
  const defaultTags = (config.tags || '').split(',').map((t) => t.trim()).filter(Boolean);
  const taxonomicID = config.taxonomicid || config.taxonomicID || '';
  const language = resolveLanguage(config.language);
  const region = getRegion();
  const hasSidebar = config.topics.length > 0;

  block.textContent = '';

  // Wrapper: sidebar + content
  const wrapper = document.createElement('div');
  wrapper.className = `ral-wrapper${hasSidebar ? '' : ' ral-no-sidebar'}`;

  // Sidebar
  const sidebar = document.createElement('aside');
  sidebar.className = 'ral-sidebar';
  sidebar.hidden = !hasSidebar;

  const sidebarHeading = document.createElement('p');
  sidebarHeading.className = 'ral-sidebar-heading';
  sidebarHeading.textContent = 'View by topic:';

  const topicList = document.createElement('ul');
  topicList.className = 'ral-topic-list';

  // Content area
  const content = document.createElement('div');
  content.className = 'ral-content';

  const grid = document.createElement('div');
  grid.className = 'ral-grid';

  const viewAll = document.createElement('div');
  viewAll.className = 'ral-view-all';
  const viewAllLink = document.createElement('a');
  viewAllLink.className = 'ral-view-all-link';
  viewAllLink.href = `${KP_BASE}/${region}/health-wellness`;
  viewAllLink.textContent = 'View all Healthy Living articles';
  viewAll.append(viewAllLink);

  content.append(grid, viewAll);
  sidebar.append(sidebarHeading, topicList);
  wrapper.append(sidebar, content);
  block.append(wrapper);

  // Topic click handler: re-fetch with topic's tags (or default for "All topics")
  async function selectTopic(topicItem, tags) {
    topicList.querySelectorAll('.ral-topic-item').forEach((li) => li.classList.remove('is-active'));
    topicItem.classList.add('is-active');
    grid.innerHTML = '';
    try {
      const data = await fetchArticles({ tags, language, taxonomicID });
      const raw = Array.isArray(data) ? data : (data.documents || data.value || data.results || []);
      renderGrid(grid, raw.slice(0, MAX_ARTICLES), region, language);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[related-articles-lucid] fetch failed:', err);
    }
  }

  // Build "All topics" item
  if (hasSidebar) {
    const allItem = document.createElement('li');
    allItem.className = 'ral-topic-item is-active';
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.textContent = 'All topics';
    allBtn.addEventListener('click', () => selectTopic(allItem, defaultTags));
    allItem.append(allBtn);
    topicList.append(allItem);

    config.topics.forEach(({ label, tags: topicTags }) => {
      const li = document.createElement('li');
      li.className = 'ral-topic-item';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.addEventListener('click', () => selectTopic(li, topicTags.length ? topicTags : defaultTags));
      li.append(btn);
      topicList.append(li);
    });
  }

  // Initial fetch
  try {
    const data = await fetchArticles({ tags: defaultTags, language, taxonomicID });
    const raw = Array.isArray(data) ? data : (data.documents || data.value || data.results || []);
    renderGrid(grid, raw.slice(0, MAX_ARTICLES), region, language);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[related-articles-lucid] fetch failed:', err);
  }
}
