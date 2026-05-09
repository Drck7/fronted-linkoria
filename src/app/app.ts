import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private authService = inject(AuthService);

  protected readonly title = signal('fronted-linkoria');

  constructor() {
    this.authService.checkStatus().subscribe();
  }
}
