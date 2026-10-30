// BrandGuard AI - In-Situ Content Script
(function () {
  let floatingPill = null;
  let activeTarget = null;
  let debounceTimer = null;

  // Detect which editor is active on the page
  function detectEditor() {
    const host = window.location.hostname;
    if (host.includes('docs.google.com')) return 'GOOGLE_DOCS';
    if (host.includes('wordpress') || document.querySelector('.block-editor-writing-flow')) return 'WORDPRESS';
    if (host.includes('linkedin.com')) return 'LINKEDIN';
    return 'GENERIC_WEB_EDITOR';
  }

  // Extract text from current active target or selection
  function extractActiveText() {
    // 1. Text Selection
    const selection = window.getSelection()?.toString()?.trim();
    if (selection && selection.length > 5) {
      return { text: selection, type: 'selection', editorType: detectEditor() };
    }

    // 2. Focused Input / Textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
      activeTarget = activeEl;
      return { text: activeEl.value, type: 'input', editorType: detectEditor() };
    }

    // 3. ContentEditable (Google Docs HTML fallback, WordPress Gutenberg blocks, LinkedIn posts)
    if (activeEl && activeEl.isContentEditable) {
      activeTarget = activeEl;
      return { text: activeEl.innerText, type: 'contenteditable', editorType: detectEditor() };
    }

    // 4. Look for known CMS editor selectors on page
    const wpEditor = document.querySelector('.block-editor-writing-flow, .editor-styles-wrapper, .ql-editor');
    if (wpEditor) {
      return { text: wpEditor.innerText, type: 'cms_editor', editorType: 'WORDPRESS' };
    }

    const linkedInPost = document.querySelector('.share-box-feed-entry__text-editor, .ql-editor');
    if (linkedInPost) {
      return { text: linkedInPost.innerText, type: 'linkedin_editor', editorType: 'LINKEDIN' };
    }

    // Fallback: Check if on Google Docs canvas editor
    if (detectEditor() === 'GOOGLE_DOCS') {
      const gdocsText = document.querySelector('.kix-appview-editor')?.innerText;
      if (gdocsText) {
        return { text: gdocsText, type: 'google_docs_dom', editorType: 'GOOGLE_DOCS' };
      }
    }

    return null;
  }

  // Create or update the floating BrandGuard badge on the page
  function updateFloatingPill(score, criticalCount) {
    if (!floatingPill) {
      floatingPill = document.createElement('div');
      floatingPill.id = 'brandguard-floating-pill';
      floatingPill.innerHTML = `
        <span>🛡️ BrandGuard</span>
        <span id="brandguard-pill-score">--</span>
      `;
      floatingPill.addEventListener('click', () => {
        // Trigger extension popup or alert
        alert(`BrandGuard AI: Compliance score is ${score}%. ${criticalCount} critical issue(s). Click extension icon for full report.`);
      });
      document.body.appendChild(floatingPill);
    }

    const scoreEl = document.getElementById('brandguard-pill-score');
    if (scoreEl) {
      scoreEl.textContent = `${score}%`;
      scoreEl.className = score >= 80 ? 'bg-score-green' : score >= 60 ? 'bg-score-yellow' : 'bg-score-red';
    }
  }

  // Live input monitoring for textareas and contenteditable elements
  document.addEventListener(
    'input',
    (e) => {
      const target = e.target;
      if (target.tagName === 'TEXTAREA' || target.isContentEditable) {
        activeTarget = target;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const text = target.value || target.innerText;
          if (text && text.trim().length > 15) {
            chrome.runtime.sendMessage(
              {
                type: 'CHECK_COMPLIANCE',
                payload: { content: text, channel: detectEditor() },
              },
              (res) => {
                if (res && res.success && res.data) {
                  updateFloatingPill(res.data.overallScore, res.data.criticalCount);
                }
              }
            );
          }
        }, 800);
      }
    },
    true
  );

  // Message listener from extension popup
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    if (req.type === 'EXTRACT_TEXT') {
      const data = extractActiveText();
      sendResponse(data || { text: null });
      return;
    }

    if (req.type === 'APPLY_FIX') {
      if (activeTarget) {
        if (activeTarget.tagName === 'TEXTAREA' || activeTarget.tagName === 'INPUT') {
          activeTarget.value = req.replacement;
          activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
        } else if (activeTarget.isContentEditable) {
          activeTarget.innerText = req.replacement;
          activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
        }
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active editor field found to apply fix.' });
      }
      return;
    }
  });

  console.log('[BrandGuard AI] In-situ content script initialized for:', detectEditor());
})();
