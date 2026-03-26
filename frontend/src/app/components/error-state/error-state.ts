import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  standalone: true,
  templateUrl: './error-state.html',
  styleUrl: './error-state.css',
})
export class ErrorStateComponent {
  message = input<string>('An error occurred');
  actionText = input<string>('Try again');
  retry = output<void>();

  onRetry() {
    this.retry.emit();
  }
}
