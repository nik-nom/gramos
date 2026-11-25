// Shared editable slots. Labeled sample media are presentation fallbacks, never village records.
export const officialSlots=Object.freeze([
 {slug:'official-1',title_mr:'सरपंच — फोटो बदला',title_en:'Sarpanch — replace photo',subtitle_mr:'सरपंच',subtitle_en:'Sarpanch',details:{about_group:'representatives'},sort_order:0,sample_image:'/assets/reference-demo/official-1.webp'},
 {slug:'official-2',title_mr:'उपसरपंच — फोटो बदला',title_en:'Deputy Sarpanch — replace photo',subtitle_mr:'उपसरपंच',subtitle_en:'Deputy Sarpanch',details:{about_group:'representatives'},sort_order:1,sample_image:'/assets/reference-demo/official-2.webp'},
 {slug:'official-3',title_mr:'ग्रामपंचायत अधिकारी — फोटो बदला',title_en:'Panchayat officer — replace photo',subtitle_mr:'ग्रामपंचायत अधिकारी',subtitle_en:'Panchayat officer',details:{about_group:'staff'},sort_order:2,sample_image:'/assets/reference-demo/official-3.webp'}
]);
export const slideSlots=Object.freeze(['hero-tree.webp','gallery-photo.webp','project-1.webp'].map((f,i)=>({slug:`banner-slot-${i+1}`,title_mr:`बॅनर फोटो ${i+1}`,title_en:`Banner photo ${i+1}`,sort_order:i,sample_image:'/assets/reference-demo/'+f})));
export const gallerySlots=Object.freeze(slideSlots.map((s,i)=>({...s,slug:`gallery-slot-${i+1}`,title_mr:`गॅलरी फोटो ${i+1}`,title_en:`Gallery photo ${i+1}`,details:{gallery_type:'meetings'}})));
export const leaderSlots=Object.freeze(Array.from({length:5},(_,i)=>({slug:`minister-${i+1}`,sample_image:`/assets/reference-demo/minister-${i+1}.webp`})));
// Reserve explicitly edited slots before assigning other existing records. No duplicate people.
export function missingMediaSlots(slots,records){
 const used=new Set(records.map(x=>x.slug)); const free=slots.filter(s=>!used.has(s.slug));
 const unmatched=records.filter(x=>!slots.some(s=>s.slug===x.slug));
 return free.slice(unmatched.length);
}
export function portraitPlaceholder(slot,preview){return slot?.sample_image||'/assets/placeholders/portrait.svg';}

export function realMediaURL(raw){const value=String(raw||'').trim();if(!value)return '';try{const u=new URL(value,globalThis.location?.origin||'https://local.invalid');if(u.origin===(globalThis.location?.origin||'https://local.invalid')&&(/\/assets\/placeholders\//.test(u.pathname)||/\/assets\/(gp-mark|mark|landscape)\.svg$/.test(u.pathname)))return '';}catch{}return value;}
