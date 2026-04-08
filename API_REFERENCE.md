# API Reference

## 1. Overview

This Chrome extension integrates with a Similarweb-compatible RapidAPI provider to analyze a target domain and render two traffic insights in the popup UI:

- Estimated monthly visits for the domain.
- Top traffic countries with per-country share.

The default provider configuration uses the following RapidAPI base URL:

- `https://similarweb12.p.rapidapi.com`

## 2. Authentication (RapidAPI)

All requests are authenticated using RapidAPI headers. The extension injects these headers per request and replaces a placeholder key with the user-provided API key.

Required headers:

- `X-RapidAPI-Key`: Your RapidAPI subscription key.
- `X-RapidAPI-Host`: RapidAPI host for the provider (`similarweb12.p.rapidapi.com` by default).

```http
X-RapidAPI-Key: <YOUR_RAPIDAPI_KEY>
X-RapidAPI-Host: similarweb12.p.rapidapi.com
```

## 3. Endpoints

### GET /v1/website/visits?domain={domain}

**Description**

Returns visit metrics for the requested domain. In the extension rendering logic, the visits value is read from one of these keys (in order): `visits`, `totalVisits`, `value`.

**Query Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `domain` | `string` | Yes | Domain to analyze. Must be normalized: no protocol (`http://`, `https://`), no leading `www.`, and no path segments. Example: `example.com`. |

**Responses**

`200 OK`

```json
{
  "domain": "example.com",
  "month": "2025-07",
  "visits": 1234567
}
```

---

### GET /v1/website/top-countries?domain={domain}

**Description**

Returns the top countries contributing traffic share for the requested domain. The extension expects an array in `topCountries` (or compatible alternatives), then displays up to 5 items.

**Query Parameters**

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `domain` | `string` | Yes | Domain to analyze. Must be normalized: no protocol (`http://`, `https://`), no leading `www.`, and no path segments. Example: `example.com`. |

**Responses**

`200 OK`

```json
{
  "domain": "example.com",
  "topCountries": [
    { "country": "US", "share": 0.55 },
    { "country": "IN", "share": 0.44 },
    { "country": "GB", "share": 0.33 },
    { "country": "DE", "share": 0.22 },
    { "country": "CA", "share": 0.11 }
  ]
}
```

## 4. Error Handling & Fallback (Demo Mode)

The extension implements resilient fallback behavior for API unavailability and onboarding/demo workflows:

- If demo mode is enabled (`useMock = true`), requests bypass network calls and return local mock payloads.
- If `X-RapidAPI-Key` is missing/empty, the extension automatically forces mock mode.
- If an API request fails (HTTP non-2xx, network error, runtime exception), the extension returns local mock data with a fallback source marker.

Fallback response envelope (per endpoint call):

```json
{
  "ok": false,
  "data": { "...": "mock payload for this endpoint" },
  "source": "fallback-mock",
  "error": "HTTP 403"
}
```

During successful API execution, the call envelope is:

```json
{
  "ok": true,
  "data": { "...": "provider API JSON payload" },
  "source": "api"
}
```
