// Preload script; safe, minimal API surface for renderer if needed in future
const { contextBridge } = require('electron');

// Empty for now. Exposing a secure API here avoids enabling nodeIntegration.
contextBridge.exposeInMainWorld('__nutty', {
  version: '1.0.0'
});
