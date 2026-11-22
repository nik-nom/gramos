/** One reusable blue Shamvadi layout. Data stays per-village in Supabase. */
export const SHAMVADI_TEMPLATE_LABEL = 'Shamvadi Blue / शामवाडी निळी थीम';
export const SHAMVADI_TEMPLATE_SECTIONS = Object.freeze([
  'gallery_notice','leaders_schemes','services_video','news','projects','facilities'
]);
export function buildShamvadiVillage(input) {
  const slug=String(input.slug||'').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length<2 || slug.length>64)
    throw new Error('Website slug must be 2–64 lowercase letters/numbers with optional hyphens.');
  const name_en=String(input.name_en||'').trim();
  const name_mr=String(input.name_mr||'').trim();
  if (!name_en&&!name_mr) throw new Error('Enter a village name in Marathi or English.');
  const fields=['taluka_mr','taluka_en','district_mr','district_en'];
  return {
    slug,name_en,name_mr,
    ...Object.fromEntries(fields.map(x=>[x,String(input[x]||'').trim()])),
    template_style:'classic',
    home_sections:[...SHAMVADI_TEMPLATE_SECTIONS],
    site_settings:{template_key:'shamvadi-blue',template_version:22},
    status:'draft'
  };
}
