export const environment = {
  // Production build — point this at a shared (or higher) RESTHeart Cloud
  // service, e.g. 'https://<srvid>.eu-central-1-shared-1.restheart.com'. A free
  // service is meant for development only (see environment.dev.ts).
  // Leave empty to show the "configure your service" screen instead of the app.
  apiUrl: '',

  // Match these to the "Features" toggles of your RESTHeart Cloud service
  // (Your Service → Sign-up Mgmt → Features). A feature that's off on the
  // server returns 403 to unauthenticated users — set the matching flag
  // here to false so the app doesn't offer UI for it.
  features: {
    emailRegistration: true, // Registration & Verification
    passwordReset: true, // Password Reset
    oauthLogin: false, // OAuth Social Login
    oauthProviders: ['google', 'github'] as const, // must match what's configured server-side
    teamInvitations: true, // Team Invitations
  },
};
