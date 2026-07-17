import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership } from '@restheart-cloud/kit-ng';

@Component({
  selector: 'app-teams',
  imports: [RouterLink],
  templateUrl: './teams.html',
  styleUrl: './teams.css',
})
export class Teams {
  private readonly router = inject(Router);
  protected readonly auth = inject(RhAuthService);

  switchTeam(team: TeamMembership): void {
    if (team.active) return;
    this.auth.switchTeam(team.id).subscribe();
  }
}
