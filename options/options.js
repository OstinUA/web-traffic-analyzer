import { DEFAULT_PROVIDER, STORAGE_KEYS } from '../shared/constants.js';

const $ = (id) => document.getElementById(id);

async function load() {
  const { provider, useMock } = await chrome.storage.sync.get([
    STORAGE_KEYS.provider,
    STORAGE_KEYS.useMock
  ]);

  const selectedProvider = provider || DEFAULT_PROVIDER;
  $('baseUrl').value = selectedProvider.baseUrl || DEFAULT_PROVIDER.baseUrl;
  $('hostHeader').value =
    selectedProvider.headers?.['X-RapidAPI-Host'] || DEFAULT_PROVIDER.headers['X-RapidAPI-Host'];
  $('epVisits').value = selectedProvider.endpoints?.visits || DEFAULT_PROVIDER.endpoints.visits;
  $('epGeo').value = selectedProvider.endpoints?.geography || DEFAULT_PROVIDER.endpoints.geography;
  $('apiKey').value = selectedProvider.apiKey || '';
  $('useMock').checked = Boolean(useMock);
}

async function save() {
  const provider = {
    name: 'RapidAPI Similarweb',
    baseUrl: $('baseUrl').value.trim(),
    endpoints: {
      visits: $('epVisits').value.trim(),
      geography: $('epGeo').value.trim()
    },
    headers: {
      'X-RapidAPI-Key': '__REPLACE__',
      'X-RapidAPI-Host': $('hostHeader').value.trim()
    },
    apiKey: $('apiKey').value.trim()
  };

  await chrome.storage.sync.set({
    [STORAGE_KEYS.provider]: provider,
    [STORAGE_KEYS.useMock]: $('useMock').checked
  });

  const status = $('saveStatus');
  status.textContent = 'Saved ✓';
  setTimeout(() => {
    status.textContent = '';
  }, 2000);
}

document.addEventListener('DOMContentLoaded', () => {
  load();
  $('saveBtn').addEventListener('click', save);
});
