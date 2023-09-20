import createTag from '../../utils/tag.js';

export default function decorate(block) {
  const code = block.querySelector('pre code');
  if (code === null) return;
  const langs = block.className.split(' ')
    .filter((cls) => cls.startsWith('language-'))
    .map(l => l.split('-')[1]);
  const label = createTag('small', {}, langs.join(', '));
  code.parentNode.insertBefore(label, code);
  code.classList.add(...block.classList);
}