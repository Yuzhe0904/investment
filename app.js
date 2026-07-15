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
const highGrowthUniverse = [
  ["NVDA", "NVIDIA Corporation", "NASDAQ"],
  ["ANET", "Arista Networks, Inc.", "NYSE"],
  ["AVGO", "Broadcom Inc.", "NASDAQ"],
  ["ASML", "ASML Holding N.V.", "NASDAQ"],
  ["AMD", "Advanced Micro Devices, Inc.", "NASDAQ"],
  ["MSFT", "Microsoft Corporation", "NASDAQ"],
  ["META", "Meta Platforms, Inc.", "NASDAQ"],
  ["GOOGL", "Alphabet Inc.", "NASDAQ"],
  ["NFLX", "Netflix, Inc.", "NASDAQ"],
  ["TSLA", "Tesla, Inc.", "NASDAQ"],
  ["AMZN", "Amazon.com, Inc.", "NASDAQ"],
  ["NOW", "ServiceNow, Inc.", "NYSE"],
  ["CRWD", "CrowdStrike Holdings, Inc.", "NASDAQ"],
  ["PLTR", "Palantir Technologies Inc.", "NASDAQ"],
  ["APP", "AppLovin Corporation", "NASDAQ"],
  ["SNOW", "Snowflake Inc.", "NYSE"],
  ["DDOG", "Datadog, Inc.", "NASDAQ"],
  ["NET", "Cloudflare, Inc.", "NYSE"],
  ["PANW", "Palo Alto Networks, Inc.", "NASDAQ"],
  ["SHOP", "Shopify Inc.", "NYSE"],
  ["MELI", "MercadoLibre, Inc.", "NASDAQ"],
  ["UBER", "Uber Technologies, Inc.", "NYSE"],
  ["ARM", "Arm Holdings plc", "NASDAQ"],
  ["SMCI", "Super Micro Computer, Inc.", "NASDAQ"],
].map(([symbol, name, exchange]) => ({ symbol, name, exchange, exchangeFullName: exchange, currency: "USD" }));
const growthScreenerMinGrowth = 80;
const growthScreenerMaxGap = 15;

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
  isScreeningGrowth: false,
  isDetailLoading: false,
  selectedTicker: null,
  detailMessage: "选择股票后会显示实时分析。",
  searchResults: [],
  growthScreenerResults: [],
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
  runGrowthScreenerBtn: document.querySelector("#runGrowthScreenerBtn"),
  growthScreenerStatus: document.querySelector("#growthScreenerStatus"),
  growthScreenerCount: document.querySelector("#growthScreenerCount"),
  growthScreenerResults: document.querySelector("#growthScreenerResults"),
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
  stockDetailPanel: document.querySelector("#stockDetailPanel"),
  detailTitle: document.querySelector("#detailTitle"),
  detailMeta: document.querySelector("#detailMeta"),
  detailStatus: document.querySelector("#detailStatus"),
  detailPrice: document.querySelector("#detailPrice"),
  detailChange: document.querySelector("#detailChange"),
  detailUpside: document.querySelector("#detailUpside"),
  detailTarget: document.querySelector("#detailTarget"),
  detailRange: document.querySelector("#detailRange"),
  detailRangeMeta: document.querySelector("#detailRangeMeta"),
  detailVerdict: document.querySelector("#detailVerdict"),
  detailConfidence: document.querySelector("#detailConfidence"),
  detailFactors: document.querySelector("#detailFactors"),
  detailMetrics: document.querySelector("#detailMetrics"),
  detailPositives: document.querySelector("#detailPositives"),
  detailRisks: document.querySelector("#detailRisks"),
  detailAction: document.querySelector("#detailAction"),
  refreshDetailBtn: document.querySelector("#refreshDetailBtn"),
  closeDetailBtn: document.querySelector("#closeDetailBtn"),
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
  if (!options.force) {
    const cached = readApiCache(path, params, ttlMs);
    if (cached) return cached;
  }

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

