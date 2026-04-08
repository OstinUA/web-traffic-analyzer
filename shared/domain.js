export function normalizeDomain(input = '') {
  return input
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
}

export function getHostFromUrl(url = '') {
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return '';
  }
}
