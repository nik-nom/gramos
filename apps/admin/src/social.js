/** Shared site-wide (per village) official accounts, reused across all pages. */
export const SOCIAL_FIELDS=Object.freeze({
  facebook_url:{label:'Facebook',hosts:['facebook.com','www.facebook.com','m.facebook.com','fb.com']},
  instagram_url:{label:'Instagram',hosts:['instagram.com','www.instagram.com']},
  youtube_url:{label:'YouTube',hosts:['youtube.com','www.youtube.com','youtu.be','www.youtu.be']},
  whatsapp_url:{label:'WhatsApp',hosts:['wa.me','api.whatsapp.com','www.whatsapp.com','whatsapp.com']},
  linkedin_url:{label:'LinkedIn',hosts:['linkedin.com','www.linkedin.com']}
});
export function socialUrl(key,raw){
  if(!raw || typeof raw!=='string' || !SOCIAL_FIELDS[key])return '';
  try {
    const s=raw.trim(), url=new URL(s);
    if(url.protocol!=='https:'||url.username||url.password||url.port||!SOCIAL_FIELDS[key].hosts.includes(url.hostname.toLowerCase()))return '';
    if(key==='whatsapp_url'){
      if(url.hostname==='wa.me' && !/^\/(?:[0-9]{7,15}|message\/[A-Za-z0-9]+|[A-Za-z0-9]+)\/?$/.test(url.pathname))return '';
      if(url.hostname==='api.whatsapp.com'&&!url.pathname.startsWith('/send'))return '';
      if(url.hostname.endsWith('whatsapp.com')&&url.hostname!=='api.whatsapp.com'&&!url.pathname.startsWith('/channel/'))return '';
    }
    if(url.href.length>2048)return '';
    return url.href;
  } catch{return '';}
}
export function validateSocialSettings(ss){
  for(const [key,details] of Object.entries(SOCIAL_FIELDS)){
    if(ss[key] && !socialUrl(key,ss[key]))throw new Error(`${details.label}: enter a valid official HTTPS ${details.label} URL.`);
  }
}
