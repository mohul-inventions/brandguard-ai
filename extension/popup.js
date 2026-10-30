// BrandGuard AI Extension - Popup Logic
document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scanActiveTabBtn');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const critCount = document.getElementById('critCount');
  const highCount = document.getElementById('highCount');
  const passedCount = document.getElementById('passedCount');
  const findingCount = document.getElementById('findingCount');
  const findingsList = document.getElementById('findingsList');
  const connStatus = document.getElementById('connStatus');
  const loginView = document.getElementById('loginView');
  const demoLoginBtn = document.getElementById('demoLoginBtn');
  const apiUrlInput = document.getElementById('apiUrlInput');

  // Check auth status
  chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (res) => {
    if (!res || !res.isAuthenticated) {
      loginView.style.display = 'block';
      connStatus.textContent = 'Disconnected';
      connStatus.style.background = '#7f1d1d';
      connStatus.style.color = '#fca5a5';
    } else {
      connStatus.textContent = 'Connected: ' + (res.user?.name || 'Reviewer');
    }
    if (res && res.apiUrl) {
      apiUrlInput.value = res.apiUrl;
    }
  });

  // Demo Login Handler
  demoLoginBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlInput.value.trim() || 'http://localhost:5000/api';
    try {
      const res = await fetch(`${apiUrl}/auth/demo-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'REVIEWER' }),
      });
      if (res.ok) {
        const data = await res.json();
        await chrome.storage.local.set({
          authToken: data.token,
          user: data.user,
          apiUrl,
        });
        loginView.style.display = 'none';
        connStatus.textContent = 'Connected: ' + data.user.name;
        connStatus.style.background = '#065f46';
        connStatus.style.color = '#6ee7b7';
      }
    } catch (err) {
      alert('Login failed: ' + err.message);
    }
  });

  // Scan Active Tab
  scanBtn.addEventListener('click', () => {
    scanBtn.textContent = 'Scanning...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        scanBtn.textContent = 'Scan Active Page';
        return;
      }
      chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_TEXT' }, (response) => {
        if (chrome.runtime.lastError || !response || !response.text) {
          // If content script was not injected or selection empty
          scoreDisplay.textContent = 'N/A';
          findingsList.innerHTML = '<div style="color: #f59e0b; font-size: 11px; padding: 12px; text-align: center;">No editable text detected. Select text or focus a text editor in Google Docs, WordPress, or LinkedIn.</div>';
          scanBtn.textContent = 'Scan Active Page';
          return;
        }

        chrome.runtime.sendMessage(
          {
            type: 'CHECK_COMPLIANCE',
            payload: { content: response.text, channel: response.editorType || 'WEB_PAGE' },
          },
          (apiRes) => {
            scanBtn.textContent = 'Scan Active Page';
            if (apiRes && apiRes.success && apiRes.data) {
              renderResults(apiRes.data);
            } else {
              findingsList.innerHTML = `<div style="color: #ef4444; font-size: 11px; padding: 12px;">Error: ${apiRes?.error || 'Failed to scan'}</div>`;
            }
          }
        );
      });
    });
  });

  function renderResults(data) {
    scoreDisplay.textContent = `${data.overallScore}%`;
    scoreDisplay.style.color = data.overallScore >= 80 ? '#10b981' : data.overallScore >= 60 ? '#f59e0b' : '#ef4444';
    critCount.textContent = data.criticalCount || 0;
    highCount.textContent = data.highCount || 0;
    passedCount.textContent = Math.max(0, 8 - (data.criticalCount + data.highCount));
    findingCount.textContent = data.findings ? data.findings.length : 0;

    if (!data.findings || data.findings.length === 0) {
      findingsList.innerHTML = '<div style="color: #10b981; font-size: 12px; text-align: center; padding: 16px;">✨ Perfect! 100% brand compliant. No violations detected.</div>';
      return;
    }

    findingsList.innerHTML = '';
    data.findings.forEach((f) => {
      const item = document.createElement('div');
      item.className = 'finding-item ' + (f.severity === 'CRITICAL' ? '' : 'warning');
      item.innerHTML = `
        <div class="finding-title">[${f.severity}] ${f.title}</div>
        <div style="font-size: 11px; color: #94a3b8; font-style: italic;">"${f.excerpt}"</div>
        <div style="font-size: 11px; color: #cbd5e1; margin-top: 3px;">${f.explanation}</div>
        ${f.suggestedCorrection ? `<div class="finding-fix" data-fix="${encodeURIComponent(f.suggestedCorrection)}">💡 Fix: ${f.suggestedCorrection}</div>` : ''}
      `;
      findingsList.appendChild(item);
    });

    // Wire fix clicks
    document.querySelectorAll('.finding-fix').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const replacement = decodeURIComponent(e.target.getAttribute('data-fix'));
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'APPLY_FIX', replacement });
          }
        });
      });
    });
  }
});
