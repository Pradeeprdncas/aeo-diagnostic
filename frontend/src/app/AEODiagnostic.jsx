'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, CartesianGrid, LabelList,
} from 'recharts';
import {
  Loader2, Search, Sparkles, XCircle, BarChart3,
  Zap, Activity, Target, Layers,
} from 'lucide-react';
import './AEODiagnostic.css';

/* ── Professional multi-color palette ── */
const BRAND_COLORS = [
  '#6366f1', // indigo   – #1
  '#10b981', // emerald  – #2
  '#f59e0b', // amber    – #3
  '#ec4899', // pink     – #4
  '#06b6d4', // cyan     – #5
  '#8b5cf6', // violet   – #6
  '#64748b', // slate    – #7+
];
const MODEL_COLORS = {
  chatgpt: '#6366f1',
  gemini:  '#10b981',
  claude:  '#f59e0b',
};
const DEFAULT_MODEL_COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#06b6d4'];
const brandColor = (i) => BRAND_COLORS[Math.min(i, BRAND_COLORS.length - 1)];
const modelColor = (m, i) => MODEL_COLORS[m] ?? DEFAULT_MODEL_COLORS[i % DEFAULT_MODEL_COLORS.length];

/* ── Tooltips ── */
const CustomBarTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="v2-tooltip">
      <p className="v2-tooltip__brand">{d.fullBrand}</p>
      <div className="v2-tooltip__row">
        <span className="v2-tooltip__dot" style={{ background: d.color }} />
        <span className="v2-tooltip__key">Score</span>
        <span className="v2-tooltip__val">{payload[0].value} pts</span>
      </div>
      <div className="v2-tooltip__row">
        <span className="v2-tooltip__key">Rank</span>
        <span className="v2-tooltip__val">#{d.rank}</span>
      </div>
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="v2-tooltip">
      <p className="v2-tooltip__brand">{d.name}</p>
      <div className="v2-tooltip__row">
        <span className="v2-tooltip__dot" style={{ background: d.payload.fill }} />
        <span className="v2-tooltip__key">Score</span>
        <span className="v2-tooltip__val">{d.value} pts</span>
      </div>
      <div className="v2-tooltip__row">
        <span className="v2-tooltip__key">Share</span>
        <span className="v2-tooltip__val">{(d.payload.percent * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};

const CustomStackedTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="v2-tooltip">
      <p className="v2-tooltip__brand">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="v2-tooltip__row">
          <span className="v2-tooltip__dot" style={{ background: p.fill }} />
          <span className="v2-tooltip__key">{p.dataKey}</span>
          <span className="v2-tooltip__val">{p.value} pts</span>
        </div>
      ))}
      <div className="v2-tooltip__divider" />
      <div className="v2-tooltip__row">
        <span className="v2-tooltip__key">Total</span>
        <span className="v2-tooltip__val">{total} pts</span>
      </div>
    </div>
  );
};

