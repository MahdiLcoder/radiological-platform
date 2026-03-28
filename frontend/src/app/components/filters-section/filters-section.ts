import { Component, input, output, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

export interface SelectFilterConfig {
  key: string;
  icon?: string;
  placeholder?: string; // First empty option
  options: { label: string; value: string }[] | string[];
}

export interface TabConfig {
  key: string;
  label: string;
  icon?: string;
}

export interface ActionButtonConfig {
  label: string;
  icon?: string;
  actionKey: string;
}

@Component({
  selector: 'app-filters-section',
  imports: [FormsModule, NgClass],
  templateUrl: './filters-section.html',
  styleUrl: './filters-section.css'
})
export class FiltersSection {
  // Search
  readonly showSearch = input<boolean>(true);
  readonly searchPlaceholder = input<string>('Search...');
  readonly searchIcon = input<string>('search');
  readonly searchValue = input<string>('');
  readonly searchValueChange = output<string>();

  // Selects
  readonly selectFilters = input<SelectFilterConfig[]>([]);
  readonly selectValues = input<Record<string, string>>({});
  
  // Tabs
  readonly tabs = input<TabConfig[]>([]);
  readonly activeTab = input<string>('');
  readonly activeTabChange = output<string>();

  // Stats
  readonly statsHtml = input<string>(''); // If you want to embed custom HTML
  
  // Actions
  readonly showReset = input<boolean>(true);
  readonly resetTitle = input<string>('Reset Console');
  readonly actionButtons = input<ActionButtonConfig[]>([]);
  
  // Custom outputs
  readonly filterChange = output<{ key: string; value: string }>(); 
  readonly actionClicked = output<string>();
  readonly resetClicked = output<void>();

  onSearchChange(val: string) {
    this.searchValueChange.emit(val);
    this.filterChange.emit({ key: 'search', value: val });
  }

  onSelectChange(key: string, val: string) {
    this.filterChange.emit({ key, value: val });
  }

  onTabClick(key: string) {
    this.activeTabChange.emit(key);
    this.filterChange.emit({ key: 'tab', value: key });
  }

  getSelectValue(key: string): string {
    return this.selectValues()[key] || '';
  }

  getOptionLabel(opt: string | { label: string; value: string }): string {
    return typeof opt === 'string' ? opt : opt.label;
  }

  getOptionValue(opt: string | { label: string; value: string }): string {
    return typeof opt === 'string' ? opt : opt.value;
  }
}
