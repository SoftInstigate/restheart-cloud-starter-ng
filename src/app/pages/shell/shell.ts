import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import { justSignedUp as justSignedUpFlag } from '../../just-signed-up';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);
  protected readonly auth = inject(RhAuthService);

  protected readonly justVerified = signal(justSignedUpFlag());
  protected readonly menuOpen = signal(false);

  /** True while the router is resolving a route — drives the top progress bar.
   *  Lazy-loaded routes fetch a chunk, so without this the app looks frozen. */
  protected readonly navigating = signal(false);

  constructor() {
    justSignedUpFlag.set(false);

    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.navigating.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigating.set(false);
      }
    });
  }

  protected initials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const first = user.profile?.name?.charAt(0) ?? '';
    const last = user.profile?.surname?.charAt(0) ?? '';
    const fallback = user._id?.charAt(0) ?? '?';
    return (first + last || fallback).toUpperCase();
  }

  protected displayName(): string {
    const user = this.auth.user();
    if (!user) return '';
    const fn = user.profile?.name;
    const ln = user.profile?.surname;
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
    return user._id;
  }

  /** The account's email — RESTHeart Cloud uses it as the user id. */
  protected email(): string {
    return this.auth.user()?._id ?? '';
  }

  protected activeTeamName(): string {
    const teams = this.auth.teams();
    const active = teams.find(t => t.active);
    return active?.name ?? '';
  }

  protected toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  dismissWelcome(): void {
    this.justVerified.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout().subscribe(() => this.router.navigateByUrl('/auth/login'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const target = event.target as Node;
    if (!this.el.nativeElement.contains(target)) {
      this.closeMenu();
    }
  }
}
