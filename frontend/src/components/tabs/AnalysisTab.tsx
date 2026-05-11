import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp, Download, RefreshCw, BarChart2 } from 'lucide-react';

interface AnalysisTabProps {
  analysis: any;
  onAnalyse: () => void;
  onExport: () => void;
}

const SENTIMENT_COLORS = ['#22c55e', '#64748b', '#ef4444'];

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/12 text-red-200 border border-red-500/25',
  high: 'bg-orange-500/12 text-orange-200 border border-orange-500/25',
  medium: 'bg-yellow-500/12 text-yellow-100 border border-yellow-500/25',
  low: 'bg-slate-500/12 text-slate-200 border border-slate-500/25',
};

const DEMAND_STYLES: Record<string, string> = {
  high: 'bg-emerald-500/12 text-emerald-200 border border-emerald-500/25',
  medium: 'bg-sky-500/12 text-sky-200 border border-sky-500/25',
  low: 'bg-slate-500/12 text-slate-200 border border-slate-500/25',
};

const THREAT_STYLES: Record<string, string> = {
  high: 'bg-red-500/12 text-red-200 border border-red-500/25',
  medium: 'bg-orange-500/12 text-orange-200 border border-orange-500/25',
  low: 'bg-slate-500/12 text-slate-200 border border-slate-500/25',
};

