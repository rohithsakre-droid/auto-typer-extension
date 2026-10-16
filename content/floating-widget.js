/**
 * AutoTyper Floating Widget & HUD
 * Sleek, draggable in-page interface providing live progress, on-the-fly speed controls, and quick typing
 */

(function () {
  'use strict';

  class FloatingWidget {
    constructor({ onStartTyping, onSpeedChange, onPause, onResume, onStop, onPickTarget }) {
      this.onStartTyping = onStartTyping || null;
      this.onSpeedChange = onSpeedChange || null;
      this.onPause = onPause || null;
      this.onResume = onResume || null;
      this.onStop = onStop || null;
      this.onPickTarget = onPickTarget || null;

      this.container = null;
      this.isMinimized = false;
      this.isDragging = false;
      this.dragOffset = { x: 0, y: 0 };

      // State
      this.mode = 'hud'; // 'hud' (minimal while typing) or 'full' (full in-page controller)
      this.currentSpeedMs = 10;
    }

    /**
     * Show HUD during active typing
     */
    showHUD({ totalChars, speedMs }) {
      this.mode = 'hud';
      this.currentSpeedMs = speedMs || 10;
      this._ensureCreated();

      this.container.classList.remove('autotyper-hidden');
      this.container.classList.add('autotyper-hud-mode');
      this.container.classList.remove('autotyper-full-mode');
      this._renderHUD(totalChars);
    }

    /**
     * Show full floating controller on the page
     */
    showFull(initialText = '', speedMs = 10) {
      this.mode = 'full';
      this.currentSpeedMs = speedMs;
      this._ensureCreated();

      this.container.classList.remove('autotyper-hidden');
      this.container.classList.add('autotyper-full-mode');
      this.container.classList.remove('autotyper-hud-mode');
      this._renderFull(initialText);
    }

    hide() {
      if (this.container) {
        this.container.classList.add('autotyper-hidden');
      }
    }

    /**
     * Update progress from key simulator
     */
    updateProgress({ current, total, percent, isRunning, isPaused, speedMs }) {
      if (!this.container || this.container.classList.contains('autotyper-hidden')) return;

      if (speedMs !== undefined) {
        this.currentSpeedMs = speedMs;
      }

      const progressBar = this.container.querySelector('.autotyper-progress-fill');
      const progressText = this.container.querySelector('.autotyper-progress-text');
      const pauseResumeBtn = this.container.querySelector('.autotyper-btn-pause-resume');
      const speedLabel = this.container.querySelector('.autotyper-speed-val');

      if (progressBar) progressBar.style.width = `${percent}%`;
      if (progressText) {
        progressText.textContent = `${current} / ${total} chars (${percent}%)`;
      }

      if (speedLabel) {
        speedLabel.textContent = `${this.currentSpeedMs}ms`;
      }

      if (pauseResumeBtn) {
        if (isPaused) {
          pauseResumeBtn.innerHTML = '▶️ Resume';
          pauseResumeBtn.title = 'Resume Auto-Typing';
          pauseResumeBtn.classList.add('autotyper-btn-resuming');
        } else {
          pauseResumeBtn.innerHTML = '⏸️ Pause';
          pauseResumeBtn.title = 'Pause Auto-Typing';
          pauseResumeBtn.classList.remove('autotyper-btn-resuming');
        }
      }

      // If complete
      if (percent >= 100 && !isRunning) {
        const statusBadge = this.container.querySelector('.autotyper-status-badge');
        if (statusBadge) {
          statusBadge.innerHTML = '✨ Completed!';
          statusBadge.className = 'autotyper-status-badge autotyper-badge-done';
        }
        setTimeout(() => {
          if (this.mode === 'hud') {
            this.hide();
          }
        }, 2200);
      }
    }

    _ensureCreated() {
      if (this.container) return;

      this.container = document.createElement('div');
      this.container.className = 'autotyper-floating-widget autotyper-hidden';
      this.container.id = 'autotyper-root-widget';

      // Default position: bottom-right corner
      this.container.style.right = '24px';
      this.container.style.bottom = '24px';

      document.body.appendChild(this.container);
      this._bindDrag();
    }

    _bindDrag() {
      let startX, startY, origX, origY;

      const onMouseDown = (e) => {
        // Only drag from header or handle
        if (!e.target.closest('.autotyper-drag-handle, .autotyper-widget-header')) return;
        if (e.target.closest('button, input, textarea, a')) return;

        this.isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        const rect = this.container.getBoundingClientRect();
        origX = rect.left;
        origY = rect.top;

        // Switch positioning to fixed left/top for smooth movement
        this.container.style.right = 'auto';
        this.container.style.bottom = 'auto';
        this.container.style.left = `${origX}px`;
        this.container.style.top = `${origY}px`;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
      };

      const onMouseMove = (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newX = Math.max(10, Math.min(window.innerWidth - 300, origX + dx));
        let newY = Math.max(10, Math.min(window.innerHeight - 100, origY + dy));

        this.container.style.left = `${newX}px`;
        this.container.style.top = `${newY}px`;
      };

      const onMouseUp = () => {
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      this.container.addEventListener('mousedown', onMouseDown);
    }

    _renderHUD(totalChars) {
      this.container.innerHTML = `
        <div class="autotyper-widget-card autotyper-hud-card">
          <div class="autotyper-widget-header autotyper-drag-handle">
            <div class="autotyper-header-left">
              <span class="autotyper-logo-dot"></span>
              <span class="autotyper-title">AutoTyper HUD</span>
              <span class="autotyper-status-badge autotyper-badge-typing">Typing...</span>
            </div>
            <div class="autotyper-header-actions">
              <button class="autotyper-icon-btn autotyper-btn-close" title="Stop & Close HUD">✕</button>
            </div>
          </div>

          <div class="autotyper-hud-body">
            <!-- Progress Bar -->
            <div class="autotyper-progress-container">
              <div class="autotyper-progress-bar">
                <div class="autotyper-progress-fill" style="width: 0%;"></div>
              </div>
              <div class="autotyper-progress-meta">
                <span class="autotyper-progress-text">0 / ${totalChars} chars (0%)</span>
                <span class="autotyper-speed-text">Speed: <b class="autotyper-speed-val">${this.currentSpeedMs}ms</b>/char</span>
              </div>
            </div>

            <!-- Live Speed Control Slider -->
            <div class="autotyper-live-speed-row">
              <label class="autotyper-slider-label">⚡ Live Speed:</label>
              <input type="range" class="autotyper-hud-slider" min="0" max="150" value="${this.currentSpeedMs}" step="1">
              <span class="autotyper-slider-display">${this.currentSpeedMs} ms</span>
            </div>

            <!-- Action Controls -->
            <div class="autotyper-hud-controls">
              <button class="autotyper-btn autotyper-btn-pause-resume" title="Pause / Resume">⏸️ Pause</button>
              <button class="autotyper-btn autotyper-btn-stop" title="Emergency Stop (Esc)">⏹️ Stop</button>
            </div>
          </div>
        </div>
      `;

      this._wireHUDEvents();
    }

    _wireHUDEvents() {
      const slider = this.container.querySelector('.autotyper-hud-slider');
      const sliderDisplay = this.container.querySelector('.autotyper-slider-display');
      const pauseResumeBtn = this.container.querySelector('.autotyper-btn-pause-resume');
      const stopBtn = this.container.querySelector('.autotyper-btn-stop');
      const closeBtn = this.container.querySelector('.autotyper-btn-close');

      if (slider) {
        slider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          this.currentSpeedMs = val;
          if (sliderDisplay) sliderDisplay.textContent = `${val} ms`;
          if (this.onSpeedChange) this.onSpeedChange(val);
        });
      }

      let isPaused = false;
      if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => {
          isPaused = !isPaused;
          if (isPaused) {
            if (this.onPause) this.onPause();
          } else {
            if (this.onResume) this.onResume();
          }
        });
      }

      if (stopBtn) {
        stopBtn.addEventListener('click', () => {
          if (this.onStop) this.onStop();
          this.hide();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (this.onStop) this.onStop();
          this.hide();
        });
      }
    }

    _renderFull(initialText = '') {
      this.container.innerHTML = `
        <div class="autotyper-widget-card autotyper-full-card">
          <div class="autotyper-widget-header autotyper-drag-handle">
            <div class="autotyper-header-left">
              <span class="autotyper-logo-icon">⚡</span>
              <span class="autotyper-title">AutoTyper Pro</span>
            </div>
            <div class="autotyper-header-actions">
              <button class="autotyper-icon-btn autotyper-btn-minimize" title="Minimize">─</button>
              <button class="autotyper-icon-btn autotyper-btn-close" title="Close">✕</button>
            </div>
          </div>

          <div class="autotyper-full-body">
            <!-- Text Input Area -->
            <div class="autotyper-field-group">
              <div class="autotyper-field-header">
                <label>Paste Code / Text to Type:</label>
                <div class="autotyper-field-actions">
                  <button class="autotyper-mini-btn autotyper-btn-paste">📋 Paste</button>
                  <button class="autotyper-mini-btn autotyper-btn-clear">🧹 Clear</button>
                </div>
              </div>
              <textarea class="autotyper-code-input" placeholder="Paste your code or text here..." rows="6">${initialText}</textarea>
              <div class="autotyper-char-count">0 characters | 0 lines</div>
            </div>

            <!-- Speed Control -->
            <div class="autotyper-speed-section">
              <div class="autotyper-speed-header">
                <label>Typing Speed:</label>
                <span class="autotyper-speed-preset-val">${this.currentSpeedMs} ms / char</span>
              </div>

              <!-- Speed Presets -->
              <div class="autotyper-presets-grid">
                <button class="autotyper-preset-chip" data-speed="1">⚡ Turbo (1ms)</button>
                <button class="autotyper-preset-chip" data-speed="10">🚀 Fast (10ms)</button>
                <button class="autotyper-preset-chip" data-speed="35">🏎️ Medium (35ms)</button>
                <button class="autotyper-preset-chip" data-speed="80">🧑‍💻 Human (80ms)</button>
              </div>

              <input type="range" class="autotyper-full-slider" min="0" max="200" value="${this.currentSpeedMs}" step="1">
            </div>

            <!-- Options -->
            <div class="autotyper-options-row">
              <label class="autotyper-checkbox-label">
                <input type="checkbox" class="autotyper-check-jitter">
                <span>Human Jitter (Natural randomness)</span>
              </label>
              <label class="autotyper-checkbox-label">
                <input type="checkbox" class="autotyper-check-smart-indent" checked>
                <span>Smart Indent (LeetCode fix)</span>
              </label>
            </div>

            <!-- Action Buttons -->
            <div class="autotyper-action-buttons">
              <button class="autotyper-main-btn autotyper-btn-pick-start">
                <span class="autotyper-btn-icon">🎯</span> Select Editor & Start
              </button>
              <button class="autotyper-secondary-btn autotyper-btn-active-start">
                <span class="autotyper-btn-icon">⚡</span> Type into Active Focus
              </button>
            </div>
          </div>
        </div>
      `;

      this._wireFullEvents();
    }

    _wireFullEvents() {
      const textarea = this.container.querySelector('.autotyper-code-input');
      const charCount = this.container.querySelector('.autotyper-char-count');
      const pasteBtn = this.container.querySelector('.autotyper-btn-paste');
      const clearBtn = this.container.querySelector('.autotyper-btn-clear');
      const slider = this.container.querySelector('.autotyper-full-slider');
      const speedValLabel = this.container.querySelector('.autotyper-speed-preset-val');
      const presetChips = this.container.querySelectorAll('.autotyper-preset-chip');
      const pickBtn = this.container.querySelector('.autotyper-btn-pick-start');
      const activeBtn = this.container.querySelector('.autotyper-btn-active-start');
      const closeBtn = this.container.querySelector('.autotyper-btn-close');
      const minimizeBtn = this.container.querySelector('.autotyper-btn-minimize');

      const updateStats = () => {
        if (!textarea || !charCount) return;
        const text = textarea.value;
        const lines = text ? text.split('\n').length : 0;
        charCount.textContent = `${text.length} characters | ${lines} lines`;
      };

      if (textarea) {
        textarea.addEventListener('input', updateStats);
        updateStats();
      }

      if (pasteBtn && textarea) {
        pasteBtn.addEventListener('click', async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              textarea.value = text;
              updateStats();
            }
          } catch (e) {
            textarea.focus();
            document.execCommand('paste');
            updateStats();
          }
        });
      }

      if (clearBtn && textarea) {
        clearBtn.addEventListener('click', () => {
          textarea.value = '';
          updateStats();
        });
      }

      const setSpeed = (ms) => {
        this.currentSpeedMs = ms;
        if (slider) slider.value = ms;
        if (speedValLabel) speedValLabel.textContent = `${ms} ms / char`;
        presetChips.forEach(chip => {
          chip.classList.toggle('autotyper-chip-active', parseInt(chip.dataset.speed, 10) === ms);
        });
        if (this.onSpeedChange) this.onSpeedChange(ms);
      };

      if (slider) {
        slider.addEventListener('input', (e) => setSpeed(parseInt(e.target.value, 10)));
      }

      presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
          setSpeed(parseInt(chip.dataset.speed, 10));
        });
      });

      if (pickBtn) {
        pickBtn.addEventListener('click', () => {
          const text = textarea.value;
          if (!text) {
            alert('Please paste some code or text first!');
            return;
          }
          const jitter = this.container.querySelector('.autotyper-check-jitter')?.checked || false;
          const smartIndent = this.container.querySelector('.autotyper-check-smart-indent')?.checked || true;

          if (this.onPickTarget) {
            this.onPickTarget({ text, speedMs: this.currentSpeedMs, jitter, smartIndent });
          }
        });
      }

      if (activeBtn) {
        activeBtn.addEventListener('click', () => {
          const text = textarea.value;
          if (!text) {
            alert('Please paste some code or text first!');
            return;
          }
          const jitter = this.container.querySelector('.autotyper-check-jitter')?.checked || false;
          const smartIndent = this.container.querySelector('.autotyper-check-smart-indent')?.checked || true;

          if (this.onStartTyping) {
            this.onStartTyping({ text, speedMs: this.currentSpeedMs, jitter, smartIndent });
          }
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide());
      }

      if (minimizeBtn) {
        minimizeBtn.addEventListener('click', () => {
          this.isMinimized = !this.isMinimized;
          const body = this.container.querySelector('.autotyper-full-body');
          if (body) {
            body.style.display = this.isMinimized ? 'none' : 'block';
          }
          minimizeBtn.textContent = this.isMinimized ? '□' : '─';
        });
      }
    }
  }

  window.AutoTyperFloatingWidget = FloatingWidget;
})();
