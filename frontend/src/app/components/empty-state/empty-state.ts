import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink, CommonModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  icon = input<string>('info');
  title = input<string>('No results found');
  description = input<string>('Try adjusting your search or filters.');
  actionText = input<string>('');
  actionLink = input<string>('');
  actionIcon = input<string>('add');
  actionClick = output<void>();

  onActionClick() {
    this.actionClick.emit();
  }
}
