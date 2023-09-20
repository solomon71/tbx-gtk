import createTag from '../../utils/tag.js';

export default function decorate(block) {
  const code = block.querySelector('pre code');
  const lines = code.textContent.split('\n');
  const div = document.createElement('div');
  lines.filter((line) => line.length > 0).forEach((line) => {
    const span = createTag('span', {}, line);
    div.appendChild(span);
  });
  code.innerHTML = div.innerHTML;
}
