import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership, TeamMember } from '@restheart-cloud/kit-ng';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-team',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './team.html',
  styleUrl: './team.css',
})
export class Team implements OnInit {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  protected readonly features = environment.features;

  protected readonly activeTeam = () => this.auth.teams().find(t => t.active);
  protected readonly isOwner = () => this.activeTeam()?.role === 'owner';

  // ── Members ────────────────────────────────────────────────────────────
  protected readonly members = signal<TeamMember[]>([]);
  protected readonly membersLoading = signal(true);
  protected readonly memberActionPending = signal<string | null>(null);

  // ── Invite ─────────────────────────────────────────────────────────────
  protected readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member' as 'owner' | 'member', [Validators.required]],
  });
  protected readonly inviteSending = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly inviteSent = signal(false);

  // ── Team settings (rename/edit) ───────────────────────────────────────
  protected readonly teamForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });
  protected readonly teamSaving = signal(false);
  protected readonly teamSaved = signal(false);
  protected readonly teamError = signal<string | null>(null);

  // ── Delete team ────────────────────────────────────────────────────────
  protected readonly deleteConfirming = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  ngOnInit(): void {
    this.teamForm.patchValue({ name: this.activeTeam()?.name ?? '' });
    this.loadMembers();
  }

  private loadMembers(): void {
    this.membersLoading.set(true);
    this.auth.listTeamMembers().subscribe({
      next: members => {
        this.members.set(members);
        this.membersLoading.set(false);
      },
      error: () => this.membersLoading.set(false),
    });
  }

  switchTeam(team: TeamMembership): void {
    if (team.active) return;
    this.auth.switchTeam(team.id).subscribe(() => {
      this.teamForm.patchValue({ name: this.activeTeam()?.name ?? '' });
      this.loadMembers();
    });
  }

  sendInvite(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.inviteSending.set(true);
    this.inviteError.set(null);
    const { email, role } = this.inviteForm.getRawValue();

    this.auth.invite(email, role).subscribe({
      next: () => {
        this.inviteSending.set(false);
        this.inviteSent.set(true);
        this.inviteForm.reset({ email: '', role: 'member' });
      },
      error: (err: unknown) => {
        this.inviteSending.set(false);
        const e = err as { status?: number; message?: string };
        this.inviteError.set(
          e?.status === 409
            ? 'This person is already a member of your team.'
            : (e?.message ?? 'Something went wrong. Please try again.')
        );
      },
    });
  }

  removeMember(member: TeamMember): void {
    this.memberActionPending.set(member.email);
    this.auth.removeMember(member.email).subscribe({
      next: () => {
        this.members.update(list => list.filter(m => m.email !== member.email));
        this.memberActionPending.set(null);
      },
      error: () => this.memberActionPending.set(null),
    });
  }

  changeRole(member: TeamMember, role: 'owner' | 'member'): void {
    if (member.role === role) return;
    this.memberActionPending.set(member.email);
    this.auth.updateMemberRole(member.email, role).subscribe({
      next: () => {
        this.members.update(list =>
          list.map(m => (m.email === member.email ? { ...m, role } : m))
        );
        this.memberActionPending.set(null);
      },
      error: () => this.memberActionPending.set(null),
    });
  }

  saveTeam(): void {
    const team = this.activeTeam();
    if (!team || this.teamForm.invalid) return;

    this.teamSaving.set(true);
    this.teamError.set(null);
    this.teamSaved.set(false);
    const { name, description } = this.teamForm.getRawValue();

    this.auth.updateTeam(team.id, { name, description }).subscribe({
      next: () => {
        this.teamSaving.set(false);
        this.teamSaved.set(true);
      },
      error: (err: unknown) => {
        this.teamSaving.set(false);
        const e = err as { message?: string };
        this.teamError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  confirmDelete(): void {
    this.deleteConfirming.set(true);
  }

  cancelDelete(): void {
    this.deleteConfirming.set(false);
    this.deleteError.set(null);
  }

  deleteTeam(): void {
    const team = this.activeTeam();
    if (!team) return;

    this.deleting.set(true);
    this.deleteError.set(null);

    this.auth.deleteTeam(team.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteConfirming.set(false);
        // In a real flow the caller no longer belongs to this team — reload
        // memberships so the switcher/active team reflects the deletion.
        this.auth.checkSession().subscribe();
      },
      error: (err: unknown) => {
        this.deleting.set(false);
        const e = err as { message?: string };
        this.deleteError.set(e?.message ?? 'Could not delete the team.');
      },
    });
  }
}
