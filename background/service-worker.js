/**
 * AutoTyper Pro - Background Service Worker
 * Handles extension lifecycle, keyboard shortcuts, context menus, and side panel routing
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('⚡ AutoTyper Pro Extension Installed Successfully');

  // Initialize default options in storage if not set
  chrome.storage.local.get(['savedSpeed', 'savedSmartIndent', 'savedJitter'], (data) => {
    if (data.savedSpeed === undefined) {
      chrome.storage.local.set({ savedSpeed: 8 });
    }
    if (data.savedSmartIndent === undefined) {
      chrome.storage.local.set({ savedSmartIndent: true });
    }
    if (data.savedJitter === undefined) {
      chrome.storage.local.set({ savedJitter: false });
    }
  });

  // Create context menus for quick access
  try {
    chrome.contextMenus.create({
      id: 'autotyper-pick',
      title: '🎯 AutoTyper: Select Editor & Type',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autotyper-widget',
      title: '📌 AutoTyper: Open Floating Widget',
      contexts: ['all']
    });

    chrome.contextMenus.create({
      id: 'autotyper-stop',
      title: '⏹️ AutoTyper: Emergency Stop',
      contexts: ['all']
    });
  } catch (e) {
    console.warn('Context menu creation warning:', e);
  }
});

// Handle Context Menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'autotyper-pick') {
    chrome.storage.local.get(['savedText', 'savedSpeed', 'savedSmartIndent', 'savedJitter'], (data) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'START_PICKER',
        text: data.savedText || '',
        speedMs: data.savedSpeed || 8,
        smartIndent: data.savedSmartIndent !== false,
        jitter: !!data.savedJitter
      }).catch(() => {});
    });
  } else if (info.menuItemId === 'autotyper-widget') {
    chrome.storage.local.get(['savedText', 'savedSpeed'], (data) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'SHOW_FLOATING_WIDGET',
        text: data.savedText || '',
        speedMs: data.savedSpeed || 8
      }).catch(() => {});
    });
  } else if (info.menuItemId === 'autotyper-stop') {
    chrome.tabs.sendMessage(tab.id, { action: 'STOP' }).catch(() => {});
  }
});

// Handle global keyboard shortcuts defined in manifest
chrome.commands.onCommand.addListener(async (command) => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs || !tabs[0] || !tabs[0].id) return;
  const tabId = tabs[0].id;

  if (command === 'emergency-stop') {
    chrome.tabs.sendMessage(tabId, { action: 'STOP' }).catch(() => {});
  } else if (command === 'toggle-floating-widget') {
    chrome.storage.local.get(['savedText', 'savedSpeed'], (data) => {
      chrome.tabs.sendMessage(tabId, {
        action: 'SHOW_FLOATING_WIDGET',
        text: data.savedText || '',
        speedMs: data.savedSpeed || 8
      }).catch(() => {});
    });
  }
});