function renderGrowthScreener() {
  els.runGrowthScreenerBtn.disabled = state.isScreeningGrowth;
  els.runGrowthScreenerBtn.textContent = state.isScreeningGrowth ? "筛选中..." : "运行筛选";
  els.growthScreenerStatus.textContent = state.isScreeningGrowth
    ? "正在读取候选股票数据并计算成长/综合评分。"
    : `筛选条件：成长分 > ${growthScreenerMinGrowth}，且综合评分与成长分差距 <= ${growthScreenerMaxGap}。`;
  els.growthScreenerCount.textContent = state.growthScreenerResults.length
    ? `${state.growthScreenerResults.length} 个候选`
    : "尚无结果";
  els.growthScreenerResults.innerHTML = "";

  if (state.isScreeningGrowth) {
    els.growthScreenerResults.innerHTML = '<p class="empty-state">正在筛选候选股票。</p>';
    return;
  }

  if (!state.growthScreenerResults.length) {
    els.growthScreenerResults.innerHTML = '<p class="empty-state">运行后会显示符合条件的高成长公司。</p>';
    return;
  }

  state.growthScreenerResults.forEach((item) => {
    const card = document.createElement("article");
    const details = document.createElement("div");
    const title = document.createElement("strong");
    const name = document.createElement("span");
    const meta = document.createElement("p");
    const scores = document.createElement("div");
    const score = document.createElement("strong");
    const button = document.createElement("button");
    const alreadyAdded = state.stocks.some((stock) => normalizeSymbol(stock.ticker) === item.stock.fmpSymbol);

    card.className = "screener-result";
    scores.className = "screener-score";
    button.className = alreadyAdded ? "ghost-button add-result added" : "primary-button add-result";
    button.type = "button";
    button.disabled = alreadyAdded;
    button.textContent = alreadyAdded ? "已添加" : "加入";
    button.addEventListener("click", () =>
      addSearchResult({
        symbol: item.stock.fmpSymbol || item.stock.ticker,
        name: item.stock.name,
        exchange: item.stock.exchange || "",
        exchangeFullName: item.stock.exchange || "",
        currency: item.stock.currency || "USD",
      }),
    );

    title.textContent = item.stock.fmpSymbol || item.stock.ticker;
    name.textContent = item.stock.name;
    meta.textContent = `成长 ${factorScoreText(item.factors.growth)} · 综合 ${item.factors.score} · 差距 ${item.gap} · 质量 ${factorScoreText(item.factors.quality)} · 财务 ${factorScoreText(item.factors.financialHealth)}`;
    score.textContent = item.factors.score;
    scores.append(score, button);
    details.append(title, name, meta);
    card.append(details, scores);
    els.growthScreenerResults.append(card);
  });
}

function averageScores(scores, minSamples = 1) {
  const clean = scores.filter((score) => score !== null && Number.isFinite(score));
  if (clean.length < minSamples) return null;
  return clean.reduce((sum, score) => sum + score, 0) / clean.length;
}

function factorScoreText(score) {
  return score === null || !Number.isFinite(score) ? "待补全" : score;
}

function fundamentalValue(stock, value, formatter) {
  const parsed = numeric(value);
  if (parsed === null) return stock.fundamentalStatus ? "未覆盖" : "-";
  return formatter(parsed);
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

  const qualityRawValues = [grossMargin, operatingMargin, netMargin, roe, roic]
    .filter((value) => value !== null);
  const quality = qualityRawValues.length >= 3 && qualityRawValues.every((value) => value === 0)
    ? null
    : averageScores([
    scale(grossMargin, 0.25, 0.75),
    scale(operatingMargin, 0.08, 0.4),
    scale(netMargin, 0.05, 0.3),
    scale(roe, 0.08, 0.45),
    scale(roic, 0.06, 0.3),
    ], 3);

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
    valuation: valuation === null ? null : Math.round(valuation),
    growth: growth === null ? null : Math.round(growth),
    quality: quality === null ? null : Math.round(quality),
    financialHealth: financialHealth === null ? null : Math.round(financialHealth),
    momentum: momentum === null ? null : Math.round(momentum),
    analyst: analyst === null ? null : Math.round(analyst),
    liquidity: liquidity === null ? null : Math.round(liquidity),
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
    factorLine.textContent = `估值 ${factorScoreText(item.factors.valuation)} · 成长 ${factorScoreText(item.factors.growth)} · 质量 ${factorScoreText(item.factors.quality)} · 财务 ${factorScoreText(item.factors.financialHealth)} · 动量 ${factorScoreText(item.factors.momentum)}`;
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
      `PE ${fundamentalValue(stock, stock.pe, (value) => number(value))}`,
      `收入 ${fundamentalValue(stock, stock.growth, (value) => percent(value))}`,
      `ROE ${fundamentalValue(stock, metrics.roe, (value) => percent(value * 100, 1))}`,
      `D/E ${fundamentalValue(stock, metrics.debtToEquity, (value) => number(value))}`,
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

    row.classList.add("stock-row");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `查看 ${stock.name} 的实时深度分析`);
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      openStockDetail(stock.ticker);
    });
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openStockDetail(stock.ticker);
      }
    });
    row.querySelector(".delete-row").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteStock(stock.ticker);
    });
    els.rows.append(row);
  });
}

