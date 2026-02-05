/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/gist-publisher.js"
/*!*******************************!*\
  !*** ./src/gist-publisher.js ***!
  \*******************************/
(module, __unused_webpack_exports, __webpack_require__) {

const { exec } = __webpack_require__(/*! child_process */ "child_process");
const { promisify } = __webpack_require__(/*! util */ "util");
const execAsync = promisify(exec);

const GITHUB_OAUTH_CLIENT_ID = 'Ov23liLXwH4cYIjKCy8e';

async function getAuthToken() {
  try {
    const token = await tryGitHubCLI();
    if (token) return token;
  } catch (err) {
    console.log('GitHub CLI not available:', err.message);
  }

  try {
    const token = await tryCopilotCLI();
    if (token) return token;
  } catch (err) {
    console.log('Copilot CLI not available:', err.message);
  }

  return await deviceFlowAuth();
}

async function tryGitHubCLI() {
  const { stdout } = await execAsync('gh auth token');
  const token = stdout.trim();
  if (token && token.startsWith('gh')) {
    return token;
  }
  throw new Error('No valid token from gh CLI');
}

async function tryCopilotCLI() {
  try {
    const { stdout } = await execAsync('github-copilot-cli --version');
    if (stdout) {
      const tokenPath = (__webpack_require__(/*! path */ "path").join)((__webpack_require__(/*! os */ "os").homedir)(), '.config', 'github-copilot', 'hosts.json');
      const fs = __webpack_require__(/*! fs */ "fs");
      if (fs.existsSync(tokenPath)) {
        const hostsData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        const token = hostsData?.['github.com']?.oauth_token;
        if (token) return token;
      }
    }
  } catch (err) {
    throw new Error('Copilot CLI not available or not authenticated');
  }
  throw new Error('No token from Copilot CLI');
}

async function deviceFlowAuth() {
  const fetch = (...args) => __webpack_require__.e(/*! import() */ "vendors-node_modules_node-fetch_src_index_js").then(__webpack_require__.bind(__webpack_require__, /*! node-fetch */ "./node_modules/node-fetch/src/index.js")).then(({default: fetch}) => fetch(...args));
  
  const deviceCodeResponse = await (await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      client_id: GITHUB_OAUTH_CLIENT_ID,
      scope: 'gist'
    })
  })).json();

  const { device_code, user_code, verification_uri, interval } = deviceCodeResponse;

  const { shell, dialog } = __webpack_require__(/*! electron */ "electron");
  
  await dialog.showMessageBox({
    type: 'info',
    title: 'GitHub Authentication',
    message: `Please visit:\n${verification_uri}\n\nAnd enter code: ${user_code}`,
    buttons: ['Open Browser', 'OK']
  }).then((result) => {
    if (result.response === 0) {
      shell.openExternal(verification_uri);
    }
  });

  return await pollForToken(device_code, interval || 5);
}

async function pollForToken(deviceCode, interval) {
  const fetch = (...args) => __webpack_require__.e(/*! import() */ "vendors-node_modules_node-fetch_src_index_js").then(__webpack_require__.bind(__webpack_require__, /*! node-fetch */ "./node_modules/node-fetch/src/index.js")).then(({default: fetch}) => fetch(...args));
  
  while (true) {
    await new Promise(resolve => setTimeout(resolve, interval * 1000));
    
    const tokenResponse = await (await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: GITHUB_OAUTH_CLIENT_ID,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })).json();

    if (tokenResponse.access_token) {
      return tokenResponse.access_token;
    }
    
    if (tokenResponse.error === 'authorization_pending') {
      continue;
    }
    
    throw new Error(`Auth failed: ${tokenResponse.error}`);
  }
}

async function publishGist(filename, content) {
  try {
    const token = await getAuthToken();
    const fetch = (...args) => __webpack_require__.e(/*! import() */ "vendors-node_modules_node-fetch_src_index_js").then(__webpack_require__.bind(__webpack_require__, /*! node-fetch */ "./node_modules/node-fetch/src/index.js")).then(({default: fetch}) => fetch(...args));
    
    const response = await (await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: `Markpad: ${filename}`,
        public: false,
        files: {
          [filename]: {
            content: content
          }
        }
      })
    }));

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create gist');
    }

    const gist = await response.json();
    return { success: true, url: gist.html_url };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { publishGist };


/***/ },

/***/ "buffer"
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
(module) {

"use strict";
module.exports = require("buffer");

/***/ },

/***/ "child_process"
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
(module) {

"use strict";
module.exports = require("child_process");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

"use strict";
module.exports = require("electron");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("fs");

/***/ },

/***/ "node:buffer"
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
(module) {

"use strict";
module.exports = require("node:buffer");

/***/ },

/***/ "node:fs"
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
(module) {

"use strict";
module.exports = require("node:fs");

/***/ },

/***/ "node:http"
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
(module) {

"use strict";
module.exports = require("node:http");

/***/ },

/***/ "node:https"
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
(module) {

"use strict";
module.exports = require("node:https");

/***/ },

/***/ "node:net"
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
(module) {

"use strict";
module.exports = require("node:net");

/***/ },

/***/ "node:path"
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
(module) {

"use strict";
module.exports = require("node:path");

/***/ },

/***/ "node:process"
/*!*******************************!*\
  !*** external "node:process" ***!
  \*******************************/
