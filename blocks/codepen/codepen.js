import createTag from "../../utils/tag.js";

export default function decorate(block) {
  const penUrl = block.textContent.trim();
  const hash = penUrl.split('/').slice(-1);
  const user = penUrl.split('/').slice(-3, -2);
  block.dataset.height = '420';
  block.dataset.defaultTab = 'html,result';
  block.dataset.slugHash = hash;
  block.dataset.user = user;
  if (block.className.includes('editable')) {
    block.dataset.editable = 'true';
  }
  const linkTag = createTag('a', {
    href: penUrl,
    target: '_blank',
  }, `View pen by @${user}<br>${penUrl}`);
  block.textContent = '';
  block.appendChild(linkTag);
}