function getStockCurrency(stock) {
  if (/^\d{6}$/.test(stock.ticker || "")) return "CNY";
  const currency = String(stock.currency || "USD").toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : "USD";
}

function stockMoney(stock, value, digits = 2) {
  const amount = numeric(value);
  if (amount === null) return "-";
  const currency = getStockCurrency(stock);
  return new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: digits,
  }).format(amount);
}

function compactStockMoney(stock, value) {
  const amount = numeric(value);
  if (amount === null || amount <= 0) return "-";
  const currency = getStockCurrency(stock);
  const symbol = new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value || `${currency} `;
  const units = [
    [1_000_000_000_000, "T"],
    [1_000_000_000, "B"],
    [1_000_000, "M"],
  ];
  const unit = units.find(([threshold]) => amount >= threshold);
  return unit ? `${symbol}${(amount / unit[0]).toFixed(amount / unit[0] >= 100 ? 0 : 1)}${unit[1]}` : stockMoney(stock, amount, 0);
}

function addDetailListItem(list, message) {
  const item = document.createElement("li");
  item.textContent = message;
  list.append(item);
}

function getDetailVerdict(factors) {
  if (factors.score >= 72 && factors.riskScore < 45) return "偏积极";
  if (factors.riskScore >= 70) return "风险优先";
  if (factors.score >= 60) return "谨慎积极";
  return "中性跟踪";
}

function getDetailAction(stock, factors) {
  const upside = getUpside(stock);
  if (factors.confidence < 50) return "关键财务字段覆盖不足。先刷新数据并核对最新财报，再基于评分作判断。";
  if (factors.riskScore >= 70) return "先复核风险来源及下一份财报，当前不宜仅凭短期价格变化加大敞口。";
  if (upside !== null && upside >= state.marginSafety && factors.score >= 65) {
    return `目标价空间超过设定的 ${state.marginSafety}% 安全边际；仍应结合仓位上限和财报兑现情况分步跟踪。`;
  }
  if (factors.momentum !== null && factors.momentum < 40) return "基本面之外，价格趋势偏弱。关注能否重新站上 50 日与 200 日均线，而不是急于追价。";
  return "持续跟踪收入、自由现金流与利润率的下一次披露，并把估值变化和实际业绩兑现放在一起判断。";
}

