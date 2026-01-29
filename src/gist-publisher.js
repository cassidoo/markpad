const { exec } = require('child_process');
const { promisify } = require('util');
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
      const tokenPath = require('path').join(require('os').homedir(), '.config', 'github-copilot', 'hosts.json');
      const fs = require('fs');
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
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
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

  const { shell, dialog } = require('electron');
  
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
  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  
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
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
    
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
