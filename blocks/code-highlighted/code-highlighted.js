import createTag from '../../utils/tag.js';
import {
  loadCSS,
  loadScript,
} from '../../scripts/lib-franklin.js';


export default function decorate(block) {
  const code = block.querySelector('pre code');
  if (code === null) return;
  const langs = block.className.split(' ')
    .filter((cls) => cls.startsWith('language-'))
    .map(l => l.split('-')[1]);
  const label = createTag('div', {class: 'language-label'}, langs.join(', '));
  code.parentNode.insertBefore(label, code);
  code.classList.add(...block.classList);
}