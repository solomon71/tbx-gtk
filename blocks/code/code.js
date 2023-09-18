// code.js

export default function decorate(block) {
  const classes = block.className.split(' ');
  // regex to look for language-xxxx where xxxx is the language
  const languageRegex = /^language-(.*)/;
  // find the language class
  const languageClass = classes.find((c) => languageRegex.test(c)).split('-')[1];

  // add a header with the language name
  const header = document.createElement('div');
  header.className = 'code-header';
  header.innerHTML = `<span>${languageClass}</span>`;
  block.prepend(header);
}