function renderStockDetail() {
  const stock = state.stocks.find((item) => item.ticker === state.selectedTicker);
  els.stockDetailPanel.hidden = !stock;
  if (!stock) return;

  const metrics = stock.metrics || {};
  const factors = getStockFactors(stock);
  const upside = getUpside(stock);
  const price = numeric(stock.price);
  const yearLow = numeric(metrics.yearLow);
  const yearHigh = numeric(metrics.yearHigh);
  const rangePosition = price !== null && yearLow !== null && yearHigh !== null && yearHigh > yearLow
    ? ((price - yearLow) / (yearHigh - yearLow)) * 100
    : null;
  const change = numeric(stock.changePercent);

  els.detailTitle.textContent = `${stock.name} (${stock.fmpSymbol || stock.ticker})`;
  els.detailMeta.textContent = [stock.exchange, stock.sector, stock.industry].filter(Boolean).join(" · ") || "市场与行业信息待同步";
  els.detailStatus.textContent = state.isDetailLoading ? "正在向 FMP 请求最新行情并更新分析..." : state.detailMessage;
  els.refreshDetailBtn.disabled = state.isDetailLoading;
  els.refreshDetailBtn.textContent = state.isDetailLoading ? "刷新中..." : "刷新分析";

  els.detailPrice.textContent = stockMoney(stock, price);
  els.detailChange.textContent = change === null ? "今日涨跌待同步" : `今日 ${percent(change)}${change >= 0 ? " 上涨" : " 下跌"}`;
  els.detailChange.className = `detail-change ${change > 0 ? "positive" : change < 0 ? "negative" : ""}`;
  els.detailUpside.textContent = upside === null ? "未覆盖" : percent(upside);
  els.detailTarget.textContent = numeric(stock.target) === null || Number(stock.target) <= 0
    ? "暂无分析师目标价"
    : `一致目标价 ${stockMoney(stock, stock.target)}`;
  els.detailRange.textContent = rangePosition === null ? "待同步" : `区间 ${percent(rangePosition, 0)}`;
  els.detailRangeMeta.textContent = yearLow === null || yearHigh === null
    ? "缺少 52 周高低价"
    : `${stockMoney(stock, yearLow)} - ${stockMoney(stock, yearHigh)}`;
  els.detailVerdict.textContent = getDetailVerdict(factors);
  els.detailConfidence.textContent = `综合 ${factors.score} · 风险 ${factors.riskScore} · 数据完整度 ${factors.confidence}`;

  els.detailFactors.innerHTML = "";
  [
    ["估值", factors.valuation],
    ["成长", factors.growth],
    ["盈利质量", factors.quality],
    ["财务安全", factors.financialHealth],
    ["价格动量", factors.momentum],
    ["分析师预期", factors.analyst],
  ].forEach(([label, score]) => {
    const row = document.createElement("div");
    const labelEl = document.createElement("span");
    const scoreEl = document.createElement("strong");
    const track = document.createElement("div");
    const fill = document.createElement("i");
    row.className = "factor-bar";
    labelEl.textContent = label;
    scoreEl.textContent = factorScoreText(score);
    track.className = "factor-track";
    fill.style.width = `${score ?? 0}%`;
    track.append(fill);
    row.append(labelEl, scoreEl, track);
    els.detailFactors.append(row);
  });

  els.detailMetrics.innerHTML = "";
  [
    ["市值", compactStockMoney(stock, stock.marketCap || metrics.marketCap)],
    ["市盈率", fundamentalValue(stock, stock.pe || metrics.pe, (value) => number(value))],
    ["收入增速", fundamentalValue(stock, metrics.revenueGrowth, (value) => percent(value * 100))],
    ["EPS 增速", fundamentalValue(stock, metrics.epsGrowth, (value) => percent(value * 100))],
    ["自由现金流增速", fundamentalValue(stock, metrics.fcfGrowth, (value) => percent(value * 100))],
    ["经营利润率", fundamentalValue(stock, metrics.operatingMargin, (value) => percent(value * 100))],
    ["ROE", fundamentalValue(stock, metrics.roe, (value) => percent(value * 100))],
    ["负债权益比", fundamentalValue(stock, metrics.debtToEquity, (value) => number(value))],
    ["流动比率", fundamentalValue(stock, metrics.currentRatio, (value) => number(value))],
    ["贝塔系数", presentNumber(metrics.beta)],
    ["50 日均线", stockMoney(stock, metrics.priceAvg50)],
    ["200 日均线", stockMoney(stock, metrics.priceAvg200)],
  ].forEach(([label, value]) => {
    const term = document.createElement("dt");
    const definition = document.createElement("dd");
    term.textContent = label;
    definition.textContent = value;
    els.detailMetrics.append(term, definition);
  });

  els.detailPositives.innerHTML = "";
  const positives = [];
  if (factors.growth >= 70) positives.push(`成长因子 ${factors.growth} 分，收入、利润或现金流增速表现较强。`);
  if (factors.quality >= 70) positives.push(`盈利质量 ${factors.quality} 分，利润率和资本回报具备支撑。`);
  if (factors.financialHealth >= 70) positives.push(`财务安全 ${factors.financialHealth} 分，流动性与杠杆状况相对稳健。`);
  if (factors.momentum >= 65) positives.push(`价格动量 ${factors.momentum} 分，当前趋势得到均线或 52 周位置支持。`);
  if (upside !== null && upside >= state.marginSafety) positives.push(`一致目标价隐含 ${percent(upside)} 空间，高于当前安全边际设置。`);
  if (!positives.length) positives.push("暂未发现足够强的一致性积极信号，重点等待数据或趋势进一步确认。");
  positives.slice(0, 4).forEach((message) => addDetailListItem(els.detailPositives, message));

  els.detailRisks.innerHTML = "";
  const risks = [...factors.riskDrivers];
  if (price !== null && yearHigh !== null && yearHigh > 0 && (yearHigh - price) / yearHigh > 0.25) risks.push("当前价格距 52 周高点超过 25%，需要识别是估值回落还是基本面变化。");
  if (numeric(metrics.debtToEquity) !== null && numeric(metrics.debtToEquity) > 2.5) risks.push("负债权益比偏高，需关注利率、再融资与现金流压力。");
  if (!risks.length) risks.push("未出现突出的量化风险项；仍需关注下一次财报、行业景气和市场波动。");
  [...new Set(risks)].slice(0, 4).forEach((message) => addDetailListItem(els.detailRisks, message));

  els.detailAction.textContent = getDetailAction(stock, factors);
}

