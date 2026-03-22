import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-welcome-section',
  imports: [RouterLink],
  templateUrl: './welcome-section.html',
  styleUrl: './welcome-section.css',
})
export class WelcomeSection {
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() buttonText: string = '';
  @Input() buttonIcon: string = '';
  @Input() buttonLink: string = '';
}
