
// Preload script for Electron

// Create a secure bridge between renderer and main process
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM content loaded in preload script');
  
  // Display diagnostic information
  console.log('Window object available:', window !== undefined);
  console.log('Document object available:', document !== undefined);
  console.log('Document ready state:', document.readyState);
  
  // Check if TextEncoder is available (needed for face-api.js)
  console.log('TextEncoder available:', typeof window.TextEncoder !== 'undefined');
  
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.innerText = text;
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
  
  // Add subtle diagnostic information to the document
  const info = document.createElement('div');
  info.style.position = 'fixed';
  info.style.bottom = '5px';
  info.style.right = '5px';
  info.style.zIndex = '9999';
  info.style.backgroundColor = 'rgba(0,0,0,0.5)';
  info.style.color = 'white';
  info.style.padding = '3px 6px';
  info.style.borderRadius = '3px';
  info.style.fontSize = '10px';
  info.textContent = `Obscurial v1.0.0`;
  document.body.appendChild(info);
  
  console.log('Preload script executed successfully');
});
