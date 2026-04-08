export const STORAGE_KEYS = {
  provider: 'provider',
  useMock: 'useMock'
};

export const DEFAULT_PROVIDER = {
  name: 'RapidAPI Similarweb',
  baseUrl: 'https://similarweb12.p.rapidapi.com',
  endpoints: {
    visits: '/v1/website/visits?domain=',
    geography: '/v1/website/top-countries?domain='
  },
  headers: {
    'X-RapidAPI-Key': '__REPLACE__',
    'X-RapidAPI-Host': 'similarweb12.p.rapidapi.com'
  }
};

export const DEFAULT_USE_MOCK = true;
