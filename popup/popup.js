import { DEFAULT_PROVIDER, STORAGE_KEYS } from '../shared/constants.js';
import { getHostFromUrl } from '../shared/domain.js';

const qs = (id) => document.getElementById(id);
const formatPercent = (value) => `${(Number(value) * 100).toFixed(1)}%`;

function formatNumber(value) {
  try {
    return new Intl.NumberFormat().format(Number(value));
  } catch {
    return String(value);
  }
}

async function getActiveTabDomain() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ? getHostFromUrl(tab.url) : '';
}

async function loadOptions() {
  const { provider, useMock } = await chrome.storage.sync.get([
    STORAGE_KEYS.provider,
    STORAGE_KEYS.useMock
  ]);

  const selectedProvider = provider || DEFAULT_PROVIDER;
  qs('baseUrl').value = selectedProvider.baseUrl || DEFAULT_PROVIDER.baseUrl;
  qs('hostHeader').value =
    selectedProvider.headers?.['X-RapidAPI-Host'] || DEFAULT_PROVIDER.headers['X-RapidAPI-Host'];
  qs('epVisits').value = selectedProvider.endpoints?.visits || DEFAULT_PROVIDER.endpoints.visits;
  qs('epGeo').value = selectedProvider.endpoints?.geography || DEFAULT_PROVIDER.endpoints.geography;
  qs('apiKey').value = selectedProvider.apiKey || '';
  qs('useMock').checked = Boolean(useMock);
}

async function saveOptions() {
  const provider = {
    name: 'RapidAPI Similarweb',
    baseUrl: qs('baseUrl').value.trim(),
    endpoints: {
      visits: qs('epVisits').value.trim(),
      geography: qs('epGeo').value.trim()
    },
    headers: {
      'X-RapidAPI-Key': '__REPLACE__',
      'X-RapidAPI-Host': qs('hostHeader').value.trim()
    },
    apiKey: qs('apiKey').value.trim()
  };

  await chrome.storage.sync.set({
    [STORAGE_KEYS.provider]: provider,
    [STORAGE_KEYS.useMock]: qs('useMock').checked
  });

  const status = qs('saveStatus');
  status.textContent = 'Saved ✓';
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}

function renderVisits(visits) {
  if (!visits?.data) return;
  const data = visits.data;
  const display = data.visits || data.totalVisits || data.value || 0;
  qs('visits').innerHTML = `<div class="big">${formatNumber(display)}</div>`;
}

function renderCountries(geography) {
  if (!geography?.data) return;

  const list = geography.data.topCountries || geography.data.countries || geography.data;
  (list || []).slice(0, 5).forEach((country) => {
    const code = country.country || country.code || '?';
    const share = country.share ?? country.percent ?? 0;
    const width = Math.min(100, Math.round(Number(share) * 100 || Number(share)));

    const item = document.createElement('li');
    item.innerHTML = `<span class="code">${code}</span><span class="fill"><span class="bar" style="width:${width}%"></span></span><span class="val">${formatPercent(share)}</span>`;
    qs('countries').appendChild(item);
  });
}

async function analyze(rawDomain) {
  qs('optionsPanel').classList.add('hidden');
  qs('results').classList.remove('hidden');
  qs('status').textContent = 'Loading...';
  qs('visits').textContent = '';
  qs('countries').innerHTML = '';

  const response = await chrome.runtime.sendMessage({
    type: 'ANALYZE_DOMAIN',
    domain: rawDomain
  });

  renderVisits(response.visits);
  renderCountries(response.geography);
  qs('status').textContent = `Domain: ${response.domain}`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const domain = await getActiveTabDomain();
  if (domain) qs('domainInput').value = domain;

  await loadOptions();

  qs('optionsBtn').addEventListener('click', () => {
    const panel = qs('optionsPanel');
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      qs('results').classList.add('hidden');
      return;
    }

    panel.classList.add('hidden');
  });

  qs('saveBtn').addEventListener('click', saveOptions);
  qs('analyzeBtn').addEventListener('click', () => {
    const domainInput = qs('domainInput').value.trim();
    if (domainInput) analyze(domainInput);
  });
});
