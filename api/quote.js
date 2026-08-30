module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  if (req.method === "OPTIONS") return res.status(200).end();
  const symbol = String((req.query && req.query.symbol) || "AAPL").slice(0, 24);
  const interval = String((req.query && req.query.interval) || "5m").slice(0, 8);
  const range = String((req.query && req.query.range) || "5d").slice(0, 8);
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/" +
    encodeURIComponent(symbol) +
    "?interval=" + encodeURIComponent(interval) +
    "&range=" + encodeURIComponent(range);
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 BlueBlood/1.1" },
    });
    if (!r.ok) return res.status(502).json({ ok: false, error: "yahoo " + r.status });
    const j = await r.json();
    const resu = j.chart && j.chart.result && j.chart.result[0];
    if (!resu) return res.status(404).json({ ok: false, error: "no data" });
    const meta = resu.meta || {};
    const quotes = (resu.indicators && resu.indicators.quote && resu.indicators.quote[0]) || {};
    const closes = (quotes.close || []).filter((x) => x != null);
    const highs = (quotes.high || []).filter((x) => x != null);
    const lows = (quotes.low || []).filter((x) => x != null);
    const price = Number(meta.regularMarketPrice || closes[closes.length - 1] || 0);
    const prev = Number(meta.chartPreviousClose || closes[0] || price);
    const chg = prev ? ((price - prev) / prev) * 100 : 0;
    return res.status(200).json({
      ok: true,
      symbol,
      price,
      chg,
      closes: closes.slice(-200),
      highs: highs.slice(-200),
      lows: lows.slice(-200),
      volume: (quotes.volume || []).slice(-1)[0] || 0,
      interval,
      range,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) });
  }
};
