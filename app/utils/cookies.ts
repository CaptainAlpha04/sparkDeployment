import cookie from 'cookie';

// Function to get a specific cookie value by name
export function getCookie(name: string, cookies: string): string | undefined {
  const cookiesObject = cookie.parse(cookies);
  return cookiesObject[name];
}

// Function to set a cookie (use on server-side or in API routes)
export function setCookie(name: string, value: string, options: cookie.CookieSerializeOptions = {}): string {
  return cookie.serialize(name, value, options);
}
