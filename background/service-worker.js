import { DEFAULT_PROVIDER, DEFAULT_USE_MOCK, STORAGE_KEYS } from '../shared/constants.js';
import { normalizeDomain } from '../shared/domain.js';
import { MOCK } from '../shared/mock-data.js';

async function ensureDefaults() {
  const { provider, useMock } = await chrome.storage.sync.get([
    STORAGE_KEYS.provider,
    STORAGE_KEYS.useMock
  ]);

  const updates = {};
  if (!provider) updates[STORAGE_KEYS.provider] = DEFAULT_PROVIDER;
  if (useMock === undefined) updates[STORAGE_KEYS.useMock] = DEFAULT_USE_MOCK;
  if (Object.keys(updates).length > 0) {
    await chrome.storage.sync.set(updates);
  }
}

function buildHeaders(provider) {
  return Object.fromEntries(
    Object.entries(provider.headers || {}).map(([key, value]) => [
      key,
      String(value).replace('__REPLACE__', provider.apiKey || '')
    ])
  );
}

async function fetchJson(url, headers, useMock, mockDataKey) {
  try {
    if (useMock) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return { ok: true, data: MOCK[mockDataKey], source: 'mock' };
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return {
      ok: true,
      data: await response.json(),
      source: 'api'
    };
  } catch (error) {
    console.warn('Traffic-Stats API error:', error.message);
    return {
      ok: false,
      data: MOCK[mockDataKey],
      source: 'fallback-mock',
      error: error.message
    };
  }
}

async function analyzeDomain(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  const { provider, useMock } = await chrome.storage.sync.get([
    STORAGE_KEYS.provider,
    STORAGE_KEYS.useMock
  ]);

  const selectedProvider = provider || DEFAULT_PROVIDER;
  const headers = buildHeaders(selectedProvider);
  const shouldUseMock = Boolean(useMock || !headers['X-RapidAPI-Key']);

  const visitsUrl = `${selectedProvider.baseUrl}${selectedProvider.endpoints.visits}${encodeURIComponent(domain)}`;
  const geographyUrl = `${selectedProvider.baseUrl}${selectedProvider.endpoints.geography}${encodeURIComponent(domain)}`;

  const [visits, geography] = await Promise.all([
    fetchJson(visitsUrl, headers, shouldUseMock, 'visits'),
    fetchJson(geographyUrl, headers, shouldUseMock, 'geography')
  ]);

  return { domain, visits, geography };
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureDefaults();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'ANALYZE_DOMAIN') return;

  analyzeDomain(message.domain)
    .then((result) => sendResponse(result))
    .catch((error) => {
      sendResponse({
        domain: normalizeDomain(message.domain),
        visits: { ok: false, data: MOCK.visits, source: 'fallback-mock', error: error.message },
        geography: { ok: false, data: MOCK.geography, source: 'fallback-mock', error: error.message }
      });
    });

  return true;
});
