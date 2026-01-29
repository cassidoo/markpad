const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onFileNew: (callback) => ipcRenderer.on('file-new', callback),
  onFileOpened: (callback) => ipcRenderer.on('file-opened', (event, data) => callback(data)),
  onRequestContentForSave: (callback) => ipcRenderer.on('request-content-for-save', callback),
  onPublishGist: (callback) => ipcRenderer.on('publish-gist', callback),
  saveContent: (content) => ipcRenderer.invoke('save-content', content),
  getCurrentFilePath: () => ipcRenderer.invoke('get-current-file-path'),
  publishGist: (data) => ipcRenderer.invoke('publish-gist', data),
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});
