# Account & Team Management

**Status:** Backend complete (restheart 9.6.0). Ready for kit + starter work.
**Date:** 2026-07-17
**Updated:** 2026-07-20 — all backend issues closed, spec refreshed.

## Goal

Replace the current single post-login page (logout button + inline invite form) with a
proper account/team management area covering 100% of what `restheart-accounts` offers,
following standard SaaS profile/team-settings UX conventions.

## Requirements (as given)

1. User belongs to a team and can create new ones; a team can be renamed/edited
   (name, description) and deleted if it has no other members.
2. Each team has a list of its members, with the ability to add more via invite
   (owner role only).
3. User has a profile and can update their profile data.
4. User can update their password.
5. All of the above lives in one coherent interface.

## Current state

One page (`pages/shell`) after login:

- Header: avatar, name/email, logout button.
- If `teamInvitations` feature flag is on and the user belongs to >1 team: a team
  switcher list.
- If the active team's role is `owner`: an inline "invite a team member" form.

No profile page, no member list, no password-change UI, no team-creation UI.

## API coverage audit

### Already available — kit (`@restheart-cloud/kit`) + kit-ng (`RhAuthService`), ready to wire into UI

| Function | Endpoint | Notes |
|---|---|---|
| `register` | `POST /auth/register` | |
| `verify` / `buildVerifyUrl` | `GET /auth/verify` | |
| `login` / `logout` / `checkSession` | `POST /token`, `/logout`, `GET /users/me` | |
| `forgotPassword` | `POST /auth/forgot-password` | Also resends the verification email if the account isn't verified yet ([[password-reset]] update, 2026-07-17) |
| `resetPassword` | `PATCH /auth/reset-password` | Requires the emailed token |
| `getTeams` | `GET /auth/teams` | Returns the **caller's own** memberships, not a team's member list |
| `switchTeam` | `POST /auth/switch-team` | |
| `invite` / `resendInvite` | `POST /auth/invite`, `/auth/resend-invite` | owner/admin only |
| `getInvitation` / `activate` / `acceptInvite` | `GET /auth/invitation`, `PATCH /auth/activate`, `POST /auth/accept-invite` | |

### Backend endpoint exists, not yet exposed in kit — small, single-repo addition

| Endpoint | Service | What's missing |
|---|---|---|
| `DELETE /auth/remove-member` | `RemoveMemberService` | No `removeMember()` in kit. Owner/admin only; owners can't remove themselves. |
| `PATCH /auth/member-role` | `UpdateMemberRoleService` | No `updateMemberRole()` in kit. Owner/admin only; can't promote to ownership role via this endpoint. |

These two just need a kit wrapper + kit-ng method, mirroring the existing pattern
(`invite`/`resendInvite` etc.) — no server-side work.

### New in restheart 9.6.0 — backend ready, needs kit wrappers + UI

All items below were tracked under [restheart#648](https://github.com/SoftInstigate/restheart/issues/648) (milestone 9.6.0) and are now implemented.

| # | Feature | Endpoint | Service | Notes |
|---|---|---|---|---|
| [#642](https://github.com/SoftInstigate/restheart/issues/642) | List team members | `GET /auth/team/members` | `ListTeamMembersService` | Returns `[{ email, name, role, joinedAt }]` for the caller's active team. Joins `teams.members[].userId` against `users.profile`. |
| [#643](https://github.com/SoftInstigate/restheart/issues/643) | Create additional team | `POST /auth/teams` | `GetTeamsService` | Creates a new team, assigns caller as `owner`, reissues JWT with new active team. Returns 201 `{ id, name, role }`. |
| [#644](https://github.com/SoftInstigate/restheart/issues/644) | Rename/edit team | `PATCH /auth/team` | `TeamService` | Partial update of `name` and/or `description`. Owner only. |
| [#645](https://github.com/SoftInstigate/restheart/issues/645) | Delete team | `DELETE /auth/team` | `TeamService` | Atomic "only if no other members" check via `findOneAndDelete` + `$expr` size guard. Returns 409 if other members remain. |
| [#646](https://github.com/SoftInstigate/restheart/issues/646) | Update profile | `PATCH /auth/profile` | `UpdateProfileService` | Accepts `{ firstName, lastName }`. Writes to `profile.name` / `profile.surname`. Self-registers ACL allow rule. |
| [#647](https://github.com/SoftInstigate/restheart/issues/647) | Change password | `PATCH /auth/change-password` | `ChangePasswordService` | Accepts `{ currentPassword, newPassword }`. BCrypt verify + min-length 8. Session-authenticated, no email round-trip. |
| [#650](https://github.com/SoftInstigate/restheart/issues/650) | `user.team` as `{_id, role}` | — | `DbHelper`, `DefaultMembershipProvider` | `team` field is now `{ _id, role }` with backward compat for legacy scalar format. JWT `team` claim mirrors the same shape. |

**Kit work needed:** add wrappers for all 7 endpoints above, plus the two pre-existing
`removeMember` / `updateMemberRole` — total of 9 new kit functions + kit-ng methods.

## Proposed information architecture

```
/account                     — profile view/edit, change password
/team                        — current team: member list, invite form, role mgmt, remove,
                                rename/edit, delete (if empty)
/team/new                    — create a new team
(nav) team switcher          — promote existing switcher out of shell into persistent layout
```

Settings-style layout with a persistent side-nav (Account / Team) rather than
today's single stacked page — matches common SaaS conventions (GitHub org settings,
Linear workspace settings, etc.) and scales better once team member management (list +
remove + role change) is added.

## Sequencing

1. ~~**Backend** — implement [restheart#642](https://github.com/SoftInstigate/restheart/issues/642)–[#647](https://github.com/SoftInstigate/restheart/issues/647), tracked under [restheart#648](https://github.com/SoftInstigate/restheart/issues/648), milestone 9.6.0.~~ **Done** (2026-07-20).
2. **Kit** — extend `@restheart-cloud/kit` + `kit-ng` with client functions for the 9
   new endpoints: `listTeamMembers`, `createTeam`, `updateTeam`, `deleteTeam`,
   `updateProfile`, `changePassword`, `removeMember`, `updateMemberRole`, plus verify
   existing `getTeams` / `switchTeam` cover the updated `team: {_id, role}` shape.
3. **Starter app** — build the account/team settings area in
   `restheart-cloud-starter-ng` on top of the extended kit.

## Open question — IA shape

Single settings area with a persistent side-nav (Account / Team tabs, as sketched
above), or something else? Everything else in this document is now sequenced via the
GitHub issues above rather than an open design choice.
