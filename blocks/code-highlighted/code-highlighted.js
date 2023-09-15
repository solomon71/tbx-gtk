import hljs from './highlight.min.js';
import elixir from './languages/elixir.js';
import { loadStyle } from '../../utils/utils.js';

export default function decorate(block) {
  hljs.registerLanguage('elixir', elixir);
  if (block.classList.contains('dark')) {
    loadStyle(`${window.location.origin}/blocks/code-highlighted/dark.css`);
  } else {
    loadStyle(`${window.location.origin}/blocks/code-highlighted/default.css`);
  }
  block.querySelectorAll('pre code').forEach((el) => {
    const langs = block.classList.value.split(' ').filter((cls) => cls.startsWith('language-'));
    const label = document.createElement('div');
    label.classList.add('languageLabel');
    langs.forEach((l) => {
      label.textContent += l.split('-')[1].toUpperCase();
      if (l !== langs[langs.length - 1]) {
        label.textContent += ', ';
      }
    });
    el.parentNode.insertBefore(label, el);
    el.classList.add(...block.classList);
    hljs.highlightElement(el);
  });
}