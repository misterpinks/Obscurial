
// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded in preload script');
  
  // Display diagnostic information
  console.log('Window object available:', window !== undefined);
  console.log('Document object available:', document !== undefined);
  console.log('Document ready state:', document.readyState);
  
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
    console.log('Root element content length:', rootElement.innerHTML.length);
    console.log('Root element children count:', rootElement.childNodes.length);
  } else {
    console.error('Root element is missing in the DOM');
    
    // Add a visible error message to help diagnose the issue
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.top = '50%';
    errorMsg.style.left = '50%';
    errorMsg.style.transform = 'translate(-50%, -50%)';
    errorMsg.style.padding = '20px';
    errorMsg.style.backgroundColor = 'rgba(255,0,0,0.7)';
    errorMsg.style.color = 'white';
    errorMsg.style.borderRadius = '5px';
    errorMsg.style.zIndex = '10000';
    errorMsg.textContent = 'Error: Root element not found. React may not be rendering correctly.';
    document.body.appendChild(errorMsg);
  }
  
  console.log('Preload script executed successfully');
});
