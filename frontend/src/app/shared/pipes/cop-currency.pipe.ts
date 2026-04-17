import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'copCurrency',
})
export class CopCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '$0';
    const formatted = value
      .toFixed(0)
      .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `$${formatted}`;
  }
}
