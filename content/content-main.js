/**
 * AutoTyper Content Script Main Orchestrator
 * Connects the Key Simulator Engine, Target Picker, Floating Widget, and Extension Messages
 */

(function () {
  'use strict';

  // Prevent multiple initializations in the same frame
  if (window.__AUTOTYPER_INITIALIZED__) return;
  window.__AUTOTYPER_INITIALIZED__ = true;

  // Initialize modules
  const autoTyper = new window.AutoTyperEngine.AutoTyper();
  const targetPicker = new window.AutoTyperTargetPicker();
  let floatingWidget = null;

  // Current session config
  let currentConfig = {
    text: '',
    speedMs: 10,
    jitter: false,
    smartIndent: true
  };

  /**
   * Helper to ensure floating widget is initialized
   */
  function getWidget() {
    if (!floatingWidget) {
      floatingWidget = new window.AutoTyperFloatingWidget({
        onStartTyping: (cfg) => {
          currentConfig = Object.assign(currentConfig, cfg);
          startTyping(document.activeElement);
        },
        onSpeedChange: (speedMs) => {
          currentConfig.speedMs = speedMs;
          autoTyper.setSpeed(speedMs);
          notifyPopupState();
        },
        onPause: () => {
          autoTyper.pause();
          notifyPopupState();
        },
        onResume: () => {
          autoTyper.resume();
          notifyPopupState();
        },
        onStop: () => {
          autoTyper.stop();
          notifyPopupState();
        },
        onPickTarget: (cfg) => {
          currentConfig = Object.assign(currentConfig, cfg);
          launchTargetPicker();
        }
      });
    }
    return floatingWidget;
  }

  /**
   * Start typing sequence into a given or active target
   */
  function startTyping(targetElement) {
    if (!currentConfig.text) {
      showToast('⚠️ No text provided to type!', 'warning');
      return;
    }

    const widget = getWidget();
    widget.showHUD({
      totalChars: currentConfig.text.length,
      speedMs: currentConfig.speedMs
    });

    autoTyper.start({
      text: currentConfig.text,
      target: targetElement,
      speedMs: currentConfig.speedMs,
      jitter: currentConfig.jitter,
      smartIndent: currentConfig.smartIndent,
      onProgress: (prog) => {
        widget.updateProgress(prog);
        notifyPopupState(prog);
      },
      onComplete: () => {
        showToast('✨ Auto-typing complete!', 'success');
        notifyPopupState({ isRunning: false, isComplete: true });
      },
      onError: (err) => {
        showToast('⚠️ ' + err, 'error');
        widget.hide();
        notifyPopupState({ isRunning: false, error: err });
      }
    });
  }

  /**
   * Launch visual target picker overlay
   */
  function launchTargetPicker() {
    targetPicker.start({
      onSelect: (selectedEl) => {
        showToast('🎯 Editor selected! Starting typing...', 'info');
        setTimeout(() => {
          startTyping(selectedEl);
        }, 150);
      },
      onCancel: () => {
        showToast('Target selection canceled', 'info');
      }
    });
  }

  /**
   * Start 3-second countdown on screen
   */
  function startCountdown() {
    const countdownOverlay = document.createElement('div');
    countdownOverlay.className = 'autotyper-picker-banner';
    countdownOverlay.style.top = '25%';
    countdownOverlay.style.borderRadius = '16px';
    countdownOverlay.style.padding = '18px 28px';

    let count = 3;
    const updateCountdown = () => {
      countdownOverlay.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:8px;">
          <div style="font-size:32px; font-weight:800; color:#38bdf8; font-family:ui-monospace, monospace;">${count}</div>
          <div style="font-size:14px; font-weight:600; color:#f8fafc;">Click your code editor now!</div>
          <div style="font-size:11px; color:#94a3b8;">Typing starts automatically in active editor</div>
        </div>
      `;
    };

    updateCountdown();
    document.body.appendChild(countdownOverlay);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        updateCountdown();
      } else {
        clearInterval(interval);
        countdownOverlay.remove();
        startTyping(document.activeElement);
      }
    }, 1000);
  }

  /**
   * Temporary Toast Notifications
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'autotyper-picker-banner';
    toast.style.top = '24px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = type === 'error' ? 'rgba(239, 68, 68, 0.95)' :
                            type === 'success' ? 'rgba(16, 185, 129, 0.95)' :
                            'rgba(15, 23, 42, 0.95)';
    toast.innerHTML = `<span style="font-size:13px; font-weight:600; color:#fff;">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -10px)';
      setTimeout(() => toast.remove(), 400);
    }, 2400);
  }

  /**
   * Broadcast state back to popup or sidepanel
   */
  function notifyPopupState(progressData = {}) {
    const state = Object.assign({
      type: 'AUTOTYPER_STATE_UPDATE',
      isRunning: autoTyper.isRunning,
      isPaused: autoTyper.isPaused,
      speedMs: autoTyper.speedMs,
      currentIndex: autoTyper.currentIndex,
      totalLength: autoTyper.text ? autoTyper.text.length : 0
    }, progressData);

    try {
      chrome.runtime.sendMessage(state).catch(() => {
        // Popup or sidepanel might be closed, which is normal
      });
    } catch (e) {}
  }

  // Emergency Escape Listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && autoTyper.isRunning) {
      autoTyper.stop();
      getWidget().hide();
      showToast('⏹️ Auto-typing stopped (ESC pressed)', 'info');
      notifyPopupState();
    }
  }, true);

  // Message listener for Chrome runtime requests
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request || !request.action) return false;

    switch (request.action) {
      case 'PING':
        sendResponse({ status: 'PONG', isRunning: autoTyper.isRunning });
        break;

      case 'START_PICKER':
        currentConfig = {
          text: request.text || '',
          speedMs: request.speedMs || 10,
          jitter: !!request.jitter,
          smartIndent: !!request.smartIndent
        };
        launchTargetPicker();
        sendResponse({ status: 'PICKER_STARTED' });
        break;

      case 'START_TYPING':
        currentConfig = {
          text: request.text || '',
          speedMs: request.speedMs || 10,
          jitter: !!request.jitter,
          smartIndent: !!request.smartIndent
        };
        startTyping(document.activeElement);
        sendResponse({ status: 'TYPING_STARTED' });
        break;

      case 'START_COUNTDOWN':
        currentConfig = {
          text: request.text || '',
          speedMs: request.speedMs || 10,
          jitter: !!request.jitter,
          smartIndent: !!request.smartIndent
        };
        startCountdown();
        sendResponse({ status: 'COUNTDOWN_STARTED' });
        break;

      case 'SHOW_FLOATING_WIDGET':
        const widget = getWidget();
        widget.showFull(request.text || '', request.speedMs || 10);
        sendResponse({ status: 'WIDGET_SHOWN' });
        break;

      case 'SET_SPEED':
        const newSpeed = parseInt(request.speedMs, 10) || 0;
        currentConfig.speedMs = newSpeed;
        autoTyper.setSpeed(newSpeed);
        sendResponse({ status: 'SPEED_UPDATED', speedMs: newSpeed });
        break;

      case 'PAUSE':
        autoTyper.pause();
        sendResponse({ status: 'PAUSED' });
        break;

      case 'RESUME':
        autoTyper.resume();
        sendResponse({ status: 'RESUMED' });
        break;

      case 'STOP':
        autoTyper.stop();
        getWidget().hide();
        sendResponse({ status: 'STOPPED' });
        break;

      case 'GET_STATE':
        sendResponse({
          isRunning: autoTyper.isRunning,
          isPaused: autoTyper.isPaused,
          speedMs: autoTyper.speedMs,
          currentIndex: autoTyper.currentIndex,
          totalLength: autoTyper.text ? autoTyper.text.length : 0
        });
        break;

      default:
        sendResponse({ status: 'UNKNOWN_ACTION' });
    }

    return true; // Keep message channel open for async response
  });
})();
