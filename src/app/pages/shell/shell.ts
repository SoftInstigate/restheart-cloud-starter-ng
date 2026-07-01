import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-shell',
  imports: [],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }
}
