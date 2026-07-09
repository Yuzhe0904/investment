const storageKey = "local-investment-workbench-v1";
const settingsKey = "local-investment-workbench-settings-v1";
const apiCacheKey = "local-investment-workbench-fmp-cache-v1";
const apiKeyStorageKey = "local-investment-workbench-fmp-key-v1";
const fmpBaseUrl = "https://financialmodelingprep.com/stable";
const fallbackSearchUniverse = [
  ["AAPL", "Apple Inc.", "NASDAQ"],
  ["MSFT", "Microsoft Corporation", "NASDAQ"],
  ["NVDA", "NVIDIA Corporation", "NASDAQ"],
  ["AVGO", "Broadcom Inc.", "NASDAQ"],
  ["ANET", "Arista Networks, Inc.", "NYSE"],
  ["TSLA", "Tesla, Inc.", "NASDAQ"],
  ["AMZN", "Amazon.com, Inc.", "NASDAQ"],
  ["GOOGL", "Alphabet Inc.", "NASDAQ"],
  ["GOOG", "Alphabet Inc.", "NASDAQ"],
  ["META", "Meta Platforms, Inc.", "NASDAQ"],
  ["NFLX", "Netflix, Inc.", "NASDAQ"],
  ["AMD", "Advanced Micro Devices, Inc.", "NASDAQ"],
  ["ASML", "ASML Holding N.V.", "NASDAQ"],
  ["TSM", "Taiwan Semiconductor Manufacturing Company Limited", "NYSE"],
  ["BABA", "Alibaba Group Holding Limited", "NYSE"],
].map(([symbol, name, exchange]) => ({ symbol, name, exchange, exchangeFullName: exchange, currency: "USD" }));

const sampleStocks = [
  {
    ticker: "AAPL",
    name: "Apple",
    price: 188.5,
    target: 220,
    pe: 28.4,
    growth: 8.2,
    shares: 10,
    cost: 172,
    thesis: "高质量现金流，关注服务收入增长和硬件换机周期。",
  },
  {
    ticker: "600519",
    name: "贵州茅台",
    price: 1468,
    target: 1680,
    pe: 23.1,
    growth: 15.4,
    shares: 2,
    cost: 1520,
    thesis: "品牌壁垒强，关注渠道库存和消费需求变化。",
  },
  {
    ticker: "MSFT",
    name: "Microsoft",
    price: 446.2,
    target: 510,
    pe: 35.6,
    growth: 13.1,
    shares: 5,
    cost: 390,
    thesis: "云业务和 AI 工具化能力强，估值需要盈利兑现支撑。",
  },
];

const state = {
  view: "dashboard",
  stocks: loadStocks(),
  maxWeight: 25,
  marginSafety: 20,
  isRefreshing: false,
  isSearching: false,
  searchResults: [],
  statusMessage: "已连接 FMP 数据源。",
  settings: loadSettings(),
};

