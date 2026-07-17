import { Component, inject, signal, ElementRef, HostListener } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import { justSignedUp as justSignedUpFlag } from '../../just-signed-up';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);
  protected readonly auth = inject(RhAuthService);

  protected readonly justVerified = signal(justSignedUpFlag());
  protected readonly menuOpen = signal(false);

  constructor() {
    justSignedUpFlag.set(false);
  }

  protected initials(): string {
    const user = this.auth.user();
    if (!user) return '?';
    const first = user.profile?.firstName?.charAt(0) ?? '';
    const last = user.profile?.lastName?.charAt(0) ?? '';
    const fallback = user._id?.charAt(0) ?? '?';
    return (first + last || fallback).toUpperCase();
  }

  protected displayName(): string {
    const user = this.auth.user();
    if (!user) return '';
    const fn = user.profile?.firstName;
    const ln = user.profile?.lastName;
    if (fn || ln) return [fn, ln].filter(Boolean).join(' ');
    return user._id;
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
