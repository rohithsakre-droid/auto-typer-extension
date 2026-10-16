/**
 * AutoTyper Pro - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const codeInput = document.getElementById('code-input');
  const charCounter = document.getElementById('char-counter');
  const btnPaste = document.getElementById('btn-paste');
  const btnDemo = document.getElementById('btn-demo');
  const btnClear = document.getElementById('btn-clear');
  const speedSlider = document.getElementById('speed-slider');
  const speedDisplay = document.getElementById('speed-display');
  const presetPills = document.querySelectorAll('.preset-pill');
  const checkSmartIndent = document.getElementById('check-smart-indent');
  const checkJitter = document.getElementById('check-jitter');
  const btnPickStart = document.getElementById('btn-pick-start');
  const btnCountdownStart = document.getElementById('btn-countdown-start');
  const btnFloatWidget = document.getElementById('btn-float-widget');
  const btnSidepanel = document.getElementById('btn-sidepanel');

  // Active progress elements
  const activeProgressBanner = document.getElementById('active-progress-banner');
  const progressStatusText = document.getElementById('progress-status-text');
  const bannerProgressFill = document.getElementById('banner-progress-fill');
  const btnPopupPause = document.getElementById('btn-popup-pause');
  const btnPopupStop = document.getElementById('btn-popup-stop');

  // Sample LeetCode solution for instant testing
  const DEMO_CODE = `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []`;

  // 1. Load saved state from storage
  chrome.storage.local.get(['savedText', 'savedSpeed', 'savedSmartIndent', 'savedJitter'], (data) => {
    if (data.savedText !== undefined) {
      codeInput.value = data.savedText;
    }
    if (data.savedSpeed !== undefined) {
      updateSpeed(parseInt(data.savedSpeed, 10));
    } else {
      updateSpeed(8);
    }
    if (data.savedSmartIndent !== undefined) {
      checkSmartIndent.checked = data.savedSmartIndent;
    }
    if (data.savedJitter !== undefined) {
      checkJitter.checked = data.savedJitter;
    }
    updateCounters();
  });

  // 2. Query active tab to check if typing is already in progress
  checkActiveTabState();

  // 3. Counter & Auto-save
  function updateCounters() {
    const text = codeInput.value;
    const lines = text ? text.split('\n').length : 0;
    charCounter.textContent = `${text.length} chars | ${lines} lines`;

    chrome.storage.local.set({ savedText: text });
  }

  codeInput.addEventListener('input', updateCounters);

  // Allow Tab key inside textarea
  codeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeInput.selectionStart;
      const end = codeInput.selectionEnd;
      const spaces = '    ';
      codeInput.value = codeInput.value.substring(0, start) + spaces + codeInput.value.substring(end);
      codeInput.selectionStart = codeInput.selectionEnd = start + 4;
      updateCounters();
    }
  });

  // 4. Clipboard Paste Button
  btnPaste.addEventListener('click', async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        codeInput.value = clipText;
        updateCounters();
      }
    } catch (e) {
      codeInput.focus();
      document.execCommand('paste');
      updateCounters();
    }
  });

  // 5. Demo code loader
  btnDemo.addEventListener('click', () => {
    codeInput.value = DEMO_CODE;
    updateCounters();
  });

  // 6. Clear button
  btnClear.addEventListener('click', () => {
    codeInput.value = '';
    updateCounters();
  });

  // 7. Speed handling
  function updateSpeed(ms) {
    ms = Math.max(0, parseInt(ms, 10) || 0);
    speedSlider.value = ms;

    let charsPerSec = ms > 0 ? Math.round(1000 / ms) : 10000;
    let label = `${ms} ms / char (~${charsPerSec} c/s)`;
    if (ms === 0) label = `0 ms (Instant Burst)`;
    else if (ms === 1) label = `1 ms (Ultra Turbo)`;

    speedDisplay.textContent = label;

    // Update preset pills active state
    presetPills.forEach(pill => {
      pill.classList.toggle('active', parseInt(pill.dataset.speed, 10) === ms);
    });

    chrome.storage.local.set({ savedSpeed: ms });

    // Send speed update to content script if currently running
    sendTabMessage({ action: 'SET_SPEED', speedMs: ms });
  }

  speedSlider.addEventListener('input', (e) => {
    updateSpeed(parseInt(e.target.value, 10));
  });

  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      updateSpeed(parseInt(pill.dataset.speed, 10));
    });
  });

  // Options auto-save
  checkSmartIndent.addEventListener('change', () => {
    chrome.storage.local.set({ savedSmartIndent: checkSmartIndent.checked });
  });

  checkJitter.addEventListener('change', () => {
    chrome.storage.local.set({ savedJitter: checkJitter.checked });
  });

  // 8. Communication Helpers
  async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  async function sendTabMessage(message) {
    try {
      const tab = await getActiveTab();
      if (!tab || !tab.id) return null;

      // Check if URL is supported (not chrome:// or edge://)
      if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:'))) {
        alert('AutoTyper works on web pages (e.g. LeetCode, CodeSandbox, GitHub, etc.). It cannot run on internal browser settings pages.');
        return null;
      }

      // Try sending message; if content script is not yet injected, inject it on-demand
      try {
        const response = await chrome.tabs.sendMessage(tab.id, message);
        return response;
      } catch (err) {
        // Inject content scripts programmatically if needed
        await chrome.scripting.insertCSS({
          target: { tabId: tab.id },
          files: ['content/content.css']
        });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'content/key-simulator.js',
            'content/target-picker.js',
            'content/floating-widget.js',
            'content/content-main.js'
          ]
        });
        // Retry message
        return await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (e) {
      console.warn('AutoTyper tab message warning:', e);
      return null;
    }
  }

  // Check state of active tab
  async function checkActiveTabState() {
    const res = await sendTabMessage({ action: 'GET_STATE' });
    if (res && res.isRunning) {
      showProgressBanner(res);
    }
  }

  function showProgressBanner(state) {
    if (!state || !state.isRunning) {
      activeProgressBanner.classList.add('hidden');
      return;
    }
    activeProgressBanner.classList.remove('hidden');
    const percent = state.totalLength > 0 ? Math.round((state.currentIndex / state.totalLength) * 100) : 0;
    progressStatusText.textContent = `Typing: ${state.currentIndex} / ${state.totalLength} (${percent}%)`;
    bannerProgressFill.style.width = `${percent}%`;

    btnPopupPause.textContent = state.isPaused ? '▶️ Resume' : '⏸️ Pause';
  }

  // Listen for state broadcasts
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AUTOTYPER_STATE_UPDATE') {
      if (msg.isRunning) {
        showProgressBanner(msg);
      } else {
        activeProgressBanner.classList.add('hidden');
      }
    }
  });

  // Pause / Resume / Stop in popup
  btnPopupPause.addEventListener('click', async () => {
    const isPaused = btnPopupPause.textContent.includes('Resume');
    await sendTabMessage({ action: isPaused ? 'RESUME' : 'PAUSE' });
    btnPopupPause.textContent = isPaused ? '⏸️ Pause' : '▶️ Resume';
  });

  btnPopupStop.addEventListener('click', async () => {
    await sendTabMessage({ action: 'STOP' });
    activeProgressBanner.classList.add('hidden');
  });

  // 9. Launch Actions
  function getConfig() {
    const text = codeInput.value;
    if (!text.trim()) {
      alert('Please paste or enter some code/text first!');
      codeInput.focus();
      return null;
    }
    return {
      text,
      speedMs: parseInt(speedSlider.value, 10),
      jitter: checkJitter.checked,
      smartIndent: checkSmartIndent.checked
    };
  }

  // A. "Pick Target & Start Typing"
  btnPickStart.addEventListener('click', async () => {
    const config = getConfig();
    if (!config) return;

    await sendTabMessage(Object.assign({ action: 'START_PICKER' }, config));
    // Close popup so user has full view to click the target editor on the webpage
    window.close();
  });

  // B. "3s Countdown"
  btnCountdownStart.addEventListener('click', async () => {
    const config = getConfig();
    if (!config) return;

    await sendTabMessage(Object.assign({ action: 'START_COUNTDOWN' }, config));
    window.close();
  });

  // C. "Floating Widget"
  btnFloatWidget.addEventListener('click', async () => {
    const config = getConfig();
    await sendTabMessage({
      action: 'SHOW_FLOATING_WIDGET',
      text: config ? config.text : codeInput.value,
      speedMs: parseInt(speedSlider.value, 10)
    });
    window.close();
  });

  // D. Side Panel Button
  btnSidepanel.addEventListener('click', async () => {
    try {
      const tab = await getActiveTab();
      if (tab && chrome.sidePanel && chrome.sidePanel.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
        window.close();
      } else {
        alert('Side panel is available in Chrome 114+ by clicking the side panel icon in your toolbar.');
      }
    } catch (e) {
      console.log('Side panel open info:', e);
    }
  });
});
