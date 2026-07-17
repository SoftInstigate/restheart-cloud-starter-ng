# Account & Team Management

**Status:** Backend work tracked on GitHub — [restheart#648](https://github.com/SoftInstigate/restheart/issues/648) (milestone 9.6.0). Blocked on that landing before kit/starter work begins.
**Date:** 2026-07-17

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

### No backend support at all — tracked as GitHub issues (restheart, milestone 9.6.0)

**a. List a team's members (name, email, role)** — [restheart#642](https://github.com/SoftInstigate/restheart/issues/642)
`teams` documents store `members: [{ userId, role, joinedAt }]` — no denormalized
name/email, and no endpoint returns it. `GET /auth/teams` only lists the caller's own
memberships. Building requirement #2 (member list) needs a new read endpoint that joins
`teams.members[].userId` against `users.profile` for the caller's active team — members
can't read arbitrary `/users/{id}` docs themselves.

**b. Update profile (firstName/lastName/etc.)** — [restheart#646](https://github.com/SoftInstigate/restheart/issues/646)
No dedicated `restheart-accounts` endpoint. Generic `PATCH /users/{email}` is *vetoed*
down to `profile.*` fields only (`AccountsInitializer.java`), but that only stops
*unsafe* writes — it doesn't itself grant a user permission to write their own document.
Whether an ACL allow rule for "a user may PATCH their own `/users/{id}`" exists depends
on what each tenant configures; it's not guaranteed out of the box, and the kit has no
`updateProfile()` wrapper today. **Decided:** dedicated `PATCH /auth/profile` endpoint
that self-registers its own ACL allow rule at startup, same pattern as every other
accounts endpoint — consistent with how the rest of the plugin works, instead of relying
on generic Mongo REST + tenant-configured ACL.

**c. Change password while logged in (current password → new password)** — [restheart#647](https://github.com/SoftInstigate/restheart/issues/647)
`resetPasswordService` (`PATCH /auth/reset-password`) is a **public, unauthenticated**
endpoint — it validates only `email + token + password`, no session check. So a logged-in
user *can* change their password today, but only by going through the email round-trip:
call `forgotPassword(ownEmail)` from Settings, receive the email, open the link, submit
the token via `resetPassword()`. There is no direct "current password + new password"
in-session action. **Decided:** new `PATCH /auth/change-password { currentPassword,
newPassword }` endpoint, session-authenticated — matches expected settings-page UX
instead of an email round-trip for a deliberate in-session change.

**d. Team lifecycle: create / update / delete** — [restheart#643](https://github.com/SoftInstigate/restheart/issues/643) (create), [restheart#644](https://github.com/SoftInstigate/restheart/issues/644) (update), [restheart#645](https://github.com/SoftInstigate/restheart/issues/645) (delete)
No capability exists anywhere, and it's a deeper gap than a missing endpoint — the
`MembershipProvider` SPI itself (`org.restheart.plugins.accounts.MembershipProvider`)
has no `updateTeam` or `deleteTeam` method at all. Its full method set is:
`createInitialTeam`, `isMember`, `addMember`, `activeMembership`, `listMemberships`,
`setActiveMembership`, `removeMember`, `updateMemberRole`, `activateViaOAuth`. Compare
to `removeMember`/`updateMemberRole`, which at least have SPI methods + endpoints
already (just missing from the kit, see above) — team create/update/delete has *nothing*
at any layer:
- **Create**: `createInitialTeam()` only runs once, inside `RegisterService`'s signup
  flow. No way to call it again for an existing user.
- **Update** (name/description): no SPI method, no endpoint, no ACL.
- **Delete**: no SPI method, no endpoint. "Only if empty" (no other members) must be
  enforced server-side, atomically — a client-side pre-check would be a race condition
  (another member could be mid-invite-accept when the delete fires).

This is the largest item in this spec — new `MembershipProvider` SPI methods, new
service classes/endpoints (`restheart-accounts`), ACL wiring, and — since multi-team is
presumably a Cloud pricing/plan dimension — possibly a tier-limit check (flagged as an
open question on restheart#643, not blocking the rest).

## Proposed information architecture (pending decisions above)

Sketch only — not final until (a)-(d) above are resolved:

```
/account                     — profile view/edit, change password
/team                        — current team: member list, invite form, role mgmt, remove,
                                rename/edit, delete (if empty)
/team/new                    — BLOCKED on (d)
(nav) team switcher          — promote existing switcher out of shell into persistent layout
```

Likely a settings-style layout with a persistent side-nav (Account / Team) rather than
today's single stacked page — matches common SaaS conventions (GitHub org settings,
Linear workspace settings, etc.) and scales better once team member management (list +
remove + role change) is added.

## Sequencing

1. **Backend** — implement [restheart#642](https://github.com/SoftInstigate/restheart/issues/642)–[#647](https://github.com/SoftInstigate/restheart/issues/647), tracked under [restheart#648](https://github.com/SoftInstigate/restheart/issues/648), milestone 9.6.0.
2. **Kit** — once the above land, extend `@restheart-cloud/kit` + `kit-ng` with matching
   client functions: `listTeamMembers`, `createTeam`, `updateTeam`, `deleteTeam`,
   `updateProfile`, `changePassword`, plus the two already-backend-ready
   `removeMember`/`updateMemberRole` wrappers.
3. **Starter app** — build the account/team settings area in
   `restheart-cloud-starter-ng` on top of the extended kit.

## Open question — IA shape

Single settings area with a persistent side-nav (Account / Team tabs, as sketched
above), or something else? Everything else in this document is now sequenced via the
GitHub issues above rather than an open design choice.

No frontend or `restheart-accounts` code has been implemented yet — this document is
audit + proposed shape + tracking links only.
