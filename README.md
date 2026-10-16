# ⚡ AutoTyper Pro - High-Speed Keystroke Simulator

A modern, high-performance Chrome Extension (Manifest V3) designed to **mimic authentic human typing at configurable ultra-high speeds** on any text editor or code section in Chrome, including **LeetCode (Monaco Editor)**, **CodeMirror**, **Ace Editor**, standard `<textarea>`, and rich `contenteditable` inputs.

---

## ✨ Features

- **🎯 Authentic Keystroke Simulation (NOT Normal Paste)**:
  - Dispatches full DOM keyboard events per character: `keydown` ➔ `keypress` ➔ `beforeinput` ➔ text insertion ➔ `input` ➔ `keyup`.
  - Accurately generates key codes, scan codes, `shiftKey`, and character codes.
  - Bypasses paste restrictions and mimics genuine keystroke activity.
- **⚡ Ultra-High Configurable Speed**:
  - **⚡ Ultra Turbo (1 ms/char)**: Virtually instantaneous typing simulation (~30,000 WPM).
  - **🚀 Super Fast (8 ms/char)**: ~4,000 WPM.
  - **🏎️ Fast (25 ms/char)**: ~1,200 WPM.
  - **🏃 Natural Fast (60 ms/char)**: ~500 WPM.
  - **🧑‍💻 Human Typist (110 ms/char)**: ~200 WPM.
  - **Fine-Grained Slider**: Adjust from `0 ms` (instant burst) up to `200 ms` with real-time speed metrics.
  - **Live Dynamic Speed Control**: Adjust the speed *while* it is actively typing without restarting!
- **💻 Tailored for LeetCode & Code Editors**:
  - Automatically identifies Monaco Editor's hidden input areas (`textarea.inputarea`).
  - **Smart Indentation Fix**: Automatically prevents Monaco / LeetCode from double-indenting or creating a staircase effect on newlines.
- **🎨 Modern Glassmorphic Dark UI**:
  - Sleek developer interface inspired by modern IDEs.
  - Character, word, and line count indicators.
  - Quick **"📋 Paste from Clipboard"**, **"🧹 Clear"**, and **"✨ Demo LeetCode Code"** buttons.
  - Textarea supports the `Tab` key (inserts 4 spaces instead of blurring).
  - Automatic persistence with `chrome.storage.local`.
- **🎯 Visual Target Inspector**:
  - Click **"Pick Target & Start"** ➔ hover over any editor on LeetCode or the webpage ➔ glowing neon highlight identifies the editor type ➔ click to immediately start typing!
- **📌 On-Page Floating Widget & Live HUD**:
  - Live progress bar showing percentage and typed characters.
  - Pause (⏸️) and Resume (▶️) controls.
  - Draggable anywhere on your screen.
  - Full on-page widget mode so you never have to reopen the popup.
- **📖 Chrome Side Panel Support**:
  - Pin AutoTyper directly to Chrome's Side Panel for side-by-side editing next to LeetCode!
- **🛑 Emergency Stop Safety**:
  - Press `ESC` anywhere on the webpage to instantly stop typing.
  - Keyboard shortcut: `Alt+Shift+S` (Emergency Stop), `Alt+Shift+W` (Toggle Floating Widget).

---

## 🚀 How to Install in Google Chrome

1. Open Google Chrome.
2. Navigate to `chrome://extensions/` in your address bar.
3. In the top right corner, toggle **Developer mode** to **ON**.
4. Click the **"Load unpacked"** button in the top left.
5. Select this directory:
   ```
   /Users/rohithsakre/Desktop/auto-typer-extension
   ```
6. The **AutoTyper Pro** extension icon (`⚡`) will appear in your Chrome extensions list and toolbar!
7. *(Recommended)* Pin the extension by clicking the puzzle icon in Chrome's toolbar and clicking the pin icon next to **AutoTyper Pro**.

---

## 🛠️ How to Use

### Method 1: Visual Target Selector (Recommended for LeetCode)
1. Navigate to any LeetCode problem (e.g. [leetcode.com/problems/two-sum/](https://leetcode.com/problems/two-sum/)).
2. Click the **AutoTyper Pro** icon in your Chrome toolbar.
3. Paste your code into the text section (or click **"✨ Demo"**).
4. Choose your desired speed (e.g., **⚡ Turbo 1ms** or **🚀 Super 8ms**).
5. Click **"🎯 Pick Target & Start Typing"**.
6. The popup will close and the webpage will enter selection mode:
   - Move your mouse over LeetCode's code editor.
   - It will glow with a blue outline labeled `⚡ LeetCode / Monaco Editor`.
   - Click the editor to begin auto-typing!
7. Watch the floating HUD track typing progress in real time.

### Method 2: Side Panel (Side-by-Side Mode)
1. Open LeetCode in your browser.
2. Click the Side Panel icon in the AutoTyper popup, or open Chrome's Side Panel and select **AutoTyper Pro**.
3. Keep the side panel open on the right while interacting with LeetCode on the left.
4. Click into LeetCode's editor, then click **"⚡ Type into Active"** in the side panel.

### Method 3: 3-Second Countdown
1. In the popup, paste your code and choose your speed.
2. Click **"⏱️ 3s Countdown"**.
3. Click into your target code editor during the 3-second countdown. Typing begins automatically!

---

## 🧪 Testing with the Built-in Arena

You can immediately test and verify the extension without opening external websites:
1. Double click or open `test-editor.html` in Chrome:
   ```
   file:///Users/rohithsakre/Desktop/auto-typer-extension/test-editor.html
   ```
2. The page includes:
   - A simulated Monaco Editor (LeetCode DOM structure)
   - Standard `<textarea>` code editor
   - ContentEditable rich text area
   - **Real-Time Keystroke Inspector**: Displays live event logs (`keydown`, `code`, `which`, typing rate in chars/sec) proving authentic event synthesis rather than simple clipboard paste!

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `ESC` | Instant Emergency Stop while typing |
| `Alt + Shift + S` | Global Emergency Stop hotkey |
| `Alt + Shift + W` | Toggle On-Page Floating Widget |
| `Tab` (in popup) | Inserts 4 indentation spaces |
