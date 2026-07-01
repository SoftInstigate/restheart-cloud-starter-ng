export const environment = {
  // Local development — point this at a free RESTHeart Cloud service,
  // e.g. 'https://<srvid>.eu-central-1-free-1.restheart.com'. Leave empty
  // to show the "configure your service" screen instead of the app.
  apiUrl: 'https://acac36.eu-central-1-free-1.restheart.com',

  // Match these to the "Features" toggles of your RESTHeart Cloud service
  // (Your Service → Sign-up Mgmt → Features). A feature that's off on the
  // server returns 403 to unauthenticated users — set the matching flag
  // here to false so the app doesn't offer UI for it.
  features: {
    emailRegistration: true, // Registration & Verification
    passwordReset: true, // Password Reset
    oauthLogin: true, // OAuth Social Login
    oauthProviders: ['google', 'github'] as const, // must match what's configured server-side
    teamInvitations: true, // Team Invitations
  },
};
