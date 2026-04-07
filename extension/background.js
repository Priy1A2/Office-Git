// OfficeGit Background Service Worker
// Handles token refresh and background tasks

chrome.runtime.onInstalled.addListener(() => {
  console.log('OfficeGit extension installed');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkAuth') {
    checkAuthentication().then(sendResponse);
    return true; // Keep message channel open for async
  }
});

async function checkAuthentication() {
  const data = await chrome.storage.local.get(['serverUrl', 'token']);

  if (!data.serverUrl || !data.token) {
    return { authenticated: false };
  }

  try {
    const response = await fetch(`${data.serverUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${data.token}` },
    });

    if (!response.ok) {
      await chrome.storage.local.remove(['token', 'user']);
      return { authenticated: false };
    }

    const result = await response.json();
    return { authenticated: true, user: result.user };
  } catch {
    return { authenticated: false, error: 'Connection failed' };
  }
}
