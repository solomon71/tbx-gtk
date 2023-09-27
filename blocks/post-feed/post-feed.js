import createTag from '../../utils/tag.js';
import { createIntersectionObserver } from '../../utils/utils.js';
import {
  stamp,
  toClassName,
  loadTaxonomy,
  getPostTaxonomy,
  buildPostCard,
} from './post-helpers.js';

const ROOT_MARGIN = 50;

const postIndex = {
  data: [],
  byPath: {},
  offset: 0,
  complete: false,
  config: {},
};

const replacePlaceholder = async (key) => replaceKey(key, getConfig());

/**
 * Extracts the config from a block.
 * @param {Element} block The block element
 * @returns {object} The block config
 */
export function readBlockConfig(block) {
  return [...block.querySelectorAll(':scope>div')].reduce((config, row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const valueEl = cols[1];
        const name = toClassName(cols[0].textContent);
        if (valueEl.querySelector('a')) {
          const aArr = [...valueEl.querySelectorAll('a')];
          if (aArr.length === 1) {
            config[name] = aArr[0].href;
          } else {
            config[name] = aArr.map((a) => a.href);
          }
        } else if (valueEl.querySelector('p')) {
          const pArr = [...valueEl.querySelectorAll('p')];
          if (pArr.length === 1) {
            config[name] = pArr[0].textContent;
          } else {
            config[name] = pArr.map((p) => p.textContent);
          }
        } else config[name] = row.children[1].textContent;
      }
    }

    return config;
  }, {});
}

export async function fetchPostIndex() {
  const pageSize = 50;
  const { feed } = postIndex.config;
  const queryParams = `?limit=${pageSize}&offset=${postIndex.offset}`;
  const defaultPath = '/query-index.json';
  const indexPath = feed
    ? `${feed}${queryParams}`
    : `${defaultPath}${queryParams}`;

  if (postIndex.complete) return (postIndex);

  return fetch(indexPath)
    .then((response) => response.json())
    .then((json) => {
      const complete = (json.limit + json.offset) === json.total;
      json.data.forEach((post) => {
        postIndex.data.push(post);
        postIndex.byPath[post.path.split('.')[0]] = post;
      });
      postIndex.complete = complete;
      postIndex.offset = json.offset + pageSize;

      return postIndex;
    });
}

function isCardOnPage(post) {
  const path = post.path.split('.')[0];
  /* using recommended and featured posts */
  return !!document.querySelector(`.featured-post a.featured-post-card[href="${path}"], .recommended-posts a.post-card[href="${path}"]`);
}

const isInList = (list, val) => list && list.map((t) => t.toLowerCase()).includes(val);

async function filterPosts(feed, limit, offset) {
  /* filter posts by category, tag and author */
  const FILTER_NAMES = ['tags', 'topics', 'selectedProducts', 'selectedIndustries', 'author', 'category', 'exclude'];

  const filters = Object.keys(postIndex.config).reduce((prev, key) => {
    if (FILTER_NAMES.includes(key)) {
      prev[key] = postIndex.config[key].split(',').map((e) => e.toLowerCase().trim());
    }

    return prev;
  }, {});

  while ((feed.data.length < limit + offset) && (!feed.complete)) {
    const beforeLoading = new Date();
    const index = await fetchPostIndex();
    const indexChunk = index.data.slice(feed.cursor);

    const beforeFiltering = new Date();

    const KEYWORDS = ['exclude', 'tags', 'topics'];
    const SELECTED = ['selectedProducts', 'selectedIndustries'];

    /* filter and ignore if already in result */
    const feedChunk = indexChunk.filter((post) => {
      const postTaxonomy = getPostTaxonomy(post);

      const matchedAll = Object.keys(filters).every((key) => {
        if (KEYWORDS.includes(key)) {
          const matchedFilter = filters[key]
            .some((val) => (isInList(postTaxonomy?.allTopics, val)));
          return key === 'exclude' ? !matchedFilter : matchedFilter;
        }
        if (SELECTED.includes(key)) {
          if (filters.selectedProducts && filters.selectedIndustries) {
            // match product && industry
            const matchProduct = filters.selectedProducts
              .some((val) => (isInList(postTaxonomy?.allTopics, val)));
            const matchIndustry = filters.selectedIndustries
              .some((val) => (isInList(postTaxonomy?.allTopics, val)));
            return matchProduct && matchIndustry;
          }
          const matchedFilter = filters[key]
            .some((val) => isInList(postTaxonomy.allTopics, val));
          return matchedFilter;
        }
        const matchedFilter = filters[key].some((val) => isInList([post[key]], val));
        return matchedFilter;
      });

      return (matchedAll && !isCardOnPage(post));
    });

    stamp(`chunk measurements - loading: ${beforeFiltering - beforeLoading}ms filtering: ${new Date() - beforeFiltering}ms`);

    feed.cursor = index.data.length;
    feed.complete = index.complete;
    feed.data = [...feed.data, ...feedChunk];
  }
}

