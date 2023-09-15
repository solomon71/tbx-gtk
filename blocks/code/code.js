export default function decorate(block) {
  const code = block.querySelector('code');
  const lines = code.textContent.split('\n');
  let isCommentBlock = false;
  const div = document.createElement('div');
  lines.filter(line => line.length > 0).forEach((line) => {
    const span = document.createElement('span');
    const trimmed = line.trim();
    if (
      trimmed.startsWith('//')
      || trimmed.startsWith('#')
      || trimmed.startsWith('/*')
      || trimmed.includes('*/')
      || isCommentBlock
    ) {
      span.className = 'comment';
    }
    span.textContent = line;
    div.appendChild(span);
    if (trimmed.startsWith('/*')) {
      isCommentBlock = true;
    }
    if (trimmed.includes('*/')) {
      isCommentBlock = false;
    }
  });
  code.innerHTML = div.innerHTML;
}