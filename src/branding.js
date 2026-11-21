/** Fixed legal footer for the GramOS platform. This is not village content. */
export const PLATFORM_LEGAL = Object.freeze({
  company: 'V Swaraj Gramsoft and Software Private Limited',
  location: 'Jalna',
  numbers: Object.freeze(['9923227879', '9423227879']),
  year: 2026
});
export const MARATHI_SOCIAL_HEADING = 'समाजमाध्यमे';
export function platformLegalNotice() {
  return `Copyright © ${PLATFORM_LEGAL.year} · ${PLATFORM_LEGAL.company}™ · ${PLATFORM_LEGAL.location} · ${PLATFORM_LEGAL.numbers.join(' / ')}`;
}
