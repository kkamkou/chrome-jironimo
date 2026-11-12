import _ from 'lodash';
import type { JiraPriority, PriorityColor } from './settings-types.ts';

export interface PriorityPalette {
  sample(items: JiraPriority[]): Record<string, PriorityColor>;
}

/**
 * Maps JIRA priority definitions onto Metro UI color tones by hex distance and semantic name.
 */
export class MetroPalette implements PriorityPalette {
  private readonly fallback: Record<number | string, PriorityColor>;
  private readonly tones: Record<string, [number, number, number]>;

  constructor(
    fallback: Record<number | string, PriorityColor>,
    tones: Record<string, [number, number, number]> = {
      red: [229, 20, 0],
      lightRed: [255, 45, 25],
      crimson: [162, 0, 37],
      orange: [250, 104, 0],
      amber: [240, 163, 10],
      yellow: [227, 200, 0],
      lime: [164, 196, 0],
      lightOlive: [120, 170, 28],
      green: [96, 169, 23],
      emerald: [0, 138, 0],
      teal: [0, 171, 169],
      cyan: [27, 161, 226],
      lightBlue: [67, 144, 223],
      blue: [0, 175, 240],
      cobalt: [0, 80, 239],
      darkCobalt: [0, 53, 106],
      darkBlue: [22, 73, 154],
      indigo: [106, 0, 255],
      violet: [170, 0, 255],
      pink: [220, 79, 173],
      magenta: [216, 0, 115],
      steel: [100, 118, 135],
      mauve: [118, 96, 138],
      taupe: [135, 121, 78],
      brown: [130, 90, 44],
      olive: [109, 135, 100],
      gray: [85, 85, 85],
      dark: [51, 51, 51],
      darker: [34, 34, 34]
    }
  ) {
    this.fallback = fallback;
    this.tones = tones;
    Object.freeze(this);
  }

  sample(items: JiraPriority[]): Record<string, PriorityColor> {
    const counts = _.countBy(items, item => String(item.statusColor ?? '').trim().toLowerCase());
    return _.fromPairs(
      items.map((item, idx) => {
        const rawColor = String(item.statusColor ?? '').trim().toLowerCase();
        const rgb = this.parseHex(rawColor);
        const tone =
          (rgb && counts[rawColor] === 1 ? this.closestMetro(rgb) : null) ??
          this.semanticMetro(String(item.name ?? '')) ??
          (rgb ? this.closestMetro(rgb) : null) ??
          this.fallback[idx + 1]?.bg ??
          'gray';
        return [
          String(item.id),
          {
            fg: tone === 'yellow' ? 'black' : 'white',
            bg: tone,
            bd: 'white',
            ot: tone,
            label: item.name,
            rank: idx + 1
          }
        ];
      })
    );
  }

  private parseHex(hex: string): [number, number, number] | null {
    const clean = hex.replace(/^#/, '');
    const full =
      clean.length === 3
        ? clean
            .split('')
            .map(ch => ch + ch)
            .join('')
        : clean;
    if (!/^[0-9a-f]{6}$/i.test(full)) {
      return null;
    }
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16)
    ];
  }

  private closestMetro([r, g, b]: [number, number, number]): string {
    return (
      _.minBy(Object.keys(this.tones), key => {
        const [mr, mg, mb] = this.tones[key];
        const rmean = (r + mr) / 2;
        const dr = r - mr;
        const dg = g - mg;
        const db = b - mb;
        return (2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db;
      }) ?? 'gray'
    );
  }

  private semanticMetro(name: string): string | null {
    const lower = name.toLowerCase();
    if (/blocker|highest|critical|urgent|emergency|\bp[01]\b|\bsev[01]\b/.test(lower)) {
      return 'red';
    }
    if (/\bhigh\b|major|important|\bp2\b|\bsev2\b/.test(lower)) {
      return 'orange';
    }
    if (/medium|normal|standard|average|\bp3\b|\bsev3\b/.test(lower)) {
      return 'lightOlive';
    }
    if (/\blow\b|minor|secondary|\bp4\b|\bsev4\b/.test(lower)) {
      return 'gray';
    }
    if (/lowest|trivial|cosmetic|minimal|\bp5\b|\bsev5\b/.test(lower)) {
      return 'lightBlue';
    }
    return null;
  }
}
