export interface HostPermission {
  request(origins: string[]): Promise<void>;
}

/**
 * Requests optional Chrome host origin permissions for configured JIRA servers.
 */
export class OriginAccess implements HostPermission {
  constructor() {
    Object.freeze(this);
  }

  request(origins: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.permissions) {
        resolve();
        return;
      }
      chrome.permissions.request({ origins }, flag => (flag ? resolve() : reject()));
    });
  }
}