function FixCard({ fix }: { fix: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="fp-card-subtle overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pulse-white text-sm font-bold text-pulse-paper">
            {fix.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-semibold text-pulse-white">{fix.issue}</h4>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_STYLES[fix.severity] || SEVERITY_STYLES.low}`}>
                {fix.severity}
              </span>
              {fix.frequency && (
                <span className="text-xs text-pulse-muted">{fix.frequency}</span>
              )}
            </div>
            <p className="text-sm text-pulse-muted">{fix.description}</p>
          </div>
        </div>

        <div className="ml-11 space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">Real-world impact</p>
            <p className="text-sm text-pulse-soft">{fix.realWorldImpact}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">Suggested fix</p>
            <p className="text-sm text-pulse-soft">{fix.suggestedFix}</p>
          </div>
        </div>

        {fix.supportingReviews?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-11 mt-3 flex items-center gap-1 text-xs text-pulse-lavender transition hover:text-pulse-white"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {fix.supportingReviews.length} supporting quote{fix.supportingReviews.length !== 1 ? 's' : ''}
          </button>
        )}
        {expanded && fix.supportingReviews?.map((q: string, i: number) => (
          <div key={i} className="ml-11 mt-2 rounded-lg border-l-2 border-pulse-lavender bg-pulse-card p-2.5">
            <p className="text-xs italic text-pulse-muted">"{q}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="fp-card-subtle overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-pulse-white shadow-[0_0_24px_rgba(16,185,129,.25)]">
            {feature.rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h4 className="font-semibold text-pulse-white">{feature.featureName}</h4>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DEMAND_STYLES[feature.userDemand] || ''}`}>
                {feature.userDemand} demand
              </span>
              <span className="text-xs text-pulse-muted">{feature.implementationComplexity} complexity</span>
            </div>
            <p className="text-sm text-pulse-muted">{feature.description}</p>
          </div>
        </div>

        <div className="ml-11 space-y-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">Why valid</p>
            <p className="text-sm text-pulse-soft">{feature.whyValid}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">Impact if not added</p>
            <p className="text-sm text-pulse-soft">{feature.realWorldProblemIfNotAdded}</p>
          </div>
        </div>

        {feature.supportingReviews?.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-11 mt-3 flex items-center gap-1 text-xs text-emerald-300 transition hover:text-pulse-white"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {feature.supportingReviews.length} supporting quote{feature.supportingReviews.length !== 1 ? 's' : ''}
          </button>
        )}
        {expanded && feature.supportingReviews?.map((q: string, i: number) => (
          <div key={i} className="ml-11 mt-2 rounded-lg border-l-2 border-emerald-400 bg-pulse-card p-2.5">
            <p className="text-xs italic text-pulse-muted">"{q}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalysisTab({ analysis, onAnalyse, onExport }: AnalysisTabProps) {
  if (!analysis) {
    return (
      <div className="fp-card-subtle p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-pulse-violet/25 bg-pulse-violet/10">
          <BarChart2 className="h-8 w-8 text-pulse-lavender" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-pulse-white">No analysis yet</h3>
        <p className="mx-auto mb-6 max-w-sm text-sm text-pulse-muted">
          Run an AI analysis to get prioritized bug fixes, feature ideas, and sentiment breakdown.
        </p>
        <button onClick={onAnalyse} className="fp-btn-primary px-6 py-2.5">
          Run AI Analysis
        </button>
      </div>
    );
  }

  const { summary, prioritizedFixes = [], nextFeatureIdeas = [], competitorMentions = [], sentimentBreakdown } = analysis;
  const sentiment = sentimentBreakdown || { positive: 60, neutral: 20, negative: 20 };

  const pieData = [
    { name: 'Positive', value: sentiment.positive },
    { name: 'Neutral', value: sentiment.neutral },
    { name: 'Negative', value: sentiment.negative },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-pulse-muted">
          <span className="text-pulse-muted">Generated {new Date(analysis.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </p>
        <div className="flex gap-2">
          <button onClick={onExport} className="fp-btn-ghost px-3 py-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={onAnalyse} className="fp-btn-primary px-3 py-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Re-analyse
          </button>
        </div>
      </div>

      {summary && (
        <div className="fp-card-subtle p-5">
          <h3 className="mb-2 font-semibold text-pulse-white">AI Summary</h3>
          <p className="text-sm leading-relaxed text-pulse-soft">{summary}</p>
        </div>
      )}

      <div className="fp-card-subtle p-5 overflow-hidden">
        <h3 className="mb-4 font-semibold text-pulse-white">Sentiment Breakdown</h3>
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:items-center">
          <div className="h-52 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="48%"
                  outerRadius={78}
                  innerRadius={52}
                  stroke="rgba(255,244,228,.22)"
                  strokeWidth={1}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={SENTIMENT_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{
                    background: '#17100b',
                    border: '1px solid #3d2a1d',
                    borderRadius: 12,
                    color: '#fff4e4',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-1 flex justify-center gap-4 text-xs text-pulse-muted">
              {pieData.map((item, index) => (
                <span key={item.name} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[index] }} />
                  {item.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <SentimentBar label="Positive" value={sentiment.positive} color="bg-emerald-500" />
            <SentimentBar label="Neutral" value={sentiment.neutral} color="bg-slate-500" />
            <SentimentBar label="Negative" value={sentiment.negative} color="bg-red-500" />
          </div>
        </div>
      </div>

      {prioritizedFixes.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-pulse-white">Prioritized Fixes ({prioritizedFixes.length})</h3>
          <div className="space-y-3">
            {prioritizedFixes.map((fix: any, i: number) => (
              <FixCard key={i} fix={fix} />
            ))}
          </div>
        </div>
      )}

      {nextFeatureIdeas.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-pulse-white">Feature Ideas ({nextFeatureIdeas.length})</h3>
          <div className="space-y-3">
            {nextFeatureIdeas.map((feat: any, i: number) => (
              <FeatureCard key={i} feature={feat} />
            ))}
          </div>
        </div>
      )}

      {competitorMentions.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-pulse-white">Competitor Mentions ({competitorMentions.length})</h3>
          <div className="space-y-2">
            {competitorMentions.map((c: any, i: number) => (
              <div key={i} className="fp-card-subtle p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-pulse-white">{c.competitorName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${THREAT_STYLES[c.threatLevel] || ''}`}>
                    {c.threatLevel} threat
                  </span>
                </div>
                <p className="text-sm text-pulse-muted">{c.context}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-pulse-muted">{label}</span>
        <span className="font-medium text-pulse-white">{value}%</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-pulse-border">
        <div className={`h-2.5 rounded-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
