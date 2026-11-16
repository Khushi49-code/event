//  FILE PATH: lib/captcha.ts   (નવી ફાઇલ)

export async function verifyCaptcha(token?: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error('TURNSTILE_SECRET_KEY .env.local માં ખૂટે છે');
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.append('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  const data = await res.json();
  return !!data.success;
}