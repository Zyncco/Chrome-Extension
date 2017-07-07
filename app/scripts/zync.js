// Polyfill the Web Extensions API for Chrome and Opera
import browser from 'webextension-polyfill';

export default class Zync {
  constructor() {
    this.active = false;

    // Check storage to see whether or not Zync should be active
    browser.storage.local.get('active')
      .then((result) => {
        this.active = result.active;
      });
  }

  isActive() {
    return this.active;
  }

  setActive(active) {
    // Store value in browser storage for persistence
    browser.storage.local.set({ active });

    this.active = active;
  }
}