(module) {

"use strict";
module.exports = require("node:process");

/***/ },

/***/ "node:stream"
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
(module) {

"use strict";
module.exports = require("node:stream");

/***/ },

/***/ "node:stream/web"
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
(module) {

"use strict";
module.exports = require("node:stream/web");

/***/ },

/***/ "node:url"
/*!***************************!*\
  !*** external "node:url" ***!
  \***************************/
(module) {

"use strict";
module.exports = require("node:url");

/***/ },

/***/ "node:util"
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
(module) {

"use strict";
module.exports = require("node:util");

/***/ },

/***/ "node:zlib"
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
(module) {

"use strict";
module.exports = require("node:zlib");

/***/ },

/***/ "os"
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("os");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("path");

/***/ },

/***/ "util"
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("util");

/***/ },

/***/ "worker_threads"
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
(module) {

"use strict";
module.exports = require("worker_threads");

/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			"main": 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					var installedChunk = require("./" + __webpack_require__.u(chunkId));
/******/ 					if (!installedChunks[chunkId]) {
/******/ 						installChunk(installedChunk);
/******/ 					}
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
const {
	app,
	BrowserWindow,
	Menu,
	dialog,
	ipcMain,
	shell,
} = __webpack_require__(/*! electron */ "electron");
const fs = (__webpack_require__(/*! fs */ "fs").promises);

let mainWindow;
let currentFilePath = null;

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: 'C:\\Users\\cassi\\Documents\\github\\markpad\\.webpack\\renderer\\main_window\\preload.js',
		},
	});

	mainWindow.loadURL('http://localhost:3000/main_window/index.html');

	const template = [
		{
			label: "File",
			submenu: [
				{
					label: "New",
					accelerator: "CmdOrCtrl+N",
					click: () => mainWindow.webContents.send("file-new"),
				},
				{
					label: "Open",
					accelerator: "CmdOrCtrl+O",
					click: () => openFile(),
				},
				{
					label: "Save",
					accelerator: "CmdOrCtrl+S",
					click: () => saveFile(),
				},
				{
					label: "Save As",
					accelerator: "CmdOrCtrl+Shift+S",
					click: () => saveFileAs(),
				},
				{ type: "separator" },
				{
					label: "Quit",
					accelerator: "CmdOrCtrl+Q",
					click: () => app.quit(),
				},
			],
		},
		{
			label: "Edit",
			submenu: [
				{ role: "undo" },
				{ role: "redo" },
				{ type: "separator" },
				{ role: "cut" },
				{ role: "copy" },
				{ role: "paste" },
				{ role: "selectAll" },
			],
		},
		{
			label: "View",
			submenu: [
				{
					label: "Zoom In",
					accelerator: "CmdOrCtrl+=",
					click: () => {
						const currentZoom = mainWindow.webContents.getZoomLevel();
						mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
					},
				},
				{
					label: "Zoom Out",
					accelerator: "CmdOrCtrl+-",
					click: () => {
						const currentZoom = mainWindow.webContents.getZoomLevel();
						mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
					},
				},
				{
					label: "Reset Zoom",
					accelerator: "CmdOrCtrl+0",
					click: () => {
						mainWindow.webContents.setZoomLevel(0);
					},
				},
				{ type: "separator" },
				{ role: "togglefullscreen" },
			],
		},
		{
			label: "Gist",
			submenu: [
				{
					label: "Publish to Gist",
					accelerator: "CmdOrCtrl+G",
					click: () => mainWindow.webContents.send("publish-gist"),
				},
			],
		},
	];

	const menu = Menu.buildFromTemplate(template);
	Menu.setApplicationMenu(menu);
}

async function openFile() {
	const result = await dialog.showOpenDialog(mainWindow, {
		properties: ["openFile"],
		filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
	});

	if (!result.canceled && result.filePaths.length > 0) {
		const filePath = result.filePaths[0];
		try {
			const content = await fs.readFile(filePath, "utf8");
			currentFilePath = filePath;
			mainWindow.webContents.send("file-opened", { path: filePath, content });
		} catch (error) {
			dialog.showErrorBox("Error", `Failed to open file: ${error.message}`);
		}
	}
}

async function saveFile() {
	if (currentFilePath) {
		mainWindow.webContents.send("request-content-for-save");
	} else {
		await saveFileAs();
	}
}

async function saveFileAs() {
	const result = await dialog.showSaveDialog(mainWindow, {
		filters: [{ name: "Markdown", extensions: ["md"] }],
	});

	if (!result.canceled && result.filePath) {
		currentFilePath = result.filePath;
		mainWindow.webContents.send("request-content-for-save");
	}
}

ipcMain.handle("save-content", async (event, content) => {
	if (!currentFilePath) return { success: false, error: "No file path" };

	try {
		await fs.writeFile(currentFilePath, content, "utf8");
		return { success: true, path: currentFilePath };
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("get-current-file-path", () => {
	return currentFilePath;
});

ipcMain.handle("publish-gist", async (event, { filename, content }) => {
	try {
		const { publishGist } = __webpack_require__(/*! ./gist-publisher */ "./src/gist-publisher.js");
		const result = await publishGist(filename, content);
		return result;
	} catch (error) {
		return { success: false, error: error.message };
	}
});

ipcMain.handle("open-external", async (event, url) => {
	await shell.openExternal(url);
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) {
		createWindow();
	}
});

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map