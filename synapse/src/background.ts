import browser from 'webextension-polyfill';
import type { Browser } from 'webextension-polyfill';

declare const chrome: Browser
const api: any = typeof browser !== 'undefined' ? browser : chrome;

// background.js - open a persistent popup window when the action is clicked
function openWindow() {
  try {
    const url = api.runtime.getURL('popup.html');
    // Firefox: browser.windows.create; Chrome compatibility handled as well
    if (api.windows && api.windows.create) {
      api.windows.create({ url, type: 'popup', width: 1200, height: 800 });
    } else if (api.runtime && api.runtime.openOptionsPage) {
      // fallback
      api.runtime.openOptionsPage();
    }
  } catch (e) {
    console.error('Failed to open window', e);  
  }
}

if (api.action && api.action.onClicked) {
  api.action.onClicked.addListener(openWindow);
} else if (api.browserAction && api.browserAction.onClicked) {
  api.browserAction.onClicked.addListener(openWindow);
}

// keep worker alive with a simple alarm (no-op) to improve responsiveness in some browsers
if (api.alarms) {
  api.alarms.create('noop', { periodInMinutes: 59 });
  api.alarms.onAlarm.addListener(() => {});
}
