import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BoardNavigation } from '../../../../src/app/controllers/board/services/board-navigation.ts';
import { Settings } from '../../../../src/app/lib/settings.ts';

test('BoardNavigation detects popup window state via chrome windows API', { timeout: 1000 }, async () => {
  assert.strictEqual(
    await new Promise<boolean>(resolve => {
      (globalThis as any).chrome = {
        windows: {
          getCurrent: (_opts: unknown, cb: (win: { type: string }) => void) => cb({ type: 'popup' })
        }
      };
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      new BoardNavigation(settings).detached(flag => resolve(flag));
    }),
    true,
    'BoardNavigation cannot detect detached popup window state'
  );
});

test('BoardNavigation creates centered popup window when detaching from extension popup', { timeout: 1000 }, async () => {
  assert.deepStrictEqual(
    await new Promise<{ url: string; type: string; closed: boolean }>(resolve => {
      let closed = false;
      (globalThis as any).screen = { availWidth: 2048, availHeight: 1536 };
      (globalThis as any).window = {
        close: () => {
          closed = true;
        }
      };
      (globalThis as any).chrome = {
        windows: {
          create: (opts: { url: string; type: string }, cb: () => void) => {
            cb();
            resolve({ url: opts.url, type: opts.type, closed });
          }
        }
      };
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      new BoardNavigation(settings).detach(false);
    }),
    { url: 'views/default.html', type: 'popup', closed: true },
    'BoardNavigation cannot create detached popup window and close current popup'
  );
});

test('BoardNavigation opens settings feedback and background issue tabs', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    (() => {
      const opened: Array<{ active: boolean; url: string }> = [];
      (globalThis as any).chrome = {
        tabs: {
          create: (opts: { active: boolean; url: string }) => opened.push(opts)
        }
      };
      const settings = new Settings({ version: '600' }, key => key, () => undefined);
      const nav = new BoardNavigation(settings);
      nav.settings();
      nav.feedback();
      nav.issue(
        { id: 'default', label: 'Default', enabled: true, timeout: 5, type: 'basic', url: 'https://jira.example' },
        { id: '9', key: 'JIR-9', fields: { status: {}, issuetype: {} } }
      );
      return opened;
    })(),
    [
      { active: true, url: 'views/default.html#/settings/general' },
      {
        active: true,
        url: 'https://docs.google.com/forms/d/17O-B8lTvqvsLIgsLrUJjOJ_1arlDFkPYZ4UAuFv7zDo/viewform?usp=send_form'
      },
      { active: false, url: 'https://jira.example/browse/JIR-9' }
    ],
    'BoardNavigation cannot open settings feedback and issue browser tabs'
  );
});
