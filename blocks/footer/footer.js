import {
  readBlockConfig,
  decorateIcons,
} from '../../scripts/lib-franklin.js';

import {
  decorateLinks,
} from '../../scripts/scripts.js';
/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch footer content
  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`, window.location.pathname.endsWith('/footer') ? { cache: 'reload' } : {});

  if (resp.ok) {
    let html = await resp.text();

    // look for copyright character and append year
    const year = new Date().getFullYear();
    const copy = html.indexOf('© ');
    if (copy > -1) {
      const copyYear = html.indexOf(' ', copy);
      if (copyYear > -1) {
        html = html.replace(html.substring(copy, copyYear), `©${year}`);
      }
    }

    // decorate footer DOM
    const footer = document.createElement('div');
    footer.innerHTML = html;

    decorateIcons(footer);
    decorateLinks(footer);
    block.append(footer);
  }
}
