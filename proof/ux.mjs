// R2: browser-safe helpers only; private fixtures remain in core.mjs on the server.
export const LINE_ACCOUNT_ID = '@udu6260e';
export const LINE_PROFILE_URL = 'https://lin.ee/y8kjBXa';
export const brandsFor = vehicles => [...new Set(vehicles.map(v => v.brand))];
export const modelsFor = (vehicles, brand) => vehicles.filter(v => v.brand === brand);
// LINE official URL scheme: direct OA chat + UTF-8 percent-encoded draft, never automatic sending.
export function lineHandoffUrl(summary) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ACCOUNT_ID)}/?${encodeURIComponent(summary)}`;
}
