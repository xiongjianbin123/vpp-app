import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { query } from './database';
import { getRoleOrDefault } from './roles';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

interface DbUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role_key: string;
  github_id: string;
  github_login: string;
}

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      callbackURL: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3001/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: unknown, user?: Express.User) => void
    ) => {
      try {
        const githubId = profile.id;
        const githubLogin = profile.username ?? '';
        const name = profile.displayName || githubLogin;
        const email = profile.emails?.[0]?.value ?? `${githubLogin}@github.com`;

        // Upsert user
        const rows = await query<DbUser>(
          `INSERT INTO users (username, name, email, role_key, github_id, github_login)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (github_id) DO UPDATE
             SET github_login = EXCLUDED.github_login,
                 name = COALESCE(NULLIF(users.name,''), EXCLUDED.name),
                 email = COALESCE(NULLIF(users.email,''), EXCLUDED.email)
           RETURNING *`,
          [githubLogin, name, email, 'sales_manager', githubId, githubLogin]
        );

        const user = rows[0];
        const role = getRoleOrDefault(user.role_key);

        return done(null, {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          roleKey: user.role_key,
          roleLabel: role.label,
          allowedRoutes: role.allowedRoutes,
        });
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Minimal session serialization (we use JWT so sessions are short-lived)
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user as Express.User));

export default passport;
