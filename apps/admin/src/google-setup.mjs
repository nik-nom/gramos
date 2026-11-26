// Only accept a Google verification token, never arbitrary HTML.
export function parseGoogleVerification(raw){
 const value=String(raw||'').trim();
 if(/^[A-Za-z0-9_-]{1,256}$/.test(value))return value;
 const tag=value.match(/^<meta\s+name=["']google-site-verification["']\s+content=["']([A-Za-z0-9_-]{1,256})["']\s*\/?\s*>$/i);
 return tag?.[1]||'';
}
