// Slugs that have a hand-authored swipe-card JSON in data/articles/.
// These open in the full-screen SwipeReader (/read/:slug); everything else
// opens as a normal blog article (/article/:slug).
export const SWIPE_SLUGS = new Set([
  'rupee-depreciation',
  'super-el-nino',
  'women-workforce-paradox',
  'women-proxy-representation',
  'women-glass-ceiling',
  'women-gender-pay-gap',
  'women-safety-economy',
  'women-education-gap',
  'women-health-india',
]);

// Where a given article should link to.
export function articleHref(slug) {
  return SWIPE_SLUGS.has(slug) ? `/read/${slug}` : `/article/${slug}`;
}
