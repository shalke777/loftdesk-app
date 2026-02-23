// netlify/functions/ksef-proxy.js
// KSeF Proxy — omija CORS blokadę API Ministerstwa Finansów
// Netlify automatycznie wykrywa ten plik i wystawia endpoint:
// /.netlify/functions/ksef-proxy

const KSEF_URLS = {
  test: 'https://ksef-test.mf.gov.pl/api',
  prod: 'https://ksef.mf.gov.pl/api',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, SessionToken, Authorization',
};

exports.handler = async function (event) {
  // Preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const { env = 'test', path = '' } = event.queryStringParameters || {};

  if (!KSEF_URLS[env]) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Nieznane środowisko. Użyj: test lub prod' }),
    };
  }

  const targetUrl = `${KSEF_URLS[env]}${path}`;

  // Nagłówki do przepuszczenia
  const forwardHeaders = { 'Content-Type': 'application/json' };
  if (event.headers['sessiontoken']) forwardHeaders['SessionToken'] = event.headers['sessiontoken'];
  if (event.headers['content-type']) forwardHeaders['Content-Type'] = event.headers['content-type'];

  try {
    const response = await fetch(targetUrl, {
      method:  event.httpMethod,
      headers: forwardHeaders,
      body:    event.body || undefined,
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const body        = await response.text();

    return {
      statusCode: response.status,
      headers:    { ...CORS_HEADERS, 'Content-Type': contentType },
      body,
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers:    { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body:       JSON.stringify({ error: 'Błąd proxy', details: err.message }),
    };
  }
};