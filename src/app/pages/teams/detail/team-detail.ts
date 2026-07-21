import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RhAuthService } from '@restheart-cloud/kit-ng';
import type { TeamMembership, TeamMember, PendingInvitation } from '@restheart-cloud/kit-ng';
import { environment } from '../../../../environments/environment';
import { Alert } from '../../../ui/alert/alert';

@Component({
  selector: 'app-team-detail',
  imports: [ReactiveFormsModule, RouterLink, Alert, DatePipe],
  templateUrl: './team-detail.html',
  styleUrl: './team-detail.css',
})
export class TeamDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(RhAuthService);

  protected readonly features = environment.features;
  protected teamId = '';

  protected readonly team = signal<TeamMembership | undefined>(undefined);
  protected readonly isOwner = () => this.team()?.role === 'owner';

  protected readonly members = signal<TeamMember[]>([]);
  protected readonly membersLoading = signal(true);
  protected readonly memberActionPending = signal<string | null>(null);

  protected readonly invitations = signal<PendingInvitation[]>([]);
  protected readonly invitationsLoading = signal(true);
  protected readonly resendingEmail = signal<string | null>(null);
  protected readonly resendSuccessEmail = signal<string | null>(null);
  private readonly resendCooldowns = signal<Record<string, number>>({});
  private static readonly RESEND_COOLDOWN_MS = 5 * 60 * 1000;

  protected readonly inviteForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    role: ['member' as 'owner' | 'member', [Validators.required]],
  });
  protected readonly inviteSending = signal(false);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly inviteSent = signal(false);

  protected readonly teamForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    description: [''],
  });
  protected readonly teamSaving = signal(false);
  protected readonly teamSaved = signal(false);
  protected readonly teamError = signal<string | null>(null);

  protected readonly deleteConfirming = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

  protected readonly removingMemberEmail = signal<string | null>(null);

  ngOnInit(): void {
    this.teamId = this.route.snapshot.paramMap.get('id') ?? '';
    this.auth.loadTeams().subscribe(() => {
      this.team.set(this.auth.teams().find(t => t.id.$oid === this.teamId));
      this.teamForm.patchValue({
        name: this.team()?.name ?? '',
        description: this.team()?.description ?? '',
      });
    });
    this.loadMembers();
    this.loadInvitations();

    this.inviteForm.valueChanges.subscribe(() => this.inviteSent.set(false));
    this.teamForm.valueChanges.subscribe(() => this.teamSaved.set(false));
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

  private loadInvitations(): void {
    this.invitationsLoading.set(true);
    this.auth.listInvitations().subscribe({
      next: invitations => {
        this.invitations.set(invitations);
        this.invitationsLoading.set(false);
      },
      error: () => this.invitationsLoading.set(false),
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
    this.removingMemberEmail.set(null);
    this.auth.removeMember(member.email).subscribe({
      next: () => {
        this.members.update(list => list.filter(m => m.email !== member.email));
        this.memberActionPending.set(null);
      },
      error: () => this.memberActionPending.set(null),
    });
  }

  confirmRemove(email: string): void { this.removingMemberEmail.set(email); }
  cancelRemove(): void { this.removingMemberEmail.set(null); }

  resendInvite(invite: PendingInvitation): void {
    this.resendingEmail.set(invite.email);
    this.resendSuccessEmail.set(null);
    this.auth.resendInvite(invite.email).subscribe({
      next: () => {
        this.resendingEmail.set(null);
        this.resendSuccessEmail.set(invite.email);
        this.resendCooldowns.update(cooldowns => ({ ...cooldowns, [invite.email]: Date.now() }));
      },
      error: () => this.resendingEmail.set(null),
    });
  }

  protected canResend(email: string): boolean {
    const since = this.resendCooldowns()[email];
    if (!since) return true;
    return Date.now() - since >= TeamDetail.RESEND_COOLDOWN_MS;
  }

  protected resendCooldownLeft(email: string): string {
    const since = this.resendCooldowns()[email];
    if (!since) return '';
    const elapsed = Date.now() - since;
    const remaining = TeamDetail.RESEND_COOLDOWN_MS - elapsed;
    if (remaining <= 0) return '';
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes}m`;
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
    const t = this.team();
    if (!t || this.teamForm.invalid) return;
    this.teamSaving.set(true);
    this.teamError.set(null);
    this.teamSaved.set(false);
    const { name, description } = this.teamForm.getRawValue();
    this.auth.updateTeam({ name, description }).subscribe({
      next: () => {
        this.teamSaving.set(false);
        this.teamSaved.set(true);
        this.teamForm.markAsPristine();
      },
      error: (err: unknown) => {
        this.teamSaving.set(false);
        const e = err as { message?: string };
        this.teamError.set(e?.message ?? 'Something went wrong. Please try again.');
      },
    });
  }

  confirmDelete(): void { this.deleteConfirming.set(true); }
  cancelDelete(): void { this.deleteConfirming.set(false); this.deleteError.set(null); }

  deleteTeam(): void {
    const t = this.team();
    if (!t) return;
    this.deleting.set(true);
    this.deleteError.set(null);
    this.auth.deleteTeam().subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteConfirming.set(false);
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