async function refreshStockDetail(ticker = state.selectedTicker) {
  const index = state.stocks.findIndex((stock) => stock.ticker === ticker);
  if (index < 0 || state.isDetailLoading) return;
  if (!getApiKey()) {
    state.detailMessage = "未设置 FMP API key，当前展示的是本地已保存的数据。";
    renderView();
    return;
  }

  state.isDetailLoading = true;
  state.detailMessage = "正在更新实时行情与财务数据。";
  renderView();

  try {
    let nextStock = await refreshOneStock(state.stocks[index], { forceQuote: true });
    nextStock = await enrichStockFundamentals(nextStock);
    state.stocks[index] = nextStock;
    saveStocks();
    state.detailMessage = nextStock.fundamentalStatus
      ? `实时行情已更新：${new Date().toLocaleString("zh-CN")}。${nextStock.fundamentalStatus}`
      : `实时行情已更新：${new Date().toLocaleString("zh-CN")}。财务数据按 FMP 最新可用披露同步。`;
  } catch (error) {
    state.detailMessage = `刷新失败：${error.message}。已保留上次成功的数据。`;
  } finally {
    state.isDetailLoading = false;
    renderView();
  }
}

function openStockDetail(ticker) {
  state.selectedTicker = ticker;
  state.detailMessage = "正在准备该股票的深度分析。";
  renderView();
  els.stockDetailPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  refreshStockDetail(ticker);
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
  renderStockDetail();
  renderSearchResults();
  renderGrowthScreener();
  renderApiKeyState();
  renderStatus(state.isRefreshing ? "正在从 FMP 获取真实行情和财务数据。" : state.statusMessage);
}

function deleteStock(ticker) {
  state.stocks = state.stocks.filter((stock) => stock.ticker !== ticker);
  if (state.selectedTicker === ticker) {
    state.selectedTicker = null;
    state.detailMessage = "选择股票后会显示实时分析。";
  }
  saveStocks();
  renderView();
}

