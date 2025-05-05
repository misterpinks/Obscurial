
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded in preload script');
  
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
  
  // Add diagnostic information to the document
  const info = document.createElement('div');
  info.style.position = 'fixed';
  info.style.bottom = '10px';
  info.style.left = '10px';
  info.style.zIndex = '9999';
  info.style.backgroundColor = 'rgba(0,0,0,0.7)';
  info.style.color = 'white';
  info.style.padding = '5px';
  info.textContent = `Electron v${process.versions.electron} | Node ${process.versions.node}`;
  document.body.appendChild(info);
  
  // Check if React root exists and its content
  const rootElement = document.getElementById('root');
  console.log('Root element exists:', rootElement !== null);
  if (rootElement) {
    console.log('Root element content:', rootElement.innerHTML);
  }
  
  console.log('Preload script executed successfully');
});

