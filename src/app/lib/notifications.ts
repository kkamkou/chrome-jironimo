export interface NotificationPort {
  create(id: string, options: Record<string, unknown>, callback: (id: string) => void): void;
  update(id: string, options: Record<string, unknown>, callback: (updated: boolean) => void): void;
  clear(id: string, callback: (cleared: boolean) => void): void;
}

export type NotificationCallback = (err: boolean | null, id: string) => void;

export interface NotificationChannel {
  createOrUpdate(id: string, params: Record<string, unknown>, cb?: NotificationCallback): void;
  clear(id: string, cb?: NotificationCallback): void;
  create(id: string, params: Record<string, unknown>, cb?: NotificationCallback): void;
  update(id: string, params: Record<string, unknown>, cb?: NotificationCallback): void;
}

/**
 * Browser notification lifecycle coordinator tracking active notification identifiers.
 */
export class Notifications implements NotificationChannel {
  private readonly port: NotificationPort;
  private readonly icon: string;
  private readonly active: Record<string, boolean>;

  constructor(
    port: NotificationPort = typeof chrome !== 'undefined' && chrome.notifications
      ? (chrome.notifications as unknown as NotificationPort)
      : {
          create: (id, _opts, cb) => cb(id),
          update: (_id, _opts, cb) => cb(true),
          clear: (_id, cb) => cb(true)
        },
    icon: string = typeof chrome !== 'undefined' && chrome.runtime?.getURL
      ? chrome.runtime.getURL('icons/app-128.png')
      : 'icons/app-128.png'
  ) {
    this.port = port;
    this.icon = icon;
    this.active = {};
    Object.freeze(this);
  }

  createOrUpdate(
    id: string,
    params: Record<string, unknown>,
    cb: NotificationCallback = () => undefined
  ): void {
    if (this.active[id]) {
      this.update(id, params, cb);
      return;
    }
    this.create(id, params, cb);
  }

  clear(id: string, cb?: NotificationCallback): void {
    this.port.clear(id, wasCleared => {
      const err = wasCleared ? null : true;
      if (!err) {
        delete this.active[id];
      }
      if (cb) {
        cb(err, id);
      }
    });
  }

  create(
    id: string,
    params: Record<string, unknown>,
    cb: NotificationCallback = () => undefined
  ): void {
    const options = { type: 'basic', iconUrl: this.icon, ...params };
    this.port.create(id, options, createdId => {
      const err = createdId ? null : true;
      if (!err) {
        this.active[id] = true;
      }
      cb(err, createdId);
    });
  }

  update(
    id: string,
    params: Record<string, unknown>,
    cb: NotificationCallback = () => undefined
  ): void {
    this.port.update(id, params, wasUpdated => {
      cb(wasUpdated ? null : true, id);
    });
  }
}
