import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-table',
  templateUrl: './skeleton-table.component.html',
  styleUrls: ['./skeleton-table.component.css'],
})
export class SkeletonTableComponent {
  @Input() rows = 6;
  @Input() columns = 4;

  get rowsArray(): number[] {
    return Array(this.rows).fill(0);
  }

  get columnsArray(): number[] {
    return Array(this.columns).fill(0);
  }
}