const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function AEODiagnosticV2() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const analyzeQuery = async () => {
    if (!query.trim()) { setError('Please enter a search query'); return; }
    setLoading(true); setError(''); setData(null);
    try {
      const res = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch { setError('Something went wrong while analyzing.'); }
    finally { setLoading(false); }
  };

  /* ── Insights ── */
  const generateInsights = () => {
    if (!data) return null;
    const { results, scores } = data;
    const allBrands = Object.values(results).flat();
    const uniqueBrands = [...new Set(allBrands)];
    const topBrand = scores[0];
    const appearanceCount = {};
    uniqueBrands.forEach(b => {
      appearanceCount[b] = Object.values(results).filter(l => l.includes(b)).length;
    });
    const mostConsistent = Object.entries(appearanceCount).filter(([,c]) => c === 3).map(([b]) => b)[0];
    const lowVisibility = Object.entries(appearanceCount).filter(([,c]) => c === 1).map(([b]) => b);
    const maxPossible = uniqueBrands.length * 3;
    const totalAppearances = Object.values(appearanceCount).reduce((a, b) => a + b, 0);
    const agreementScore = Math.round((totalAppearances / maxPossible) * 100);
    return { topBrand, mostConsistent, lowVisibility, agreementScore, appearanceCount };
  };

  /* ── Smart analysis ── */
  const computeSmartAnalysis = () => {
    if (!data) return null;
    const { results, scores } = data;
    const models = Object.keys(results);
    const brands = [...new Set(Object.values(results).flat())];
    const totalScore = scores.reduce((a, b) => a + b.score, 0);

    const top = scores[0].score;
    const second = scores[1]?.score ?? 1;
    const dominanceMultiple = (top / second).toFixed(1);
    const dominancePct = Math.round(((top - second) / top) * 100);

    const modelRanks = {};
    models.forEach(m => {
      modelRanks[m] = {};
      results[m].forEach((b, i) => { modelRanks[m][b] = i + 1; });
      brands.forEach(b => { if (!modelRanks[m][b]) modelRanks[m][b] = brands.length + 1; });
    });
    let diffSum = 0, pairs = 0;
    for (let i = 0; i < models.length; i++)
      for (let j = i + 1; j < models.length; j++)
        brands.forEach(b => { diffSum += Math.abs(modelRanks[models[i]][b] - modelRanks[models[j]][b]); pairs++; });
    const volatility = pairs > 0 ? parseFloat((diffSum / pairs).toFixed(1)) : 0;
    const volatilityLabel = volatility < 1 ? 'Low' : volatility < 2 ? 'Moderate' : 'High';

    const aggRanks = {};
    brands.forEach(b => { aggRanks[b] = models.reduce((s, m) => s + modelRanks[m][b], 0) / models.length; });
    let maxBias = 0, biasedModel = models[0];
    models.forEach(m => {
      const bias = brands.reduce((s, b) => s + Math.abs(modelRanks[m][b] - aggRanks[b]), 0) / brands.length;
      if (bias > maxBias) { maxBias = bias; biasedModel = m; }
    });

    const hhi = Math.round(scores.reduce((s, item) => { const share = item.score / totalScore; return s + share * share; }, 0) * 100);
    const hhiLabel = hhi > 50 ? 'Highly concentrated' : hhi > 30 ? 'Moderately concentrated' : 'Fragmented';

    return { dominanceMultiple, dominancePct, volatility, volatilityLabel, biasedModel, hhi, hhiLabel, totalScore };
  };

  /* ── Brand tiers ── */
  const computeTiers = () => {
    if (!data) return null;
    const max = data.scores[0].score;
    return {
      t1: data.scores.filter(s => s.score >= max * 0.8),
      t2: data.scores.filter(s => s.score >= max * 0.5 && s.score < max * 0.8),
      t3: data.scores.filter(s => s.score >= max * 0.25 && s.score < max * 0.5),
      t4: data.scores.filter(s => s.score < max * 0.25),
    };
  };

  const scoreLabel = (i) => {
    if (i === 0) return 'Dominant visibility';
    if (i <= 2) return 'Competitive presence';
    return 'Low AI recall';
  };

  const insights = generateInsights();
  const smart = computeSmartAnalysis();
  const tiers = computeTiers();
  const maxScore = data ? data.scores[0].score : 0;
  const totalScore = smart?.totalScore ?? 0;

  const barData = data ? data.scores.map((s, i) => ({
    brand: s.brand.length > 9 ? s.brand.slice(0, 8) + '…' : s.brand,
    fullBrand: s.brand, score: s.score, rank: i + 1, color: brandColor(i),
  })) : [];
  const pieData = data ? data.scores.map((s, i) => ({
    name: s.brand, value: s.score,
    percent: totalScore > 0 ? s.score / totalScore : 0,
    fill: brandColor(i),
  })) : [];

  const stackedData = (() => {
    if (!data) return { rows: [], models: [] };
    const models = Object.keys(data.results);
    const rows = data.scores.slice(0, 6).map(({ brand }) => {
      const entry = { brand: brand.length > 9 ? brand.slice(0, 8) + '…' : brand, fullBrand: brand };
      models.forEach(m => {
        const list = data.results[m];
        const idx = list.indexOf(brand);
        entry[m] = idx === -1 ? 0 : list.length - idx;
      });
      return entry;
    });
    return { rows, models };
  })();

  const heroHeadline = () => {
    if (!insights || !smart) return null;
    const top = insights.topBrand.brand;
    const second = data?.scores[1]?.brand ?? 'competitors';
    return (
      <>
        <span className="v2-hero__accent">{top}</span> dominates AI visibility
        with <span className="v2-hero__accent">{smart.dominanceMultiple}×</span> stronger
        presence than {second}
      </>
    );
  };

  return (
    <div className="v2">
      <div className="v2-container">

        {/* ── HEADER ── */}
        <header className="v2-header">
          <span className="v2-badge">
            <Sparkles />AI Visibility Analytics
          </span>
          <h1 className="v2-title">AEO Diagnostic</h1>
          <p className="v2-subtitle">
            Deep analytics on how brands appear across AI models — benchmark visibility,
            consensus, and category leadership.
          </p>
        </header>

        {/* ── INPUT ── */}
        <section className="v2-input-section">
          <div className="v2-input-wrapper">
            <div className="v2-input-field-wrap">
              <Search className="v2-input-icon" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyzeQuery()}
                placeholder="e.g. best smartphones, top CRM tools…"
                className="v2-input-field"
              />
            </div>
            <div className="v2-input-btn-wrap">
              <button onClick={analyzeQuery} disabled={loading} className="v2-btn v2-btn--primary">
                {loading ? <><Loader2 className="v2-spin" />Analyzing…</> : 'Analyze'}
              </button>
            </div>
          </div>
          {error && <p className="v2-error"><XCircle />{error}</p>}
        </section>

        {/* ── SKELETON ── */}
        {loading && (
          <div className="v2-skeletons">
            <div className="v2-skeleton v2-skeleton--hero" />
            <div className="v2-skeleton-row">
              {[0,1,2,3].map(i => <div key={i} className="v2-skeleton v2-skeleton--card" />)}
            </div>
            <div className="v2-skeleton-row">
              <div className="v2-skeleton v2-skeleton--chart" style={{ flex: 1 }} />
              <div className="v2-skeleton v2-skeleton--chart" style={{ flex: 1 }} />
            </div>
          </div>
        )}

        {/* ── HERO INSIGHT ── */}
        {data && insights && smart && (
          <div className="v2-section">
            <div className="v2-hero">
              <div className="v2-hero__grid" />
              <div className="v2-hero__glow-1" />
              <div className="v2-hero__glow-2" />
              <div className="v2-hero__content">
                <div className="v2-hero__badge"><Sparkles />Top Insight</div>
                <div className="v2-hero__body">
                  <div className="v2-hero__text">
                    <h2 className="v2-hero__headline">{heroHeadline()}</h2>
                    <p className="v2-hero__desc">
                      Across <strong>{Object.keys(data.results).length} AI models</strong>,{' '}
                      {insights.topBrand.brand} consistently ranks first with a{' '}
                      <strong>{smart.dominancePct}% lead</strong> over the second-placed brand.
                      {insights.mostConsistent ? ` ${insights.mostConsistent} appears in every model — a mark of stable cross-platform recall.` : ''}
                    </p>
                    <div className="v2-hero__agree-row">
                      <span className="v2-hero__agree-label">AI Agreement</span>
                      <div className="v2-agree-bar">
                        <div className="v2-agree-bar__fill" style={{ width: `${insights.agreementScore}%` }} />
                      </div>
                      <span className="v2-hero__agree-pct">{insights.agreementScore}%</span>
                    </div>
                  </div>
                  <div className="v2-hero__stats">
                    <div className="v2-hero__stat">
                      <span className="v2-hero__stat-value">{insights.topBrand.score}</span>
                      <span className="v2-hero__stat-label">Top Score</span>
                    </div>
                    <div className="v2-hero__stat-divider" />
                    <div className="v2-hero__stat">
                      <span className="v2-hero__stat-value">{smart.dominanceMultiple}×</span>
                      <span className="v2-hero__stat-label">Lead over #2</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SMART METRICS ── */}
        {smart && insights && (
          <div className="v2-section v2-metrics">
            {[
              { Icon: Zap, accent: true, label: 'Dominance Score', value: `${smart.dominancePct}% ahead`, sub: `#1 leads by ${smart.dominancePct}% over #2` },
              { Icon: Activity, label: 'Model Volatility', value: smart.volatilityLabel, sub: `Avg rank diff: ${smart.volatility} positions` },
              { Icon: Target, label: 'Model Bias', value: smart.biasedModel, sub: 'Most divergent from consensus' },
              { Icon: Layers, label: 'Concentration', value: smart.hhiLabel, sub: `HHI score: ${smart.hhi}/100` },
            ].map(m => (
              <div key={m.label} className="v2-metric-card">
                <div className={`v2-metric-card__icon${m.accent ? ' v2-metric-card__icon--accent' : ''}`}>
                  <m.Icon />
                </div>
                <p className="v2-metric-card__label">{m.label}</p>
                <p className="v2-metric-card__value">{m.value}</p>
                <p className="v2-metric-card__sub">{m.sub}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── CHARTS ── */}
        {data && (
          <div className="v2-section">
            <div className="v2-section-header">
              <h2 className="v2-section-title">Visual Analytics</h2>
              <p className="v2-section-subtitle">Score distribution across brands</p>
            </div>
            <div className="v2-charts-grid">

              {/* Bar chart */}
              <div className="v2-chart-card">
                <p className="v2-chart-card__title">Brand Score Comparison</p>
                <p className="v2-chart-card__sub">Aggregate visibility points across all AI models</p>
                <div className="v2-chart-wrap">
                  <ResponsiveContainer width="100%" height={256}>
                    <BarChart data={barData} barSize={32} margin={{ top: 24, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#f3f4f6" strokeDasharray="0" />
                      <XAxis dataKey="brand" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={6} />
                      <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        <LabelList dataKey="score" position="top" style={{ fontSize: 10, fontWeight: 700, fill: '#6b7280' }} />
                        {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie chart */}
              <div className="v2-chart-card">
                <p className="v2-chart-card__title">Visibility Share</p>
                <p className="v2-chart-card__sub">Proportional share of total AI visibility score</p>
                <div className="v2-chart-wrap">
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="46%"
                        innerRadius={62} outerRadius={96}
                        paddingAngle={2} dataKey="value"
                        labelLine={false} label={renderPieLabel}
                        isAnimationActive animationBegin={100} animationDuration={700}
                      >
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        iconType="circle" iconSize={8}
                        wrapperStyle={{ paddingTop: 8 }}
                        formatter={v => <span style={{ color: '#6b7280', fontSize: 11 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Stacked model contribution chart */}
            <div className="v2-chart-card v2-chart-card--full">
              <p className="v2-chart-card__title">Model Contribution by Brand</p>
              <p className="v2-chart-card__sub">How much each AI model contributes to a brand's total visibility score (rank-weighted)</p>
              <div className="v2-chart-legend-row">
                {stackedData.models.map((m, i) => (
                  <span key={m} className="v2-chart-legend-item">
                    <span className="v2-chart-legend-dot" style={{ background: modelColor(m, i) }} />{m}
                  </span>
                ))}
              </div>
              <div className="v2-chart-wrap">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stackedData.rows} barSize={36} margin={{ top: 16, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="brand" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={6} />
                    <YAxis tick={{ fontSize: 10, fill: '#d1d5db' }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<CustomStackedTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                    {stackedData.models.map((m, i) => (
                      <Bar key={m} dataKey={m} stackId="a" fill={modelColor(m, i)}
                        radius={i === stackedData.models.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0]}
                        isAnimationActive animationBegin={i * 120} animationDuration={600}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── MODEL COMPARISON ── */}
        {data && (
          <div className="v2-section">
            <div className="v2-section-header">
              <h2 className="v2-section-title">Model Comparison</h2>
              <p className="v2-section-subtitle">Rankings by each AI model</p>
            </div>
            <div className="v2-model-grid">
              {Object.entries(data.results).map(([model, list]) => (
                <div key={model} className="v2-model-card">
                  <div className="v2-model-card__header">
                    <h3 className="v2-model-card__name">{model}</h3>
                    <span className="v2-model-card__count">{list.length} brands</span>
                  </div>
                  <ul className="v2-model-list">
                    {list.map((brand, i) => (
                      <li key={brand + i} className="v2-model-item">
                        <span className={`v2-rank-badge ${i === 0 ? 'v2-rank-badge--1' : i === 1 ? 'v2-rank-badge--2' : 'v2-rank-badge--other'}`}>{i + 1}</span>
                        <span className={`v2-model-brand${i === 0 ? ' v2-model-brand--top' : ''}`}>{brand}</span>
                        {i === 0 && <span className="v2-first-pill">#1</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VISIBILITY RANKING ── */}
        {data && (
          <div className="v2-section">
            <div className="v2-section-header v2-section-header--row">
              <div>
                <h2 className="v2-section-title">Visibility Ranking</h2>
                <p className="v2-section-subtitle">Aggregate score across all AI models</p>
              </div>
              <span className="v2-section-meta">{totalScore} pts total</span>
            </div>
            <div className="v2-ranking-card">
              {data.scores.map((item, i) => {
                const pct = (item.score / maxScore) * 100;
                const isTop3 = i < 3;
                const barCls = i === 0 ? 'v2-bar-fill--1' : i === 1 ? 'v2-bar-fill--2' : i === 2 ? 'v2-bar-fill--3' : 'v2-bar-fill--other';
                const numCls = i === 0 ? 'v2-rank-num--1' : isTop3 ? 'v2-rank-num--top' : 'v2-rank-num--other';
                return (
                  <div key={item.brand} className="v2-ranking-item">
                    <div className="v2-ranking-row">
                      <div className="v2-ranking-left">
                        <span className={`v2-rank-num ${numCls}`}>{i + 1}</span>
                        <div>
                          <span className={`v2-ranking-brand${i === 0 ? ' v2-ranking-brand--top' : ''}`}>{item.brand}</span>
                          <span className="v2-score-label">{scoreLabel(i)}</span>
                        </div>
                      </div>
                      <div className="v2-ranking-right">
                        <span className="v2-ranking-pct">{pct.toFixed(0)}%</span>
                        <span className="v2-ranking-pts">{item.score} pts</span>
                      </div>
                    </div>
                    <div className="v2-bar-track">
                      <div className={`v2-bar-fill ${barCls}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BRAND TIERS ── */}
        {tiers && (
          <div className="v2-section">
            <div className="v2-section-header">
              <h2 className="v2-section-title">Brand Tiers</h2>
              <p className="v2-section-subtitle">Categorized by share of maximum visibility score</p>
            </div>
            <div className="v2-tiers-grid">
              {[
                { num: '1', label: 'Leaders', desc: 'Top 80%+ of max score', brands: tiers.t1 },
                { num: '2', label: 'Strong', desc: '50–80% of max score', brands: tiers.t2 },
                { num: '3', label: 'Emerging', desc: '25–50% of max score', brands: tiers.t3 },
                { num: '4', label: 'Weak', desc: 'Below 25% of max score', brands: tiers.t4 },
              ].map(t => (
                <div key={t.num} className={`v2-tier-card v2-tier--${t.num}`}>
                  <div className="v2-tier-card__header">
                    <span className="v2-tier-card__badge">T{t.num}</span>
                    <div>
                      <p className="v2-tier-card__label">{t.label}</p>
                      <p className="v2-tier-card__desc">{t.desc}</p>
                    </div>
                  </div>
                  <div className="v2-tier-card__brands">
                    {t.brands.length > 0
                      ? t.brands.map(s => <span key={s.brand} className="v2-tier-tag">{s.brand}</span>)
                      : <span className="v2-tier-empty">None</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── KEY TAKEAWAYS ── */}
        {insights && smart && (
          <div className="v2-section">
            <div className="v2-section-header">
              <h2 className="v2-section-title">Key Takeaways</h2>
              <p className="v2-section-subtitle">What this data tells us about the category</p>
            </div>
            <div className="v2-takeaways-card">
              {[
                <>
                  <strong>{insights.topBrand.brand}</strong> clearly dominates AI visibility, scoring{' '}
                  <strong>{smart.dominanceMultiple}×</strong> higher than the second-ranked brand — a strong
                  signal of authoritative presence in AI training data.
                </>,
                <>
                  Model consensus stands at <strong>{insights.agreementScore}%</strong> — AI systems show{' '}
                  {insights.agreementScore > 75 ? 'strong' : insights.agreementScore > 50 ? 'moderate' : 'low'}{' '}
                  agreement, indicating{' '}
                  {insights.agreementScore > 75
                    ? 'a well-established, consistent brand hierarchy in this category.'
                    : 'some divergence in how models interpret category leadership.'}
                </>,
                <>
                  Model volatility is classified as <strong>{smart.volatilityLabel}</strong> (avg rank difference:{' '}
                  {smart.volatility} positions). <strong>{smart.biasedModel}</strong> deviates most from the
                  aggregate consensus — watch for sampling bias in this model's outputs.
                </>,
                <>
                  Market concentration is <strong>{smart.hhiLabel}</strong> (score: {smart.hhi}/100).{' '}
                  {smart.hhi > 50
                    ? 'A few brands hold the majority of AI visibility — this category has a clear winner.'
                    : 'Visibility is spread across multiple brands, indicating a competitive, fragmented landscape.'}
                </>,
                insights.lowVisibility.length > 0 && (
                  <>
                    <strong>{insights.lowVisibility.join(', ')}</strong>{' '}
                    {insights.lowVisibility.length === 1 ? 'appears' : 'appear'} in only one model — underrepresented
                    in AI training data and unlikely to surface in AI-generated recommendations.
                  </>
                ),
              ].filter(Boolean).map((text, i) => (
                <div key={i} className={`v2-takeaway${i > 0 ? ' v2-takeaway--border' : ''}`}>
                  <span className="v2-takeaway__num">{i + 1}</span>
                  <p className="v2-takeaway__text">{text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!data && !loading && (
          <div className="v2-empty">
            <div className="v2-empty__icon"><BarChart3 /></div>
            <h3 className="v2-empty__title">No analysis yet</h3>
            <p className="v2-empty__desc">
              Enter any product category or keyword above to see deep AI visibility analytics.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}