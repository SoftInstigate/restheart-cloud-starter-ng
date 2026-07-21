import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-teams',
  imports: [RouterLink],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams implements OnInit {
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);
  protected readonly loading = signal(true);

  ngOnInit(): void {
    this.auth.loadTeams().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false),
    });
  }

  switchTeam(team: TeamMembership): void {
    if (team.active) return;
    this.auth.switchTeam(team.id).subscribe();
  }
}
