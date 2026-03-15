import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  showPassword = false;
  userName = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: Auth, private router: Router){}
  
  onLogin(): void {
    this.error = '';
    this.loading = true;
    this.authService.login(this.userName, this.password).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.error = 'Login failed. Please check your credentials.';
        this.loading = false;
      }
    });
  }
 
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}