import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/authService';

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

  constructor(private authService: AuthService, private router: Router){}
  
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