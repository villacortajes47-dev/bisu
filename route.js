import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {strategy:'jwt', maxAge:60*60*8},
  providers: [GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || 'CONFIGURE_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'CONFIGURE_GOOGLE_CLIENT_SECRET',
    authorization: { params: {
      scope: [
        'openid','email','profile',
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.rosters.readonly',
        'https://www.googleapis.com/auth/classroom.coursework.students',
        'https://www.googleapis.com/auth/drive.readonly'
      ].join(' '),
      access_type:'offline', prompt:'consent'
    }}
  })],
  callbacks: {
    async signIn({profile}) {
      const email = (profile?.email || '').toLowerCase();
      return Boolean(process.env.ADMIN_EMAIL && profile?.email_verified && email === process.env.ADMIN_EMAIL.toLowerCase());
    },
    async jwt({token, account}) {
      if (account?.provider === 'google') {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken = account.refresh_token || token.googleRefreshToken;
        token.googleAccessExpiry = account.expires_at || 0;
      }
      return token;
    },
    async session({session}) { // NEVER expose Google access / refresh tokens to the browser.
      session.isTeacher = true;
      return session;
    }
  },
  pages: {error:'/'},
};
const handler = NextAuth(authOptions);
export {handler as GET, handler as POST};
