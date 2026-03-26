import { Component, input } from '@angular/core';

export interface FilterField {
  label: string;
  type: 'select' | 'text';
  icon?: string;
  placeholder?: string;
  options?: string[];
}

@Component({
  selector: 'app-filters-section',
  imports: [],
  templateUrl: './filters-section.html',
  styleUrl: './filters-section.css'
})
export class FiltersSection {
  readonly filters = input<FilterField[]>([]);
  readonly buttonText = input('Apply Filters');
  readonly buttonIcon = input('filter_list');
}
