import test from "node:test";
import assert from "node:assert/strict";
import { getHistoricalBars, MarketDataError } from "../lib/market-data.ts";

// Clearly labelled provider response fixtures. These are contract tests, not live-market integration tests.
const twelveFixture = { values: [
  { datetime: "2025-01-02", open: "100", high: "103", low: "99", close: "102", volume: "1234" },
  { datetime: "2025-01-03", open: "102", high: "104", low: "101", close: "103", volume: "1500" },
] };
const alphaFixture = { "Time Series (Daily)": {
  "2025-01-03": { "1. open": "102", "2. high": "104", "3. low": "101", "4. close": "103", "5. volume": "1500" },
  "2025-01-02": { "1. open": "100", "2. high": "103", "3. low": "99", "4. close": "102", "5. volume": "1234" },
} };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, text: async () => typeof body === "string" ? body : JSON.stringify(body) });
const request = { instrumentId: "NASDAQ:AAPL", startDate: "2025-01-01", endDate: "2025-01-05", interval: "1d", lookback: 2 };

test("normalizes Twelve Data OHLCV and records exchange/source timestamps", async () => {
  const result = await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-key" }, fetchImpl: async () => response(twelveFixture), cache: new Map(), now: () => new Date("2025-01-06T12:00:00Z") });
  assert.equal(result.source, "Twelve Data");
  assert.equal(result.instrument.exchange, "NASDAQ");
  assert.equal(result.bars.length, 2);
  assert.equal(result.bars[0].open, 100);
  assert.equal(result.lastBarAt, "2025-01-03");
  assert.equal(result.sourceStatus, "historical");
});

test("does not retry a Stooq-like 403 and falls back to Alpha Vantage", async () => {
  const calls = [];
  const result = await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-primary", ALPHA_VANTAGE_API_KEY: "fixture-secondary" }, cache: new Map(), fetchImpl: async (url) => { calls.push(new URL(url).hostname); return calls.length === 1 ? response("forbidden", 403) : response(alphaFixture); } });
  assert.equal(calls.length, 2);
  assert.deepEqual(calls, ["api.twelvedata.com", "www.alphavantage.co"]);
  assert.equal(result.source, "Alpha Vantage");
  assert.equal(result.fallbackFrom, "Twelve Data");
});

test("logs the denied provider response with credentials and emails removed", async () => {
  const original = console.warn;
  const entries = [];
  console.warn = (...args) => entries.push(args);
  try {
    await assert.rejects(() => getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "secret-fixture-key" }, cache: new Map(), fetchImpl: async () => response("API key secret-fixture-key denied for owner@example.com", 403) }));
  } finally { console.warn = original; }
  const log = JSON.stringify(entries);
  assert.match(log, /403/);
  assert.match(log, /\[credential redacted\]/);
  assert.match(log, /\[email redacted\]/);
  assert.doesNotMatch(log, /secret-fixture-key|owner@example.com/);
});

test("handles a 429 without retrying the limited provider and checks the configured fallback", async () => {
  const calls = [];
  const result = await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-primary", ALPHA_VANTAGE_API_KEY: "fixture-secondary" }, cache: new Map(), fetchImpl: async (url) => { calls.push(new URL(url).hostname); return calls.length === 1 ? response("quota exceeded", 429) : response(alphaFixture); } });
  assert.equal(calls.length, 2);
  assert.equal(result.source, "Alpha Vantage");
  assert.equal(result.fallbackFrom, "Twelve Data");
});

test("uses Binance daily klines for the crypto instrument mapping", async () => {
  const fixture = [
    [Date.parse("2025-01-02T00:00:00Z"), "100", "103", "99", "102", "1234"],
    [Date.parse("2025-01-03T00:00:00Z"), "102", "104", "101", "103", "1500"],
  ];
  let url;
  const result = await getHistoricalBars({ ...request, instrumentId: "BINANCE:BTCUSDT" }, { env: {}, cache: new Map(), fetchImpl: async (value) => { url = new URL(value); return response(fixture); } });
  assert.equal(result.source, "Binance");
  assert.equal(result.instrument.assetClass, "crypto");
  assert.equal(url.searchParams.get("symbol"), "BTCUSDT");
  assert.equal(url.searchParams.get("interval"), "1d");
});

test("retries one timeout, then returns validated bars", async () => {
  let calls = 0;
  const result = await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-key" }, cache: new Map(), fetchImpl: async () => { calls++; if (calls === 1) { const error = new Error("timeout"); error.name = "TimeoutError"; throw error; } return response(twelveFixture); } });
  assert.equal(calls, 2);
  assert.equal(result.bars.length, 2);
});

test("drops duplicate and structurally invalid OHLCV observations", async () => {
  const fixture = { values: [
    ...twelveFixture.values,
    { datetime: "2025-01-03", open: "102", high: "104", low: "101", close: "103", volume: "1500" },
    { datetime: "2025-01-04", open: "100", high: "99", low: "101", close: "98", volume: "-1" },
  ] };
  const result = await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-key" }, cache: new Map(), fetchImpl: async () => response(fixture) });
  assert.equal(result.bars.length, 2);
  assert.equal(result.bars[1].time, "2025-01-03");
});

test("uses the successful historical cache for the same instrument, interval and range", async () => {
  let calls = 0;
  const cache = new Map();
  const deps = { env: { TWELVE_DATA_API_KEY: "fixture-key" }, fetchImpl: async () => { calls++; return response(twelveFixture); }, cache, now: () => new Date("2025-01-06T12:00:00Z") };
  const first = await getHistoricalBars(request, deps);
  const second = await getHistoricalBars(request, deps);
  assert.equal(first.cache, "miss");
  assert.equal(second.cache, "hit");
  assert.equal(calls, 1);
});

test("separates cache entries when configured provider routing changes", async () => {
  let calls = 0;
  const cache = new Map();
  const fetchImpl = async () => { calls++; return response(twelveFixture); };
  const now = () => new Date("2025-01-06T12:00:00Z");
  await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-primary" }, fetchImpl, cache, now });
  await getHistoricalBars(request, { env: { TWELVE_DATA_API_KEY: "fixture-primary", ALPHA_VANTAGE_API_KEY: "fixture-fallback" }, fetchImpl, cache, now });
  assert.equal(calls, 2);
});

test("does not cache or return fabricated data when no provider is configured", async () => {
  await assert.rejects(() => getHistoricalBars(request, { env: {}, cache: new Map(), fetchImpl: async () => { throw new Error("should not fetch"); } }), (error) => {
    assert.ok(error instanceof MarketDataError);
    assert.match(error.message, /Twelve Data API key is not configured/);
    assert.match(error.message, /Alpha Vantage API key is not configured/);
    return true;
  });
});

test("rejects unsupported instruments and intervals", async () => {
  await assert.rejects(() => getHistoricalBars({ ...request, instrumentId: "NSE:RELIANCE" }), /Unsupported instrument/);
  await assert.rejects(() => getHistoricalBars({ ...request, interval: "1h" }), /Only the 1d interval/);
});

