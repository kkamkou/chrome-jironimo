import { Component, Input } from '@angular/core';

/**
 * Horizontal progress bar displaying issue completion percentage on a tile.
 */
@Component({
  selector: 'tile-progress',
  standalone: true,
  host: { style: 'display: contents' },
  templateUrl: '../../../views/tile/progress.html'
})
export class TileProgressComponent {
  @Input() percent: number | string = 0;
  @Input() colorBg = '';

  clamped(): number {
    const parsed = parseInt(String(this.percent), 10) || 0;
    return Math.max(0, Math.min(100, parsed));
  }
}
