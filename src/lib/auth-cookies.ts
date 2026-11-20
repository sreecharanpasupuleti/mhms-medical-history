export const isHttpsContext =
  Boolean(process.env.APP_URL?.startsWith('https://')) ||
  Boolean(process.env.NEXTAUTH_URL?.startsWith('https://')) ||
  process.env.VERCEL === '1';

export const isIframePreview = Boolean(process.env.APP_URL?.startsWith('https://'));

export const SESSION_COOKIE_NAME = isIframePreview
  ? 'mhms.session-token'
  : isHttpsContext
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token';
