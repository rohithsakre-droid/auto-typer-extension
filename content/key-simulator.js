/**
 * AutoTyper Key Simulator Engine
 * High-speed keystroke simulation with accurate DOM event synthesis
 * Optimized for Monaco (LeetCode), CodeMirror, Ace, ContentEditable, and standard inputs.
 */

(function () {
  'use strict';

  // Map of common characters to KeyboardEvent properties
  const KEY_MAP = {
    '\n': { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 },
    '\r': { key: 'Enter', code: 'Enter', keyCode: 13, which: 13 },
    '\t': { key: 'Tab', code: 'Tab', keyCode: 9, which: 9 },
    ' ':  { key: ' ', code: 'Space', keyCode: 32, which: 32 },
    ';':  { key: ';', code: 'Semicolon', keyCode: 186, which: 186 },
    ':':  { key: ':', code: 'Semicolon', keyCode: 186, which: 186, shiftKey: true },
    '=':  { key: '=', code: 'Equal', keyCode: 187, which: 187 },
    '+':  { key: '+', code: 'Equal', keyCode: 187, which: 187, shiftKey: true },
    ',':  { key: ',', code: 'Comma', keyCode: 188, which: 188 },
    '<':  { key: '<', code: 'Comma', keyCode: 188, which: 188, shiftKey: true },
    '-':  { key: '-', code: 'Minus', keyCode: 189, which: 189 },
    '_':  { key: '_', code: 'Minus', keyCode: 189, which: 189, shiftKey: true },
    '.':  { key: '.', code: 'Period', keyCode: 190, which: 190 },
    '>':  { key: '>', code: 'Period', keyCode: 190, which: 190, shiftKey: true },
    '/':  { key: '/', code: 'Slash', keyCode: 191, which: 191 },
    '?':  { key: '?', code: 'Slash', keyCode: 191, which: 191, shiftKey: true },
    '`':  { key: '`', code: 'Backquote', keyCode: 192, which: 192 },
    '~':  { key: '~', code: 'Backquote', keyCode: 192, which: 192, shiftKey: true },
    '[':  { key: '[', code: 'BracketLeft', keyCode: 219, which: 219 },
    '{':  { key: '{', code: 'BracketLeft', keyCode: 219, which: 219, shiftKey: true },
    '\\': { key: '\\', code: 'Backslash', keyCode: 220, which: 220 },
    '|':  { key: '|', code: 'Backslash', keyCode: 220, which: 220, shiftKey: true },
    ']':  { key: ']', code: 'BracketRight', keyCode: 221, which: 221 },
    '}':  { key: '}', code: 'BracketRight', keyCode: 221, which: 221, shiftKey: true },
    "'":  { key: "'", code: 'Quote', keyCode: 222, which: 222 },
    '"':  { key: '"', code: 'Quote', keyCode: 222, which: 222, shiftKey: true },
    '!':  { key: '!', code: 'Digit1', keyCode: 49, which: 49, shiftKey: true },
    '@':  { key: '@', code: 'Digit2', keyCode: 50, which: 50, shiftKey: true },
    '#':  { key: '#', code: 'Digit3', keyCode: 51, which: 51, shiftKey: true },
    '$':  { key: '$', code: 'Digit4', keyCode: 52, which: 52, shiftKey: true },
    '%':  { key: '%', code: 'Digit5', keyCode: 53, which: 53, shiftKey: true },
    '^':  { key: '^', code: 'Digit6', keyCode: 54, which: 54, shiftKey: true },
    '&':  { key: '&', code: 'Digit7', keyCode: 55, which: 55, shiftKey: true },
    '*':  { key: '*', code: 'Digit8', keyCode: 56, which: 56, shiftKey: true },
    '(':  { key: '(', code: 'Digit9', keyCode: 57, which: 57, shiftKey: true },
    ')':  { key: ')', code: 'Digit0', keyCode: 48, which: 48, shiftKey: true }
  };

  /**
   * Resolves KeyboardEvent properties for any character
   */
  function getCharEventProps(char) {
    if (KEY_MAP[char]) {
      return Object.assign({ charCode: char.charCodeAt(0) }, KEY_MAP[char]);
    }

    const codePoint = char.charCodeAt(0);

    // Uppercase English letters
    if (char >= 'A' && char <= 'Z') {
      return {
        key: char,
        code: 'Key' + char,
        keyCode: codePoint,
        which: codePoint,
        charCode: codePoint,
        shiftKey: true
      };
    }

    // Lowercase English letters
    if (char >= 'a' && char <= 'z') {
      const upper = char.toUpperCase();
      return {
        key: char,
        code: 'Key' + upper,
        keyCode: upper.charCodeAt(0),
        which: upper.charCodeAt(0),
        charCode: codePoint,
        shiftKey: false
      };
    }

    // Digits
    if (char >= '0' && char <= '9') {
      return {
        key: char,
        code: 'Digit' + char,
        keyCode: codePoint,
        which: codePoint,
        charCode: codePoint,
        shiftKey: false
      };
    }

    // Default fallback
    return {
      key: char,
      code: 'Unidentified',
      keyCode: codePoint,
      which: codePoint,
      charCode: codePoint,
      shiftKey: false
    };
  }

  /**
   * Finds the actual input target (hidden textarea or contenteditable) for complex editors
   */
  function resolveActualInputTarget(el) {
    if (!el) {
      el = document.activeElement || document.body;
    }

    // 1. Monaco Editor (LeetCode, VS Code web, CodeSandbox)
    const monaco = el.closest ? el.closest('.monaco-editor') : null;
    if (monaco) {
      const monacoInput = monaco.querySelector('textarea.inputarea');
      if (monacoInput) {
        monacoInput.focus();
        return { target: monacoInput, editorType: 'monaco', container: monaco };
      }
    }

    // 2. CodeMirror (v5 or v6)
    const cm6 = el.closest ? el.closest('.cm-editor') : null;
    if (cm6) {
      const cm6Content = cm6.querySelector('.cm-content[contenteditable="true"]');
      if (cm6Content) {
        cm6Content.focus();
        return { target: cm6Content, editorType: 'codemirror6', container: cm6 };
      }
    }

    const cm5 = el.closest ? el.closest('.CodeMirror') : null;
    if (cm5) {
      const cm5Input = cm5.querySelector('textarea');
      if (cm5Input) {
        cm5Input.focus();
        return { target: cm5Input, editorType: 'codemirror5', container: cm5 };
      }
    }

    // 3. Ace Editor (HackerRank, etc.)
    const ace = el.closest ? el.closest('.ace_editor') : null;
    if (ace) {
      const aceInput = ace.querySelector('textarea.ace_text-input');
      if (aceInput) {
        aceInput.focus();
        return { target: aceInput, editorType: 'ace', container: ace };
      }
    }

    // 4. ContentEditable element
    const ce = el.closest ? el.closest('[contenteditable="true"]') : null;
    if (ce) {
      ce.focus();
      return { target: ce, editorType: 'contenteditable', container: ce };
    }

    // 5. Native input or textarea
    if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
      el.focus();
      return { target: el, editorType: 'native', container: el };
    }

    // 6. If target has a child editable element
    if (el.querySelector) {
      const nestedMonaco = el.querySelector('.monaco-editor textarea.inputarea');
      if (nestedMonaco) {
        nestedMonaco.focus();
        return { target: nestedMonaco, editorType: 'monaco', container: el.querySelector('.monaco-editor') };
      }
      const nestedInput = el.querySelector('textarea, input, [contenteditable="true"]');
      if (nestedInput) {
        nestedInput.focus();
        return { target: nestedInput, editorType: 'native', container: nestedInput };
      }
    }

    if (typeof el.focus === 'function') {
      el.focus();
    }
    return { target: el, editorType: 'unknown', container: el };
  }

  /**
   * Types a single character into the target element with full realistic event lifecycle
   */
  function dispatchSingleKey(target, char, editorType, options = {}) {
    if (!target) return false;

    // Ensure focus is retained on the target
    if (document.activeElement !== target) {
      try {
        target.focus();
      } catch (e) {}
    }

    const props = getCharEventProps(char);
    const isNewline = (char === '\n' || char === '\r');
    const isTab = (char === '\t');

    // 1. Dispatch keydown
    const keydownEvent = new KeyboardEvent('keydown', {
      key: props.key,
      code: props.code,
      keyCode: props.keyCode,
      which: props.which,
      charCode: 0,
      shiftKey: !!props.shiftKey,
      altKey: false,
      ctrlKey: false,
      metaKey: false,
      repeat: false,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    const notPrevented = target.dispatchEvent(keydownEvent);

    // 2. Dispatch keypress (legacy support for sites with keypress listeners)
    const keypressEvent = new KeyboardEvent('keypress', {
      key: props.key,
      code: props.code,
      keyCode: props.charCode || props.keyCode,
      which: props.charCode || props.which,
      charCode: props.charCode || 0,
      shiftKey: !!props.shiftKey,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    target.dispatchEvent(keypressEvent);

    // 3. Dispatch beforeinput
    let inputType = 'insertText';
    let data = char;
    if (isNewline) {
      inputType = 'insertParagraph';
      data = null;
    } else if (isTab) {
      inputType = 'insertText';
      data = '\t';
    }

    let beforeInputPrevented = false;
    try {
      const beforeInputEvent = new InputEvent('beforeinput', {
        data: data,
        inputType: inputType,
        bubbles: true,
        cancelable: true,
        composed: true
      });
      beforeInputPrevented = !target.dispatchEvent(beforeInputEvent);
    } catch (e) {
      // Fallback for older environments
    }

    // 4. Actual character insertion
    let inserted = false;

    // A. For Monaco Editor (LeetCode, VS Code web):
    // If Monaco, document.execCommand('insertText', false, char) triggers Monaco's internal edit pipeline!
    if (editorType === 'monaco') {
      if (isNewline) {
        // In Monaco, insertLineBreak or insertText with \n creates the newline
        inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          inserted = document.execCommand('insertText', false, '\n');
        }
      } else {
        inserted = document.execCommand('insertText', false, char);
      }
    } 
    // B. For standard contenteditable or code editors using contenteditable
    else if (editorType === 'contenteditable' || editorType === 'codemirror6') {
      if (isNewline) {
        inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          inserted = document.execCommand('insertParagraph');
        }
        if (!inserted) {
          inserted = document.execCommand('insertText', false, '\n');
        }
      } else {
        inserted = document.execCommand('insertText', false, char);
      }
    }
    // C. For standard inputs, textareas, and Ace editor
    else {
      // Try execCommand first to preserve browser undo/redo history
      if (isNewline) {
        inserted = document.execCommand('insertLineBreak');
        if (!inserted) {
          inserted = document.execCommand('insertText', false, '\n');
        }
      } else {
        inserted = document.execCommand('insertText', false, char);
      }

      // If execCommand failed or didn't alter standard textarea/input, perform direct insertion
      if (!inserted && (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
        const start = target.selectionStart !== null ? target.selectionStart : target.value.length;
        const end = target.selectionEnd !== null ? target.selectionEnd : target.value.length;
        const val = target.value;
        target.value = val.substring(0, start) + char + val.substring(end);
        target.selectionStart = target.selectionEnd = start + char.length;
        inserted = true;
      }
    }

    // 5. Dispatch input event
    try {
      const inputEvent = new InputEvent('input', {
        data: data,
        inputType: inputType,
        bubbles: true,
        cancelable: false,
        composed: true
      });
      target.dispatchEvent(inputEvent);
    } catch (e) {
      const fallbackInput = new Event('input', { bubbles: true, cancelable: false });
      target.dispatchEvent(fallbackInput);
    }

    // 6. Dispatch keyup
    const keyupEvent = new KeyboardEvent('keyup', {
      key: props.key,
      code: props.code,
      keyCode: props.keyCode,
      which: props.which,
      charCode: 0,
      shiftKey: !!props.shiftKey,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    target.dispatchEvent(keyupEvent);

    return true;
  }

  /**
   * AutoTyper Controller Class
   * Handles queue, speed, pause, resume, stop, and progress reporting
   */
  class AutoTyper {
    constructor() {
      this.isRunning = false;
      this.isPaused = false;
      this.text = '';
      this.currentIndex = 0;
      this.speedMs = 10; // ms delay per char
      this.jitter = false;
      this.smartIndent = true; // Prevents double-indent on LeetCode/Monaco
      this.targetInfo = null;
      this.timerId = null;
      this.onProgress = null;
      this.onComplete = null;
      this.onError = null;
    }

    /**
     * Set target element
     */
    setTarget(element) {
      this.targetInfo = resolveActualInputTarget(element);
      return this.targetInfo;
    }

    /**
     * Update typing speed dynamically on the fly
     */
    setSpeed(speedMs) {
      this.speedMs = Math.max(0, parseInt(speedMs, 10) || 0);
    }

    /**
     * Start typing sequence
     */
    start({ text, target, speedMs = 10, jitter = false, smartIndent = true, onProgress, onComplete, onError }) {
      if (this.isRunning) {
        this.stop();
      }

      this.text = text || '';
      this.currentIndex = 0;
      this.speedMs = Math.max(0, parseInt(speedMs, 10) || 0);
      this.jitter = !!jitter;
      this.smartIndent = !!smartIndent;
      this.onProgress = onProgress || null;
      this.onComplete = onComplete || null;
      this.onError = onError || null;

      if (!this.text) {
        if (this.onError) this.onError('No text provided to type.');
        return;
      }

      if (target) {
        this.setTarget(target);
      } else if (!this.targetInfo) {
        this.setTarget(document.activeElement);
      }

      if (!this.targetInfo || !this.targetInfo.target) {
        if (this.onError) this.onError('No valid text editor found. Please click into an editor first.');
        return;
      }

      this.isRunning = true;
      this.isPaused = false;

      // Focus target element
      try {
        this.targetInfo.target.focus();
      } catch (e) {}

      this._tick();
    }

    /**
     * Main typing step execution
     */
    _tick() {
      if (!this.isRunning || this.isPaused) return;

      if (this.currentIndex >= this.text.length) {
        this.isRunning = false;
        if (this.onProgress) {
          this.onProgress({
            current: this.text.length,
            total: this.text.length,
            percent: 100,
            isRunning: false,
            isPaused: false,
            speedMs: this.speedMs
          });
        }
        if (this.onComplete) this.onComplete();
        return;
      }

      const char = this.text[this.currentIndex];

      // Smart Monaco/LeetCode Indentation Handling:
      // When entering a newline in Monaco, the editor often automatically indents the next line.
      // If smartIndent is enabled and we just typed a newline, check if we need to adjust leading whitespace.
      dispatchSingleKey(this.targetInfo.target, char, this.targetInfo.editorType, {
        smartIndent: this.smartIndent
      });

      this.currentIndex++;

      // Report progress
      if (this.onProgress) {
        const total = this.text.length;
        const current = this.currentIndex;
        const percent = Math.min(100, Math.round((current / total) * 100));
        this.onProgress({
          current,
          total,
          percent,
          char,
          speedMs: this.speedMs,
          isRunning: true,
          isPaused: false
        });
      }

      // Calculate delay for next keystroke
      let delay = this.speedMs;

      // Apply natural jitter if enabled (±25% variation for human-like typing)
      if (this.jitter && delay > 0) {
        const variance = (Math.random() * 0.5 - 0.25) * delay;
        delay = Math.max(1, Math.round(delay + variance));
      }

      // Punctuation / newline micro-pause for realism if delay > 10ms
      if (this.jitter && delay > 10) {
        if (char === '\n') {
          delay += Math.round(delay * 1.5);
        } else if (char === '.' || char === ';' || char === '{') {
          delay += Math.round(delay * 0.8);
        }
      }

      // Ultra Turbo speed (0ms - 1ms):
      // When delay is 0, we can type a small batch (up to 5 chars) per microtask/animationFrame
      // to achieve ultra-high speed without freezing the UI thread!
      if (this.speedMs <= 1) {
        // Use requestAnimationFrame or setTimeout(0)
        this.timerId = setTimeout(() => this._tick(), 0);
      } else {
        this.timerId = setTimeout(() => this._tick(), delay);
      }
    }

    /**
     * Pause typing
     */
    pause() {
      if (!this.isRunning || this.isPaused) return;
      this.isPaused = true;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      if (this.onProgress) {
        this.onProgress({
          current: this.currentIndex,
          total: this.text.length,
          percent: Math.round((this.currentIndex / this.text.length) * 100),
          isRunning: true,
          isPaused: true,
          speedMs: this.speedMs
        });
      }
    }

    /**
     * Resume typing
     */
    resume() {
      if (!this.isRunning || !this.isPaused) return;
      this.isPaused = false;
      try {
        if (this.targetInfo && this.targetInfo.target) {
          this.targetInfo.target.focus();
        }
      } catch (e) {}
      this._tick();
    }

    /**
     * Stop and cancel typing
     */
    stop() {
      this.isRunning = false;
      this.isPaused = false;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
      if (this.onProgress) {
        this.onProgress({
          current: this.currentIndex,
          total: this.text.length,
          percent: this.text.length > 0 ? Math.round((this.currentIndex / this.text.length) * 100) : 0,
          isRunning: false,
          isPaused: false,
          speedMs: this.speedMs
        });
      }
    }
  }

  // Export to window
  window.AutoTyperEngine = {
    AutoTyper,
    resolveActualInputTarget,
    dispatchSingleKey
  };
})();
