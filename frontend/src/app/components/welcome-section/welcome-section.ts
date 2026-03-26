import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome-section',
  imports: [RouterLink],
  templateUrl: './welcome-section.html',
  styleUrl: './welcome-section.css',
})
export class WelcomeSection {
  readonly title = input('');
  readonly subtitle = input('');
  readonly buttonText = input('');
  readonly buttonIcon = input('');
  readonly buttonLink = input('');
}
