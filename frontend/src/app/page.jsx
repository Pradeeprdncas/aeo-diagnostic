'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export default function AEODiagnostic() {
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState(null);

  const generateInsights = (apiData) => {
    const { results, scores } = apiData;
    const allBrands = [
      ...new Set([
        ...results.groq,
        ...results.mistral,
        ...results.openrouter,
      ]),
    ];

    const consistent = allBrands.filter(
      (brand) =>
        results.groq.includes(brand) &&
        results.mistral.includes(brand) &&
        results.openrouter.includes(brand)
    );

    const lowVis = allBrands.filter((brand) => {
      const count = [results.groq, results.mistral, results.openrouter].filter(
        (list) => list.includes(brand)
      ).length;
      return count === 1;
    });

    const overlap = allBrands.filter(
      (brand) =>
        results.groq.includes(brand) &&
        results.mistral.includes(brand) &&
        results.openrouter.includes(brand)
    ).length;
    const agreement = Math.round((overlap / allBrands.length) * 100);

    return {
      topBrand: scores[0]?.brand || '',
      mostConsistent: consistent[0] || 'N/A',
      lowVisibility: lowVis.slice(0, 3),
      aiAgreement: agreement,
    };
  };

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const mockResponse = {
        query: query,
        results: {
          groq: ['Apple', 'Samsung', 'Google', 'Huawei', 'OnePlus'],
          mistral: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'],
          openrouter: ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi'],
        },
        scores: [
          { brand: 'Apple', score: 15 },
          { brand: 'Samsung', score: 12 },
          { brand: 'Google', score: 9 },
          { brand: 'OnePlus', score: 5 },
          { brand: 'Huawei', score: 2 },
          { brand: 'Xiaomi', score: 2 },
        ],
      };

      setData(mockResponse);
      setInsights(generateInsights(mockResponse));
    } finally {
      setLoading(false);
    }
  };

  const maxScore = data ? Math.max(...data.scores.map((s) => s.score)) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            AEO Diagnostic
          </h1>
          <p className="text-slate-600 text-lg">
            Analyze AI model agreement on search query results
          </p>
        </div>

        {/* Input Section */}
        <Card className="mb-8 p-6 border-slate-200 shadow-sm">
          <div className="flex gap-3 flex-col sm:flex-row">
            <Input
              type="text"
              placeholder="Enter a search query (e.g., 'best smartphones')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className="flex-1 border-slate-300"
              disabled={loading}
            />
            <Button
              onClick={handleAnalyze}
              disabled={loading || !query.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Analyzing...
                </>
              ) : (
                'Analyze'
              )}
            </Button>
          </div>
        </Card>

        {data && (
          <>
            {/* 3-Column Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { name: 'Groq', brands: data.results.groq },
                { name: 'Mistral', brands: data.results.mistral },
                { name: 'OpenRouter', brands: data.results.openrouter },
              ].map((model) => (
                <Card
                  key={model.name}
                  className="p-6 border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-slate-900 mb-4">
                    {model.name}
                  </h3>
                  <ol className="space-y-3">
                    {model.brands.map((brand, idx) => (
                      <li key={brand} className="flex items-center gap-3">
                        <span className="font-semibold text-slate-400 w-6">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700">{brand}</span>
                      </li>
                    ))}
                  </ol>
                </Card>
              ))}
            </div>

            {/* Visibility Score Section */}
            <Card className="mb-8 p-6 border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Visibility Score
              </h2>
              <div className="space-y-4">
                {data.scores.map((item, idx) => {
                  const percentage = (item.score / maxScore) * 100;
                  const isTopThree = idx < 3;

                  return (
                    <div key={item.brand}>
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`font-medium ${
                            isTopThree
                              ? 'text-slate-900'
                              : 'text-slate-600'
                          }`}
                        >
                          {item.brand}
                        </span>
                        <span className="text-sm font-semibold text-slate-600">
                          {item.score} pts
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isTopThree
                              ? 'bg-slate-900'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Insights Section */}
            {insights && (
              <Card className="mb-8 p-6 border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Key Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">Top Brand</p>
                    <p className="text-lg font-bold text-slate-900">
                      {insights.topBrand}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Most Consistent
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {insights.mostConsistent}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">
                      Low Visibility
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      {insights.lowVisibility.length}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600 mb-2">AI Agreement</p>
                    <p className="text-lg font-bold text-slate-900">
                      {insights.aiAgreement}%
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Report Card Section */}
            {insights && (
              <Card className="p-6 border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  Report Card
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Strong Presence
                      </p>
                      <p className="text-sm text-slate-600">
                        {insights.topBrand} dominates with highest visibility
                        score
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Moderate Presence
                      </p>
                      <p className="text-sm text-slate-600">
                        {data.scores[1]?.brand} and {data.scores[2]?.brand} show
                        solid visibility across models
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-2xl">❌</span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        Weak Presence
                      </p>
                      <p className="text-sm text-slate-600">
                        {data.scores[data.scores.length - 1]?.brand} and
                        similar brands appear in limited results
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {!data && !loading && (
          <Card className="p-12 text-center border-slate-200 shadow-sm">
            <p className="text-slate-500 text-lg">
              Enter a search query and click Analyze to see results
            </p>
          </Card>
        )}
      </div>
    </main>
  );
}
