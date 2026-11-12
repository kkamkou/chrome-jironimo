import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MetroPalette } from '../../../../src/app/lib/settings/helpers/metro-palette.ts';

test('MetroPalette parses shorthand hex assigns black foreground on yellow and maps lowest semantic priority', { timeout: 1000 }, () => {
  assert.deepStrictEqual(
    new MetroPalette({
      3: { fg: 'white', bg: 'steel', bd: 'white', ot: 'steel' }
    }).sample([
      { id: '1', name: 'Warn', statusColor: '#e30' },
      { id: '2', name: 'Sun', statusColor: '#ec0' },
      { id: '3', name: 'Trivial', statusColor: 'invalid' },
      { id: '4', name: 'Custom', statusColor: 'not-hex' }
    ]),
    {
      1: { fg: 'white', bg: 'lightRed', bd: 'white', ot: 'lightRed', label: 'Warn', rank: 1 },
      2: { fg: 'black', bg: 'yellow', bd: 'white', ot: 'yellow', label: 'Sun', rank: 2 },
      3: { fg: 'white', bg: 'lightBlue', bd: 'white', ot: 'lightBlue', label: 'Trivial', rank: 3 },
      4: { fg: 'white', bg: 'gray', bd: 'white', ot: 'gray', label: 'Custom', rank: 4 }
    },
    'MetroPalette cannot map shorthand hex yellow foreground and semantic lowest priority'
  );
});
