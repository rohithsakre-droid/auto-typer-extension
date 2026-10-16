/**
 * AutoTyper Target Picker
 * Interactive visual element inspector to select any code editor or text field on the page
 */

(function () {
  'use strict';

  class TargetPicker {
    constructor() {
      this.isActive = false;
      this.currentHoverEl = null;
      this.onTargetSelected = null;
      this.onCancel = null;

      // Bound event listeners
      this._boundMouseMove = this._onMouseMove.bind(this);
      this._boundClick = this._onClick.bind(this);
      this._boundKeyDown = this._onKeyDown.bind(this);

      // DOM UI Elements
      this.highlightBox = null;
      this.tooltipBadge = null;
      this.banner = null;
    }

    /**
     * Start target inspection mode
     */
    start({ onSelect, onCancel }) {
      if (this.isActive) this.stop();

      this.isActive = true;
      this.onTargetSelected = onSelect || null;
      this.onCancel = onCancel || null;

      this._createUI();

      window.addEventListener('mousemove', this._boundMouseMove, true);
      window.addEventListener('click', this._boundClick, true);
      window.addEventListener('keydown', this._boundKeyDown, true);
      document.body.classList.add('autotyper-picking-active');
    }

    /**
     * Stop inspection mode and clean up UI
     */
    stop() {
      if (!this.isActive) return;
      this.isActive = false;

      window.removeEventListener('mousemove', this._boundMouseMove, true);
      window.removeEventListener('click', this._boundClick, true);
      window.removeEventListener('keydown', this._boundKeyDown, true);
      document.body.classList.remove('autotyper-picking-active');

      if (this.highlightBox) {
        this.highlightBox.remove();
        this.highlightBox = null;
      }
      if (this.tooltipBadge) {
        this.tooltipBadge.remove();
        this.tooltipBadge = null;
      }
      if (this.banner) {
        this.banner.remove();
        this.banner = null;
      }

      this.currentHoverEl = null;
    }

    _createUI() {
      // 1. Highlight box
      this.highlightBox = document.createElement('div');
      this.highlightBox.className = 'autotyper-picker-highlight';
      document.body.appendChild(this.highlightBox);

      // 2. Tooltip badge
      this.tooltipBadge = document.createElement('div');
      this.tooltipBadge.className = 'autotyper-picker-badge';
      document.body.appendChild(this.tooltipBadge);

      // 3. Top instruction banner
      this.banner = document.createElement('div');
      this.banner.className = 'autotyper-picker-banner';
      this.banner.innerHTML = `
        <div class="autotyper-picker-banner-content">
          <span class="autotyper-picker-icon">🎯</span>
          <span class="autotyper-picker-text">Click on any code editor or input box to begin auto-typing</span>
          <kbd class="autotyper-picker-kbd">ESC to cancel</kbd>
        </div>
      `;
      document.body.appendChild(this.banner);
    }

    _getEditorContainer(el) {
      if (!el || el === document.body || el === document.documentElement) return null;
      // Skip our own UI elements
      if (el.closest && el.closest('.autotyper-picker-highlight, .autotyper-picker-badge, .autotyper-picker-banner, .autotyper-floating-widget')) {
        return null;
      }

      // Check for known editors
      const monaco = el.closest('.monaco-editor');
      if (monaco) return { el: monaco, label: '⚡ LeetCode / Monaco Editor' };

      const cm6 = el.closest('.cm-editor');
      if (cm6) return { el: cm6, label: '📝 CodeMirror 6 Editor' };

      const cm5 = el.closest('.CodeMirror');
      if (cm5) return { el: cm5, label: '📝 CodeMirror Editor' };

      const ace = el.closest('.ace_editor');
      if (ace) return { el: ace, label: '💻 Ace Code Editor' };

      const ce = el.closest('[contenteditable="true"]');
      if (ce) return { el: ce, label: '✏️ ContentEditable Area' };

      if (el instanceof HTMLTextAreaElement) {
        return { el, label: '📄 Text Area' };
      }
      if (el instanceof HTMLInputElement && ['text', 'search', 'email', 'url'].includes(el.type || 'text')) {
        return { el, label: '💬 Text Input' };
      }

      // Check if clicked element has editable children
      const innerEditor = el.querySelector('.monaco-editor, .cm-editor, .CodeMirror, .ace_editor, textarea, [contenteditable="true"]');
      if (innerEditor) {
        return this._getEditorContainer(innerEditor);
      }

      return { el, label: '🎯 Target Element' };
    }

    _onMouseMove(e) {
      if (!this.isActive) return;

      const target = document.elementFromPoint(e.clientX, e.clientY);
      const editorInfo = this._getEditorContainer(target);

      if (!editorInfo || !editorInfo.el) {
        if (this.highlightBox) this.highlightBox.style.display = 'none';
        if (this.tooltipBadge) this.tooltipBadge.style.display = 'none';
        this.currentHoverEl = null;
        return;
      }

      const el = editorInfo.el;
      this.currentHoverEl = el;

      const rect = el.getBoundingClientRect();
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // Position highlight box
      if (this.highlightBox) {
        this.highlightBox.style.display = 'block';
        this.highlightBox.style.top = `${rect.top + scrollY}px`;
        this.highlightBox.style.left = `${rect.left + scrollX}px`;
        this.highlightBox.style.width = `${rect.width}px`;
        this.highlightBox.style.height = `${rect.height}px`;
      }

      // Position badge
      if (this.tooltipBadge) {
        this.tooltipBadge.style.display = 'block';
        this.tooltipBadge.textContent = editorInfo.label;
        const badgeTop = Math.max(10, rect.top + scrollY - 32);
        const badgeLeft = Math.max(10, rect.left + scrollX + 8);
        this.tooltipBadge.style.top = `${badgeTop}px`;
        this.tooltipBadge.style.left = `${badgeLeft}px`;
      }
    }

    _onClick(e) {
      if (!this.isActive) return;

      // Prevent default page navigation / actions
      e.preventDefault();
      e.stopPropagation();

      const selectedEl = this.currentHoverEl || e.target;
      const callback = this.onTargetSelected;

      this.stop();

      if (callback && selectedEl) {
        callback(selectedEl);
      }
    }

    _onKeyDown(e) {
      if (!this.isActive) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        const cancelCb = this.onCancel;
        this.stop();
        if (cancelCb) cancelCb();
      }
    }
  }

  window.AutoTyperTargetPicker = TargetPicker;
})();
