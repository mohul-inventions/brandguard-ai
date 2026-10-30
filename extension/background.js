// BrandGuard AI Extension - Background Service Worker
const DEFAULT_API_URL = 'http://localhost:5000/api';

chrome.runtime.onInstalled.addListener(() => {
  console.log('[BrandGuard AI] Extension successfully installed.');
  chrome.storage.local.get(['apiUrl'], (res) => {
    if (!res.apiUrl) {
      chrome.storage.local.set({ apiUrl: DEFAULT_API_URL });
    }
  });
});

// Relay API requests from content scripts to bypass page-level CORS
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_COMPLIANCE') {
    handleComplianceCheck(request.payload)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for asynchronous response
  }

  if (request.type === 'GET_AUTH_STATUS') {
    chrome.storage.local.get(['authToken', 'user', 'apiUrl'], (items) => {
      sendResponse({
        isAuthenticated: !!items.authToken,
        user: items.user || null,
        apiUrl: items.apiUrl || DEFAULT_API_URL,
      });
    });
    return true;
  }
});

async function handleComplianceCheck(payload) {
  const items = await chrome.storage.local.get(['authToken', 'apiUrl']);
  const apiUrl = items.apiUrl || DEFAULT_API_URL;
  const token = items.authToken;

  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoint = token
    ? `${apiUrl}/reviews/check-ephemeral`
    : `${apiUrl}/reviews/check-ephemeral`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: payload.content,
      contentType: payload.contentType || 'OTHER',
      channel: payload.channel || 'BROWSER_EXTENSION',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  return await response.json();
}