function downloadData() {
  const blob = new Blob([JSON.stringify(state.stocks, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `beijixing-${new Date().toISOString().slice(0, 10)}.json`;
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

async function fetchQuoteWithProfileFallback(symbol, options = {}) {
  try {
    const quotes = await fetchJson("quote", { symbol }, { ttlMs: 2 * 60 * 1000, force: options.forceQuote });
    const quote = Array.isArray(quotes) ? quotes[0] : quotes;
    if (quote) return { data: quote, source: "quote" };
  } catch (error) {
    if (error.message.includes("请求额度已用完")) throw error;
    // Some symbols are blocked on quote for this plan but still expose price in profile.
  }

  const profiles = await fetchJson("profile", { symbol }, { ttlMs: 24 * 60 * 60 * 1000, force: options.forceQuote });
  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  if (!profile) throw new Error("FMP 未返回价格数据");
  return { data: profile, source: "profile" };
}

function applyRatios(stock, ratios) {
  if (!ratios) return stock;

  const metrics = {
    ...(stock.metrics || {}),
    pe: pickNumber(ratios, ["priceToEarningsRatioTTM", "peRatioTTM"]),
    roe: pickNumber(ratios, ["returnOnEquityTTM", "returnOnEquity", "returnOnTangibleAssetsTTM"]),
    roic: pickNumber(ratios, ["returnOnInvestedCapitalTTM", "returnOnInvestedCapital", "returnOnCapitalEmployedTTM"]),
    grossMargin: pickNumber(ratios, ["grossProfitMarginTTM", "grossMarginTTM", "grossProfitMargin"]),
    operatingMargin: pickNumber(ratios, ["operatingProfitMarginTTM", "operatingMarginTTM", "operatingProfitMargin"]),
    netMargin: pickNumber(ratios, ["netProfitMarginTTM", "bottomLineProfitMarginTTM", "netProfitMargin"]),
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

function isPlanRestricted(result) {
  return result.status === "rejected" && String(result.reason?.message || result.reason || "").includes("套餐无权访问");
}

function clearRestrictedFundamentals(stock) {
  const metrics = { ...(stock.metrics || {}) };
  [
    "pe",
    "roe",
    "roic",
    "grossMargin",
    "operatingMargin",
    "netMargin",
    "incomeQuality",
    "debtToEquity",
    "currentRatio",
    "enterpriseValueMultiple",
    "evToSales",
    "evToFcf",
    "fcfYield",
    "earningsYield",
    "altmanZ",
    "piotroski",
    "revenueGrowth",
    "netIncomeGrowth",
    "epsGrowth",
    "fcfGrowth",
    "operatingCashFlowGrowth",
    "analystRevenueUpside",
    "analystEpsGrowth",
    "analystCountEps",
    "analystCountRevenue",
    "targetHigh",
    "targetLow",
    "targetMedian",
  ].forEach((key) => delete metrics[key]);

  return {
    ...stock,
    pe: null,
    growth: null,
    target: null,
    metrics,
    fundamentalStatus: "FMP 当前套餐未覆盖 TTM 估值、财务质量与分析师预期数据。",
  };
}

async function refreshQuotes(options = {}) {
  const results = await Promise.all(
    state.stocks.map(async (stock) => {
      const symbol = normalizeSymbol(stock.ticker);
      try {
        const result = await fetchQuoteWithProfileFallback(symbol, options);
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

async function refreshOneStock(stock, options = {}) {
  const symbol = normalizeSymbol(stock.ticker);
  const result = await fetchQuoteWithProfileFallback(symbol, options);
  return result.source === "profile" ? applyProfile(stock, result.data) : applyQuote(stock, result.data);
}

async function enrichStockFundamentals(stock) {
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
  const restrictedCount = [ratios, keyMetrics, scores, incomeGrowth, balanceGrowth, cashFlowGrowth, targets, estimates]
    .filter(isPlanRestricted)
    .length;

  if (restrictedCount >= 5) return clearRestrictedFundamentals(nextStock);
  return { ...nextStock, fundamentalStatus: "" };
}

async function refreshFundamentals() {
  const jobs = state.stocks.map(async (stock) => {
    return enrichStockFundamentals(stock);
  });

  state.stocks = await Promise.all(jobs);
  return state.stocks.filter((stock) => stock.fundamentalStatus).length;
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
    const quoteFailures = await refreshQuotes({ forceQuote: true });
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
    const restrictedFundamentals = await refreshFundamentals();
    state.settings.lastUpdated = new Date().toISOString();
    saveStocks();
    saveSettings();
    state.statusMessage = restrictedFundamentals
      ? `行情已更新；${restrictedFundamentals} 只股票的财务与估值字段受当前 FMP 套餐限制。`
      : quoteFailures > 0
        ? `FMP 刷新完成，${quoteFailures} 只股票保留本地数据。`
        : "FMP 真实数据刷新完成。";
  } catch (error) {
    state.statusMessage = `${error.message}，已保留本地数据。`;
  } finally {
    state.isRefreshing = false;
    renderView();
  }
}

async function runGrowthScreener() {
  if (state.isScreeningGrowth) return;
  if (!getApiKey()) {
    state.statusMessage = "缺少 FMP API key，无法运行高成长筛选。";
    renderView();
    return;
  }

  state.isScreeningGrowth = true;
  state.growthScreenerResults = [];
  state.statusMessage = "正在运行美股高成长筛选。";
  renderView();

  const results = [];
  try {
    for (const candidate of highGrowthUniverse) {
      let stock = stockFromSearchResult(candidate);
      try {
        stock = await refreshOneStock(stock);
        stock = await enrichStockFundamentals(stock);
        const factors = getStockFactors(stock);
        const gap = Math.abs(factors.growth - factors.score);
        if (factors.growth > growthScreenerMinGrowth && gap <= growthScreenerMaxGap) {
          results.push({ stock, factors, gap: Math.round(gap) });
        }
      } catch (error) {
        if (String(error.message).includes("请求额度已用完")) throw error;
      }
    }

    state.growthScreenerResults = results.sort((a, b) => b.factors.score - a.factors.score);
    state.statusMessage = state.growthScreenerResults.length
      ? `筛选完成，找到 ${state.growthScreenerResults.length} 个高成长且综合分接近的候选。`
      : "筛选完成，暂未找到符合条件的候选。";
  } catch (error) {
    state.statusMessage = `${error.message}，筛选已停止。`;
  } finally {
    state.isScreeningGrowth = false;
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

els.runGrowthScreenerBtn.addEventListener("click", runGrowthScreener);
els.refreshDetailBtn.addEventListener("click", () => refreshStockDetail());
els.closeDetailBtn.addEventListener("click", () => {
  state.selectedTicker = null;
  state.detailMessage = "选择股票后会显示实时分析。";
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
