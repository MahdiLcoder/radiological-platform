import { Component, Input } from '@angular/core';

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
  @Input() filters: FilterField[] = [];
  @Input() buttonText: string = 'Apply Filters';
  @Input() buttonIcon: string = 'filter_list';
}
