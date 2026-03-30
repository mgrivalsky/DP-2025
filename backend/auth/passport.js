const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[auth] Missing required env var: ${name}`);
  }
  return value;
}

function initPassport() {
  const clientID = requireEnv('GOOGLE_CLIENT_ID');
  const clientSecret = requireEnv('GOOGLE_CLIENT_SECRET');
  const callbackURL = requireEnv('GOOGLE_CALLBACK_URL');

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          // Pass minimal profile info to callback handler.
          const email = profile?.emails?.[0]?.value || null;
          const givenName = profile?.name?.givenName || '';
          const familyName = profile?.name?.familyName || '';

          if (!email) {
            return done(null, null);
          }

          return done(null, {
            email,
            givenName,
            familyName,
            googleId: profile?.id || null
          });
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  return passport;
}

module.exports = { initPassport };