async function decoratePostFeed(
  postFeedEl,
  offset = 0,
  feed = { data: [], complete: false, cursor: 0 },
  limit = 10,
) {
  let postCards = postFeedEl.querySelector('.post-cards');

  if (!postCards) {
    postCards = createTag('div', { class: 'post-cards' });
    postFeedEl.append(postCards);
  }

  const container = createTag('div', { class: 'post-cards-empty' });

  // display spinner
  const spinner = createTag('div', { class: 'spinner' });
  container.append(spinner);
  postCards.append(container);

  const pageEnd = offset + limit;
  await filterPosts(feed, limit, offset);
  const posts = feed.data;
  console.log(posts);

  if (posts.length) {
    // results were found
    container.remove();
  } else {
    // no results were found
    spinner.remove();
    const noResults = document.createElement('p');
    noResults.innerHTML = `<strong>${await replacePlaceholder('no-results')}</strong>`;
    container.append(noResults);
  }
  const max = pageEnd > posts.length ? posts.length : pageEnd;
  for (let i = offset; i < max; i += 1) {
    const post = posts[i];
    const card = buildPostCard(post);
    postCards.append(card);
  }
  if (posts.length > pageEnd || !feed.complete) {
    const loadMore = document.createElement('a');
    loadMore.className = 'load-more con-button outline';
    loadMore.href = '#';
    loadMore.textContent = await replacePlaceholder('load-more');
    postFeedEl.append(loadMore);
    loadMore.addEventListener('click', (event) => {
      event.preventDefault();
      loadMore.remove();
      decoratePostFeed(postFeedEl, pageEnd, feed);
    });
  }
  postFeedEl.classList.add('appear');
}

// async function decorateFeedFilter(articleFeedEl) {
//   const taxonomy = getTaxonomyModule();
//   const parent = document.querySelector('.article-feed');

//   const curtain = createTag('div', { class: 'filter-curtain hide' });
//   document.querySelector('main').append(curtain);

//   // FILTER CONTAINER
//   const filterContainer = createTag('div', { class: 'filter-container' });
//   const filterWrapper = createTag('div');

//   const filterText = document.createElement('p');
//   filterText.classList.add('filter-text');
//   filterText.textContent = await replacePlaceholder('filters');

//   const productsDropdown = await buildFilter('products', taxonomy, articleFeedEl, postIndex.config);
//   const industriesDropdown = await buildFilter('industries', taxonomy, articleFeedEl, postIndex.config);

//   filterWrapper.append(filterText, productsDropdown, industriesDropdown);
//   filterContainer.append(filterWrapper);

//   parent.parentElement.insertBefore(filterContainer, parent);

//   // SELECTED CONTAINER
//   const selectedContainer = createTag('div', { class: 'selected-container hide' });
//   const selectedWrapper = createTag('div');

//   const selectedText = document.createElement('p');
//   selectedText.classList.add('selected-text');
//   selectedText.textContent = await replacePlaceholder('showing-articles-for');

//   const selectedCategories = document.createElement('span');
//   selectedCategories.classList.add('selected-filters');

//   const clearBtn = document.createElement('a');
//   clearBtn.classList.add('button', 'small', 'clear');
//   clearBtn.textContent = await replacePlaceholder('clear-all');
//   clearBtn.addEventListener(
//     'click',
//     (e) => clearFilters(e, articleFeedEl),
//   );

//   selectedWrapper.append(selectedText, selectedCategories, clearBtn);
//   selectedContainer.append(selectedWrapper);
//   parent.parentElement.insertBefore(selectedContainer, parent);
// }

export default async function init(el) {
  const initPostFeed = async () => {
    postIndex.config = readBlockConfig(el);
    el.innerHTML = '';
    await loadTaxonomy();
    // if (postIndex.config.filters) {
    //   decorateFeedFilter(el);
    // }
    decoratePostFeed(el);
  };

  createIntersectionObserver({
    el,
    options: { rootMargin: `${ROOT_MARGIN}px` },
    callback: initPostFeed,
  });
}