const els = {
  rows: document.querySelector("#stockRows"),
  template: document.querySelector("#rowTemplate"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  riskFilter: document.querySelector("#riskFilter"),
  viewTitle: document.querySelector("#viewTitle"),
  tableTitle: document.querySelector("#tableTitle"),
  portfolioValue: document.querySelector("#portfolioValue"),
  portfolioPnl: document.querySelector("#portfolioPnl"),
  watchCount: document.querySelector("#watchCount"),
  undervaluedCount: document.querySelector("#undervaluedCount"),
  maxWeight: document.querySelector("#maxWeight"),
  marginSafety: document.querySelector("#marginSafety"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  saveApiKeyBtn: document.querySelector("#saveApiKeyBtn"),
  clearApiKeyBtn: document.querySelector("#clearApiKeyBtn"),
  openSearchBtn: document.querySelector("#openSearchBtn"),
  closeSearchBtn: document.querySelector("#closeSearchBtn"),
  searchPanel: document.querySelector("#searchPanel"),
  symbolSearchForm: document.querySelector("#symbolSearchForm"),
  symbolSearchInput: document.querySelector("#symbolSearchInput"),
  searchResults: document.querySelector("#searchResults"),
  searchResultTemplate: document.querySelector("#searchResultTemplate"),
  refreshBtn: document.querySelector("#refreshBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  dataStatus: document.querySelector("#dataStatus"),
  lastUpdated: document.querySelector("#lastUpdated"),
  bestCandidate: document.querySelector("#bestCandidate"),
  avgUpside: document.querySelector("#avgUpside"),
  highRiskCount: document.querySelector("#highRiskCount"),
  topWeight: document.querySelector("#topWeight"),
  analysisSummary: document.querySelector("#analysisSummary"),
  analysisList: document.querySelector("#analysisList"),
};

function loadStocks() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return sampleStocks;

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : sampleStocks;
  } catch {
    return sampleStocks;
  }
}

function loadSettings() {
  const saved = localStorage.getItem(settingsKey);
  const fallback = { lastUpdated: "" };

  try {
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

function saveStocks() {
  localStorage.setItem(storageKey, JSON.stringify(state.stocks));
}

function saveSettings() {
  localStorage.setItem(settingsKey, JSON.stringify(state.settings));
}

function getCacheKey(path, params = {}) {
  const sortedParams = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return `${path}?${JSON.stringify(sortedParams)}`;
}

function loadApiCache() {
  try {
    return JSON.parse(localStorage.getItem(apiCacheKey) || "{}");
  } catch {
    return {};
  }
}

function readApiCache(path, params, ttlMs) {
  const cache = loadApiCache();
  const key = getCacheKey(path, params);
  const entry = cache[key];
  if (!entry || Date.now() - entry.savedAt > ttlMs) return null;
  return entry.data;
}

function writeApiCache(path, params, data) {
  const cache = loadApiCache();
  cache[getCacheKey(path, params)] = {
    data,
    savedAt: Date.now(),
  };
  localStorage.setItem(apiCacheKey, JSON.stringify(cache));
}

function money(value) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function number(value, digits = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "-";
}

function percent(value, digits = 2) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(digits)}%` : "-";
}

function presentNumber(value, digits = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric !== 0 ? numeric.toFixed(digits) : "-";
}

function presentPercent(value, digits = 1) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric !== 0 ? `${numeric.toFixed(digits)}%` : "-";
}

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function pickNumber(source, keys) {
  if (!source) return null;
  for (const key of keys) {
    const value = numeric(source[key]);
    if (value !== null) return value;
  }
  return null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function scale(value, low, high, invert = false) {
  const parsed = numeric(value);
  if (parsed === null) return null;
  const score = clamp(((parsed - low) / (high - low)) * 100);
  return invert ? 100 - score : score;
}

function getApiKey() {
  return localStorage.getItem(apiKeyStorageKey) || window.FMP_CONFIG?.apiKey || "";
}

function renderApiKeyState() {
  if (!els.apiKeyInput) return;
  const hasStoredKey = Boolean(localStorage.getItem(apiKeyStorageKey));
  const hasConfigKey = Boolean(window.FMP_CONFIG?.apiKey);
  els.apiKeyInput.placeholder = hasStoredKey
    ? "已保存到本浏览器"
    : hasConfigKey
      ? "正在使用本地配置"
      : "本地保存，不提交到 GitHub";
}

function normalizeSymbol(ticker) {
  const value = ticker.trim().toUpperCase();
  if (/^\d{6}$/.test(value)) {
    if (value.startsWith("6")) return `${value}.SS`;
    if (value.startsWith("0") || value.startsWith("3")) return `${value}.SZ`;
    if (value.startsWith("4") || value.startsWith("8")) return `${value}.BJ`;
  }
  return value;
}

function fmpUrl(path, params = {}) {
  const url = new URL(`${fmpBaseUrl}/${path}`);
  url.searchParams.set("apikey", getApiKey());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url;
}

async function fetchJson(path, params, options = {}) {
  const ttlMs = options.ttlMs ?? 10 * 60 * 1000;
  const cached = readApiCache(path, params, ttlMs);
  if (cached) return cached;

  const response = await fetch(fmpUrl(path, params));
  if (!response.ok) {
    let detail = "";
    try {
      const errorBody = await response.json();
      detail = errorBody["Error Message"] || errorBody.message || "";
    } catch {
      detail = "";
    }

    if (response.status === 429) {
      throw new Error("FMP 请求额度已用完，请稍后再试");
    }
    if (response.status === 402 || response.status === 403) {
      throw new Error("当前 FMP 套餐无权访问该数据");
    }
    throw new Error(detail || `FMP 请求失败：${response.status}`);
  }
  const data = await response.json();
  writeApiCache(path, params, data);
  return data;
}

function looksLikeTicker(query) {
  return /^[A-Za-z0-9.-]{1,12}$/.test(query.trim());
}

function localSearchSymbols(query) {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  const matches = fallbackSearchUniverse.filter(
    (item) => item.symbol.toLowerCase().includes(term) || item.name.toLowerCase().includes(term),
  );

  if (!matches.length && looksLikeTicker(query)) {
    return [
      {
        symbol: query.trim().toUpperCase(),
        name: `${query.trim().toUpperCase()}（待 FMP 刷新）`,
        exchange: "待确认",
        exchangeFullName: "FMP 限流时直接加入",
        currency: "",
      },
    ];
  }

  return matches;
}

function getUpside(stock) {
  if (!Number(stock.target) || !Number(stock.price)) return null;
  return ((stock.target - stock.price) / stock.price) * 100;
}

function getRisk(stock) {
  const riskScore = getStockFactors(stock).riskScore;
  if (riskScore >= 70) return "高";
  if (riskScore >= 45) return "中";
  return "低";
}

function getViewStocks() {
  const term = els.search.value.trim().toLowerCase();
  const risk = els.riskFilter.value;

  return state.stocks.filter((stock) => {
    const hasHolding = Number(stock.shares) > 0;
    const matchesView =
      state.view === "dashboard" ||
      (state.view === "portfolio" && hasHolding) ||
      (state.view === "watchlist" && !hasHolding);
    const matchesSearch =
      !term ||
      stock.ticker.toLowerCase().includes(term) ||
      stock.name.toLowerCase().includes(term);
    const matchesRisk = risk === "all" || getRisk(stock) === risk;
    return matchesView && matchesSearch && matchesRisk;
  });
}

function renderMetrics() {
  const portfolioValue = state.stocks.reduce(
    (sum, stock) => sum + (Number(stock.price) || 0) * (Number(stock.shares) || 0),
    0,
  );
  const portfolioCost = state.stocks.reduce(
    (sum, stock) => sum + (Number(stock.cost) || 0) * (Number(stock.shares) || 0),
    0,
  );
  const undervalued = state.stocks.filter((stock) => {
    const upside = getUpside(stock);
    return upside !== null && upside >= state.marginSafety && getRisk(stock) !== "高";
  });

  els.portfolioValue.textContent = money(portfolioValue);
  els.portfolioPnl.textContent = money(portfolioValue - portfolioCost);
  els.portfolioPnl.style.color = portfolioValue - portfolioCost >= 0 ? "var(--accent)" : "var(--red)";
  els.watchCount.textContent = state.stocks.length;
  els.undervaluedCount.textContent = undervalued.length;
}

function renderStatus(message) {
  els.dataStatus.textContent = message;
  els.lastUpdated.textContent = state.settings.lastUpdated
    ? `最近刷新 ${new Date(state.settings.lastUpdated).toLocaleString("zh-CN")}`
    : "尚未刷新";
  els.refreshBtn.disabled = state.isRefreshing;
  els.refreshBtn.textContent = state.isRefreshing ? "刷新中..." : "刷新数据";
}

function renderSearchResults() {
  els.searchResults.innerHTML = "";

  if (state.isSearching) {
    els.searchResults.innerHTML = '<p class="empty-state">正在搜索 FMP 股票库。</p>';
    return;
  }

  if (!state.searchResults.length) {
    els.searchResults.innerHTML = '<p class="empty-state">输入代码或名称后开始搜索。</p>';
    return;
  }

  state.searchResults.forEach((result) => {
    const item = els.searchResultTemplate.content.firstElementChild.cloneNode(true);
    const alreadyAdded = state.stocks.some((stock) => normalizeSymbol(stock.ticker) === result.symbol);

    item.querySelector(".result-symbol").textContent = result.symbol;
    item.querySelector(".result-name").textContent = result.name || "未命名股票";
    item.querySelector(".result-meta").textContent = [result.exchange, result.exchangeFullName, result.currency]
      .filter(Boolean)
      .join(" · ");

    const button = item.querySelector(".add-result");
    button.textContent = alreadyAdded ? "已添加" : "加入";
    button.disabled = alreadyAdded;
    button.classList.toggle("added", alreadyAdded);
    button.addEventListener("click", () => addSearchResult(result));

    els.searchResults.append(item);
  });
}

function averageScores(scores) {
  const clean = scores.filter((score) => score !== null && Number.isFinite(score));
  if (!clean.length) return null;
  return clean.reduce((sum, score) => sum + score, 0) / clean.length;
}

function weightedAverageScores(items) {
  const clean = items.filter((item) => item.score !== null && Number.isFinite(item.score) && item.weight > 0);
  const totalWeight = clean.reduce((sum, item) => sum + item.weight, 0);
  if (!clean.length || totalWeight <= 0) return null;
  return clean.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight;
}

function getStockFactors(stock, portfolioValue = 0) {
  const metrics = stock.metrics || {};
  const upside = getUpside(stock);
  const pe = numeric(stock.pe) || numeric(metrics.pe);
  const evToSales = numeric(metrics.evToSales);
  const evToFcf = numeric(metrics.evToFcf);
  const fcfYield = numeric(metrics.fcfYield);
  const earningsYield = numeric(metrics.earningsYield);
  const revenueGrowth = numeric(metrics.revenueGrowth) || (numeric(stock.growth) ? numeric(stock.growth) / 100 : null);
  const netIncomeGrowth = numeric(metrics.netIncomeGrowth);
  const fcfGrowth = numeric(metrics.fcfGrowth);
  const epsGrowth = numeric(metrics.epsGrowth);
  const grossMargin = numeric(metrics.grossMargin);
  const operatingMargin = numeric(metrics.operatingMargin);
  const netMargin = numeric(metrics.netMargin);
  const roe = numeric(metrics.roe);
  const roic = numeric(metrics.roic);
  const incomeQuality = numeric(metrics.incomeQuality);
  const debtToEquity = numeric(metrics.debtToEquity);
  const currentRatio = numeric(metrics.currentRatio);
  const altmanZ = numeric(metrics.altmanZ);
  const piotroski = numeric(metrics.piotroski);
  const beta = numeric(metrics.beta);
  const change = numeric(stock.changePercent);
  const price = numeric(stock.price) || null;
  const priceAvg50 = numeric(metrics.priceAvg50);
  const priceAvg200 = numeric(metrics.priceAvg200);
  const yearHigh = numeric(metrics.yearHigh);
  const volume = numeric(metrics.volume);
  const avgVolume = numeric(metrics.avgVolume);
  const holdingValue = (Number(stock.price) || 0) * (Number(stock.shares) || 0);
  const weight = portfolioValue > 0 ? (holdingValue / portfolioValue) * 100 : 0;

  const valuation = averageScores([
    scale(pe, 10, 55, true),
    scale(evToSales, 2, 18, true),
    scale(evToFcf, 12, 70, true),
    scale(fcfYield, 0.01, 0.08),
    scale(earningsYield, 0.01, 0.08),
    upside === null ? null : scale(upside, -25, 35),
  ]);

  const growth = averageScores([
    scale(revenueGrowth, -0.08, 0.3),
    scale(netIncomeGrowth, -0.15, 0.4),
    scale(fcfGrowth, -0.2, 0.45),
    scale(epsGrowth, -0.15, 0.4),
  ]);

  const quality = averageScores([
    scale(grossMargin, 0.25, 0.75),
    scale(operatingMargin, 0.08, 0.4),
    scale(netMargin, 0.05, 0.3),
    scale(roe, 0.08, 0.45),
    scale(roic, 0.06, 0.3),
    scale(incomeQuality, 0.75, 1.35),
  ]);

  const financialHealth = averageScores([
    scale(currentRatio, 0.8, 2.5),
    scale(debtToEquity, 0, 2.5, true),
    scale(altmanZ, 1.8, 6),
    piotroski === null ? null : scale(piotroski, 3, 9),
  ]);

  const momentum = averageScores([
    scale(change, -6, 6),
    price && priceAvg50 ? scale((price - priceAvg50) / priceAvg50, -0.15, 0.18) : null,
    price && priceAvg200 ? scale((price - priceAvg200) / priceAvg200, -0.25, 0.35) : null,
    price && yearHigh ? scale(price / yearHigh, 0.55, 1.05) : null,
  ]);

  const analyst = averageScores([
    upside === null ? null : scale(upside, -20, 35),
    scale(metrics.analystRevenueUpside, -0.08, 0.18),
    scale(metrics.analystEpsGrowth, -0.1, 0.25),
  ]);

  const liquidity = averageScores([
    scale(metrics.marketCap, 1_000_000_000, 300_000_000_000),
    avgVolume ? scale(avgVolume, 500_000, 20_000_000) : volume ? scale(volume, 500_000, 20_000_000) : null,
  ]);

  const factorAvailability = [
    valuation,
    growth,
    quality,
    financialHealth,
    momentum,
    analyst,
    liquidity,
  ].filter((value) => value !== null && Number.isFinite(value)).length;
  const confidence = Math.round(clamp((factorAvailability / 7) * 100));
  const baseScore = weightedAverageScores([
    { score: valuation, weight: 0.2 },
    { score: growth, weight: 0.18 },
    { score: quality, weight: 0.22 },
    { score: financialHealth, weight: 0.14 },
    { score: momentum, weight: 0.1 },
    { score: analyst, weight: 0.1 },
    { score: liquidity, weight: 0.06 },
  ]);
  const weightedScore = baseScore === null ? 50 : baseScore;
  const concentrationPenalty = weight > state.maxWeight ? (weight - state.maxWeight) * 1.3 : 0;
  const dataPenalty = confidence < 45 ? 3 : 0;
  const score = Math.round(clamp(weightedScore - concentrationPenalty - dataPenalty));

  const riskDrivers = [];
  let riskScore = 12;
  if (valuation !== null && valuation < 30) {
    riskScore += 16;
    riskDrivers.push("估值偏贵");
  }
  if (growth !== null && growth < 30) {
    riskScore += 14;
    riskDrivers.push("增长走弱");
  }
  if (financialHealth !== null && financialHealth < 35) {
    riskScore += 18;
    riskDrivers.push("财务安全边际不足");
  }
  if (quality !== null && quality < 30) {
    riskScore += 14;
    riskDrivers.push("盈利质量偏弱");
  }
  if (momentum !== null && momentum < 25) {
    riskScore += 10;
    riskDrivers.push("价格趋势偏弱");
  }
  if (upside !== null && upside < -5) {
    riskScore += 12;
    riskDrivers.push("低于分析师目标空间");
  }
  if (beta !== null && beta > 1.5) {
    riskScore += 6;
    riskDrivers.push("波动率较高");
  }
  if (weight > state.maxWeight) {
    riskScore += 14;
    riskDrivers.push("仓位集中");
  }
  if (confidence < 50) {
    riskScore += 6;
    riskDrivers.push("数据覆盖不足");
  }
  if (growth !== null && growth >= 70) riskScore -= 8;
  if (quality !== null && quality >= 70) riskScore -= 8;
  if (financialHealth !== null && financialHealth >= 70) riskScore -= 6;

  return {
    score,
    riskScore: Math.round(clamp(riskScore)),
    confidence,
    valuation: Math.round(valuation ?? 50),
    growth: Math.round(growth ?? 50),
    quality: Math.round(quality ?? 50),
    financialHealth: Math.round(financialHealth ?? 50),
    momentum: Math.round(momentum ?? 50),
    analyst: Math.round(analyst ?? 50),
    liquidity: Math.round(liquidity ?? 50),
    riskDrivers,
    weight,
  };
}

function getAnalysisItems() {
  const portfolioValue = state.stocks.reduce(
    (sum, stock) => sum + (Number(stock.price) || 0) * (Number(stock.shares) || 0),
    0,
  );

  return state.stocks
    .map((stock) => {
      const value = (Number(stock.price) || 0) * (Number(stock.shares) || 0);
      const factors = getStockFactors(stock, portfolioValue);
      return {
        stock,
        factors,
        upside: getUpside(stock),
        risk: factors.riskScore >= 70 ? "高" : factors.riskScore >= 45 ? "中" : "低",
        weight: portfolioValue > 0 ? (value / portfolioValue) * 100 : 0,
      };
    })
    .sort((a, b) => b.factors.score - a.factors.score);
}

function renderAnalysis() {
  const items = getAnalysisItems();
  const stocksWithUpside = items.filter((item) => item.upside !== null);
  const highRisk = items.filter((item) => item.risk === "高");
  const topHolding = items.reduce((top, item) => (item.weight > (top?.weight || 0) ? item : top), null);
  const avgUpside =
    stocksWithUpside.length > 0
      ? stocksWithUpside.reduce((sum, item) => sum + item.upside, 0) / stocksWithUpside.length
      : null;

  els.bestCandidate.textContent = items[0]?.stock.ticker || "-";
  els.avgUpside.textContent = avgUpside === null ? "-" : percent(avgUpside);
  els.highRiskCount.textContent = highRisk.length;
  els.topWeight.textContent = topHolding && topHolding.weight > 0 ? `${topHolding.stock.ticker} ${percent(topHolding.weight, 1)}` : "-";

  if (!items.length) {
    els.analysisSummary.textContent = "股票池为空。点击右上角“搜索股票”添加标的后再分析。";
    els.analysisList.innerHTML = '<p class="empty-state">暂无股票可分析。</p>';
    return;
  }

  const best = items[0];
  const overWeight = items.find((item) => item.weight > state.maxWeight);
  const undervalued = items.filter((item) => item.upside !== null && item.upside >= state.marginSafety && item.risk !== "高");
  const summary = [];

  summary.push(`${best.stock.name} 当前综合评分最高，评分来自估值、成长、盈利质量、财务安全、动量、分析师预期和流动性。`);
  if (undervalued.length) summary.push(`${undervalued.length} 只股票达到安全边际，可优先复核基本面。`);
  if (highRisk.length) summary.push(`${highRisk.length} 只股票处于高风险，需要检查主要风险来源，而不是只看 PE。`);
  if (overWeight) summary.push(`${overWeight.stock.ticker} 仓位超过单股上限，注意组合集中度。`);

  els.analysisSummary.textContent = summary.join(" ");
  els.analysisList.innerHTML = "";

  items.slice(0, 6).forEach((item) => {
    const row = document.createElement("article");
    const info = document.createElement("div");
    const ticker = document.createElement("strong");
    const name = document.createElement("span");
    const score = document.createElement("div");
    const scoreValue = document.createElement("strong");
    const scoreMeta = document.createElement("span");

    row.className = "analysis-row";
    score.className = "analysis-score";
    ticker.textContent = item.stock.ticker;
    name.textContent = item.stock.name;
    scoreValue.textContent = item.factors.score;
    scoreMeta.textContent = `${item.risk}风险 · 置信度 ${item.factors.confidence}`;

    const factorLine = document.createElement("p");
    const riskLine = document.createElement("p");
    factorLine.className = "factor-line";
    riskLine.className = "risk-line";
    factorLine.textContent = `估值 ${item.factors.valuation} · 成长 ${item.factors.growth} · 质量 ${item.factors.quality} · 财务 ${item.factors.financialHealth} · 动量 ${item.factors.momentum}`;
    riskLine.textContent = item.factors.riskDrivers.length
      ? `风险来源：${item.factors.riskDrivers.slice(0, 3).join("、")}`
      : "风险来源：未发现突出单项风险";

    info.append(ticker, name, factorLine, riskLine);
    score.append(scoreValue, scoreMeta);
    row.append(info, score);
    els.analysisList.append(row);
  });
}

function renderRows() {
  const stocks = getViewStocks();
  els.rows.innerHTML = "";
  els.empty.hidden = stocks.length > 0;

  stocks.forEach((stock) => {
    const row = els.template.content.firstElementChild.cloneNode(true);
    const upside = getUpside(stock);
    const risk = getRisk(stock);
    const value = (Number(stock.price) || 0) * (Number(stock.shares) || 0);
    const change = Number(stock.changePercent);

    row.querySelector(".stock-name").textContent = stock.name;
    row.querySelector(".stock-ticker").textContent = stock.fmpSymbol
      ? `${stock.ticker} · ${stock.fmpSymbol}`
      : stock.ticker;
    row.querySelector(".stock-thesis").textContent = stock.thesis || "未填写投资逻辑";
    const factors = getStockFactors(stock);
    const priceText = Number(stock.price) ? money(stock.price) : "待刷新";
    row.querySelector(".price-cell").innerHTML = `${priceText}<span>${
      stock.syncError ? stock.syncError : stock.dataSource || stock.exchange || "本地"
    }</span>`;
    const metrics = stock.metrics || {};
    const valuationParts = [
      `PE ${presentNumber(stock.pe)}`,
      `收入 ${presentPercent(stock.growth)}`,
      `ROE ${metrics.roe === null || metrics.roe === undefined ? "-" : percent(metrics.roe * 100, 1)}`,
      `D/E ${presentNumber(metrics.debtToEquity)}`,
      `完整度 ${factors.confidence}`,
    ];
    row.querySelector(".valuation-cell").textContent = valuationParts.join(" · ");
    row.querySelector(".holding-cell").textContent =
      Number(stock.shares) > 0 ? `${stock.shares} 股 · ${money(value)}` : "未持仓";

    const changeCell = row.querySelector(".change-cell");
    changeCell.textContent = Number.isFinite(change) ? percent(change) : "-";
    changeCell.classList.toggle("positive", change > 0);
    changeCell.classList.toggle("negative", change < 0);

    const upsidePill = row.querySelector(".upside-pill");
    upsidePill.textContent = upside === null ? "未设目标" : `${number(upside)}%`;
    upsidePill.classList.add(upside === null || upside < 0 ? "bad" : upside < state.marginSafety ? "warn" : "good");

    const riskPill = row.querySelector(".risk-pill");
    riskPill.textContent = risk;
    riskPill.classList.add(risk === "低" ? "low" : risk === "中" ? "mid" : "high");

    row.querySelector(".delete-row").addEventListener("click", () => deleteStock(stock.ticker));
    els.rows.append(row);
  });
}

function renderView() {
  const titles = {
    dashboard: ["投资总览", "全部股票"],
    watchlist: ["观察列表", "未持仓股票"],
    portfolio: ["持仓组合", "已有持仓"],
  };
  const [viewTitle, tableTitle] = titles[state.view];
  els.viewTitle.textContent = viewTitle;
  els.tableTitle.textContent = tableTitle;

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });

  renderMetrics();
  renderAnalysis();
  renderRows();
  renderSearchResults();
  renderApiKeyState();
  renderStatus(state.isRefreshing ? "正在从 FMP 获取真实行情和财务数据。" : state.statusMessage);
}

function deleteStock(ticker) {
  state.stocks = state.stocks.filter((stock) => stock.ticker !== ticker);
  saveStocks();
  renderView();
}

function downloadData() {
  const blob = new Blob([JSON.stringify(state.stocks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `investment-workbench-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function stockFromSearchResult(result) {
  return {
    ticker: result.symbol,
    fmpSymbol: result.symbol,
    name: result.name || result.symbol,
    price: null,
    target: null,
    pe: null,
    growth: null,
    shares: 0,
    cost: null,
    exchange: result.exchange || "",
    thesis: "",
  };
}

function applyQuote(stock, quote) {
  if (!quote) return stock;

  return {
    ...stock,
    fmpSymbol: quote.symbol || stock.fmpSymbol || normalizeSymbol(stock.ticker),
    name: quote.name || stock.name,
    price: Number(quote.price) || stock.price,
    change: Number(quote.change) || 0,
    changePercent: Number(quote.changesPercentage) || Number(quote.changePercentage) || 0,
    exchange: quote.exchangeShortName || quote.exchange || stock.exchange || "",
    marketCap: Number(quote.marketCap) || stock.marketCap || 0,
    metrics: {
      ...(stock.metrics || {}),
      marketCap: Number(quote.marketCap) || stock.metrics?.marketCap || 0,
      volume: Number(quote.volume) || stock.metrics?.volume || 0,
      priceAvg50: Number(quote.priceAvg50) || stock.metrics?.priceAvg50 || 0,
      priceAvg200: Number(quote.priceAvg200) || stock.metrics?.priceAvg200 || 0,
      yearHigh: Number(quote.yearHigh) || stock.metrics?.yearHigh || 0,
      yearLow: Number(quote.yearLow) || stock.metrics?.yearLow || 0,
      previousClose: Number(quote.previousClose) || stock.metrics?.previousClose || 0,
    },
    dataSource: "FMP Quote",
    lastSyncedAt: new Date().toISOString(),
    syncError: "",
  };
}

function applyProfile(stock, profile) {
  if (!profile) return stock;

  return {
    ...stock,
    fmpSymbol: profile.symbol || stock.fmpSymbol || normalizeSymbol(stock.ticker),
    name: profile.companyName || profile.name || stock.name,
    price: Number(profile.price) || stock.price,
    change: Number(profile.change) || 0,
    changePercent: Number(profile.changePercentage) || Number(profile.changesPercentage) || 0,
    exchange: profile.exchange || profile.exchangeShortName || stock.exchange || "",
    marketCap: Number(profile.marketCap) || stock.marketCap || 0,
    sector: profile.sector || stock.sector || "",
    industry: profile.industry || stock.industry || "",
    currency: profile.currency || stock.currency || "",
    metrics: {
      ...(stock.metrics || {}),
      marketCap: Number(profile.marketCap) || stock.metrics?.marketCap || 0,
      beta: Number(profile.beta) || stock.metrics?.beta || 0,
      avgVolume: Number(profile.averageVolume) || stock.metrics?.avgVolume || 0,
      dividendYield: Number(profile.lastDividend) || stock.metrics?.dividendYield || 0,
    },
    dataSource: "FMP Profile",
    lastSyncedAt: new Date().toISOString(),
    syncError: "",
  };
}

async function fetchQuoteWithProfileFallback(symbol) {
  try {
    const quotes = await fetchJson("quote", { symbol }, { ttlMs: 2 * 60 * 1000 });
    const quote = Array.isArray(quotes) ? quotes[0] : quotes;
    if (quote) return { data: quote, source: "quote" };
  } catch (error) {
    if (error.message.includes("请求额度已用完")) throw error;
    // Some symbols are blocked on quote for this plan but still expose price in profile.
  }

  const profiles = await fetchJson("profile", { symbol }, { ttlMs: 24 * 60 * 60 * 1000 });
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!profile) throw new Error("FMP 未返回价格数据");
  return { data: profile, source: "profile" };
}

function applyRatios(stock, ratios) {
  if (!ratios) return stock;

  const metrics = {
    ...(stock.metrics || {}),
    pe: pickNumber(ratios, ["priceToEarningsRatioTTM", "peRatioTTM"]),
    roe: pickNumber(ratios, ["returnOnEquityTTM", "returnOnTangibleAssetsTTM"]),
    roic: pickNumber(ratios, ["returnOnInvestedCapitalTTM"]),
    grossMargin: pickNumber(ratios, ["grossProfitMarginTTM", "grossMarginTTM"]),
    operatingMargin: pickNumber(ratios, ["operatingProfitMarginTTM", "operatingMarginTTM"]),
    netMargin: pickNumber(ratios, ["netProfitMarginTTM", "bottomLineProfitMarginTTM"]),
    debtToEquity: pickNumber(ratios, ["debtToEquityRatioTTM"]),
    currentRatio: pickNumber(ratios, ["currentRatioTTM"]),
    enterpriseValueMultiple: pickNumber(ratios, ["enterpriseValueMultipleTTM"]),
  };

  return {
    ...stock,
    pe: metrics.pe || stock.pe,
    metrics,
  };
}

function applyKeyMetrics(stock, metrics) {
  if (!metrics) return stock;

  return {
    ...stock,
    metrics: {
      ...(stock.metrics || {}),
      evToSales: pickNumber(metrics, ["evToSalesTTM"]),
      evToFcf: pickNumber(metrics, ["evToFreeCashFlowTTM"]),
      fcfYield: pickNumber(metrics, ["freeCashFlowYieldTTM"]),
      earningsYield: pickNumber(metrics, ["earningsYieldTTM"]),
      incomeQuality: pickNumber(metrics, ["incomeQualityTTM"]),
      marketCap: pickNumber(metrics, ["marketCap"]) || stock.metrics?.marketCap || 0,
    },
  };
}

function applyFinancialScores(stock, scores) {
  if (!scores) return stock;

  return {
    ...stock,
    metrics: {
      ...(stock.metrics || {}),
      altmanZ: pickNumber(scores, ["altmanZScore"]),
      piotroski: pickNumber(scores, ["piotroskiScore"]),
    },
  };
}

function applyGrowth(stock, growth, type = "income") {
  if (!growth) return stock;

  const nextMetrics = { ...(stock.metrics || {}) };
  if (type === "income") {
    nextMetrics.revenueGrowth = pickNumber(growth, ["growthRevenue", "revenueGrowth"]);
    nextMetrics.netIncomeGrowth = pickNumber(growth, ["growthNetIncome"]);
    nextMetrics.epsGrowth = pickNumber(growth, ["growthEPS", "growthEPSDiluted"]);
  }
  if (type === "balance") {
    nextMetrics.netDebtGrowth = pickNumber(growth, ["growthNetDebt"]);
    nextMetrics.cashGrowth = pickNumber(growth, ["growthCashAndCashEquivalents", "growthCashAndShortTermInvestments"]);
  }
  if (type === "cashflow") {
    nextMetrics.fcfGrowth = pickNumber(growth, ["growthFreeCashFlow"]);
    nextMetrics.operatingCashFlowGrowth = pickNumber(growth, ["growthNetCashProvidedByOperatingActivites"]);
  }

  return {
    ...stock,
    growth: (nextMetrics.revenueGrowth || 0) * 100 || stock.growth,
    metrics: nextMetrics,
  };
}

function applyPriceTarget(stock, target) {
  if (!target) return stock;

  return {
    ...stock,
    target:
      Number(target.targetConsensus) ||
      Number(target.targetMedian) ||
      Number(target.priceTargetAverage) ||
      stock.target,
    metrics: {
      ...(stock.metrics || {}),
      targetHigh: pickNumber(target, ["targetHigh"]),
      targetLow: pickNumber(target, ["targetLow"]),
      targetMedian: pickNumber(target, ["targetMedian"]),
    },
  };
}

function applyAnalystEstimates(stock, estimates) {
  if (!estimates) return stock;
  const revenueAvg = pickNumber(estimates, ["revenueAvg"]);
  const revenueHigh = pickNumber(estimates, ["revenueHigh"]);
  const epsAvg = pickNumber(estimates, ["epsAvg"]);
  const epsHigh = pickNumber(estimates, ["epsHigh"]);

  return {
    ...stock,
    metrics: {
      ...(stock.metrics || {}),
      analystRevenueUpside: revenueAvg ? ((revenueHigh || revenueAvg) - revenueAvg) / revenueAvg : null,
      analystEpsGrowth: epsAvg ? ((epsHigh || epsAvg) - epsAvg) / Math.abs(epsAvg) : null,
      analystCountEps: pickNumber(estimates, ["numAnalystsEps"]),
      analystCountRevenue: pickNumber(estimates, ["numAnalystsRevenue"]),
    },
  };
}

async function refreshQuotes() {
  const results = await Promise.all(
    state.stocks.map(async (stock) => {
      const symbol = normalizeSymbol(stock.ticker);
      try {
        const result = await fetchQuoteWithProfileFallback(symbol);
        return result.source === "profile" ? applyProfile(stock, result.data) : applyQuote(stock, result.data);
      } catch (error) {
        return {
          ...stock,
          fmpSymbol: symbol,
          syncError: error.message,
        };
      }
    }),
  );
  const failures = results.filter((stock) => stock.syncError).length;
  state.stocks = results;
  return failures;
}

async function refreshOneStock(stock) {
  const symbol = normalizeSymbol(stock.ticker);
  const result = await fetchQuoteWithProfileFallback(symbol);
  return result.source === "profile" ? applyProfile(stock, result.data) : applyQuote(stock, result.data);
}

async function refreshFundamentals() {
  const jobs = state.stocks.map(async (stock) => {
    const symbol = normalizeSymbol(stock.ticker);
    const [profile, ratios, keyMetrics, scores, incomeGrowth, balanceGrowth, cashFlowGrowth, targets, estimates] =
      await Promise.allSettled([
        fetchJson("profile", { symbol }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("ratios-ttm", { symbol }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("key-metrics-ttm", { symbol }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("financial-scores", { symbol }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("income-statement-growth", { symbol, limit: 1 }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("balance-sheet-statement-growth", { symbol, limit: 1 }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("cash-flow-statement-growth", { symbol, limit: 1 }, { ttlMs: 24 * 60 * 60 * 1000 }),
        fetchJson("price-target-consensus", { symbol }, { ttlMs: 6 * 60 * 60 * 1000 }),
        fetchJson("analyst-estimates", { symbol, period: "annual", limit: 1 }, { ttlMs: 24 * 60 * 60 * 1000 }),
      ]);

    let nextStock = stock;
    if (profile.status === "fulfilled") nextStock = applyProfile(nextStock, profile.value?.[0]);
    if (ratios.status === "fulfilled") nextStock = applyRatios(nextStock, ratios.value?.[0]);
    if (keyMetrics.status === "fulfilled") nextStock = applyKeyMetrics(nextStock, keyMetrics.value?.[0]);
    if (scores.status === "fulfilled") nextStock = applyFinancialScores(nextStock, scores.value?.[0]);
    if (incomeGrowth.status === "fulfilled") nextStock = applyGrowth(nextStock, incomeGrowth.value?.[0], "income");
    if (balanceGrowth.status === "fulfilled") nextStock = applyGrowth(nextStock, balanceGrowth.value?.[0], "balance");
    if (cashFlowGrowth.status === "fulfilled") nextStock = applyGrowth(nextStock, cashFlowGrowth.value?.[0], "cashflow");
    if (targets.status === "fulfilled") nextStock = applyPriceTarget(nextStock, targets.value?.[0] || targets.value);
    if (estimates.status === "fulfilled") nextStock = applyAnalystEstimates(nextStock, estimates.value?.[0]);
    return nextStock;
  });

  state.stocks = await Promise.all(jobs);
}

async function refreshFmpData() {
  if (state.isRefreshing) return;
  if (!getApiKey()) {
    state.statusMessage = "缺少 FMP API key，无法刷新。";
    renderView();
    return;
  }

  state.isRefreshing = true;
  state.statusMessage = "正在从 FMP 获取真实行情和财务数据。";
  renderView();

  try {
    const quoteFailures = await refreshQuotes();
    if (quoteFailures === state.stocks.length && state.stocks.length > 0) {
      state.statusMessage = "FMP 请求额度已用完，已暂停财务数据同步。请稍后再刷新。";
      saveStocks();
      return;
    }
    state.statusMessage =
      quoteFailures > 0
        ? `行情部分更新，${quoteFailures} 只股票暂未获得 FMP 权限。`
        : "行情已更新，正在同步财务指标。";
    renderStatus(state.statusMessage);
    renderRows();
    renderMetrics();
    await refreshFundamentals();
    state.settings.lastUpdated = new Date().toISOString();
    saveStocks();
    saveSettings();
    state.statusMessage =
      quoteFailures > 0
        ? `FMP 刷新完成，${quoteFailures} 只股票保留本地数据。`
        : "FMP 真实数据刷新完成。";
  } catch (error) {
    state.statusMessage = `${error.message}，已保留本地数据。`;
  } finally {
    state.isRefreshing = false;
    renderView();
  }
}

async function searchSymbols(query) {
  const localMatches = localSearchSymbols(query);
  let combined = [];

  try {
    const symbolResults = await fetchJson("search-symbol", { query }, { ttlMs: 24 * 60 * 60 * 1000 });
    combined = Array.isArray(symbolResults) ? symbolResults : [];

    if (combined.length < 4 && !looksLikeTicker(query)) {
      const nameResults = await fetchJson("search-name", { query }, { ttlMs: 24 * 60 * 60 * 1000 });
      combined = [...combined, ...(Array.isArray(nameResults) ? nameResults : [])];
    }
  } catch (error) {
    if (localMatches.length) {
      state.statusMessage = `${error.message}，已显示本地兜底结果。`;
      return localMatches.slice(0, 12);
    }
    throw error;
  }

  combined = [...combined, ...localMatches];
  const unique = new Map();

  combined.forEach((result) => {
    if (!result.symbol || unique.has(result.symbol)) return;
    unique.set(result.symbol, result);
  });

  return [...unique.values()].slice(0, 12);
}

async function addSearchResult(result) {
  const ticker = result.symbol;
  if (state.stocks.some((stock) => normalizeSymbol(stock.ticker) === ticker)) return;

  let stock = stockFromSearchResult(result);
  try {
    stock = await refreshOneStock(stock);
    state.statusMessage = `${stock.name} 已加入股票池，并同步了 FMP 行情。`;
  } catch {
    state.statusMessage = `${stock.name} 已加入股票池，行情稍后可再刷新。`;
  }

  state.stocks.unshift(stock);
  saveStocks();
  renderView();
}

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    state.view = button.dataset.view;
    renderView();
  });
});

els.saveApiKeyBtn.addEventListener("click", () => {
  const key = els.apiKeyInput.value.trim();
  if (!key) {
    state.statusMessage = "请输入 FMP API key 后再保存。";
    renderView();
    return;
  }

  localStorage.setItem(apiKeyStorageKey, key);
  els.apiKeyInput.value = "";
  state.statusMessage = "FMP API key 已保存在本浏览器。";
  renderView();
});

els.clearApiKeyBtn.addEventListener("click", () => {
  localStorage.removeItem(apiKeyStorageKey);
  els.apiKeyInput.value = "";
  state.statusMessage = window.FMP_CONFIG?.apiKey ? "已清除浏览器保存的 key，改用本地配置。" : "已清除 FMP API key。";
  renderView();
});

els.openSearchBtn.addEventListener("click", () => {
  els.searchPanel.hidden = false;
  renderSearchResults();
  els.symbolSearchInput.focus();
});

els.closeSearchBtn.addEventListener("click", () => {
  els.searchPanel.hidden = true;
});

els.symbolSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = els.symbolSearchInput.value.trim();
  if (!query) return;

  state.isSearching = true;
  state.searchResults = [];
  state.statusMessage = "正在搜索 FMP 股票库。";
  renderSearchResults();

  try {
    state.searchResults = await searchSymbols(query);
    if (!state.statusMessage.includes("FMP 请求额度已用完")) {
      state.statusMessage = state.searchResults.length
        ? `找到 ${state.searchResults.length} 个匹配股票。`
        : "没有找到匹配股票。";
    }
  } catch (error) {
    state.searchResults = [];
    state.statusMessage = `${error.message}，搜索失败。`;
  } finally {
    state.isSearching = false;
    renderView();
  }
});

[els.search, els.riskFilter, els.maxWeight, els.marginSafety].forEach((element) => {
  element.addEventListener("input", () => {
    state.maxWeight = Number(els.maxWeight.value) || 25;
    state.marginSafety = Number(els.marginSafety.value) || 20;
    renderView();
  });
});

els.refreshBtn.addEventListener("click", refreshFmpData);
els.exportBtn.addEventListener("click", downloadData);

els.resetBtn.addEventListener("click", () => {
  if (!confirm("确定清空本地股票数据吗？")) return;
  state.stocks = [];
  localStorage.removeItem(storageKey);
  localStorage.removeItem(settingsKey);
  state.settings = loadSettings();
  renderView();
});

renderView();
