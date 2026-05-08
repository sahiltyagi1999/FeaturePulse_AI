import { useState, useEffect, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { competitorApi } from '../../services/api';

interface CompetitorTabProps {
  appId: string;
}

export function CompetitorTab({ appId }: CompetitorTabProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [competitorName, setCompetitorName] = useState('');
  const [playStoreLink, setPlayStoreLink] = useState('');
  const [appStoreLink, setAppStoreLink] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const data = await competitorApi.getAnalysis(appId);
      setAnalysis(data);
    } catch {
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [appId]);

  const handleAddCompetitor = async (e: FormEvent) => {
    e.preventDefault();
    if (!competitorName) { setError('Competitor name is required'); return; }
    if (!playStoreLink && !appStoreLink) { setError('Provide at least one store link'); return; }
    setError('');
    setAdding(true);
    try {
      await competitorApi.add(appId, {
        competitorAppName: competitorName,
        playStoreLink: playStoreLink || undefined,
        appStoreLink: appStoreLink || undefined,
      });
      setShowForm(false);
      setCompetitorName('');
      setPlayStoreLink('');
      setAppStoreLink('');
      await fetchAnalysis();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add competitor');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loader loader-md" />
      </div>
    );
  }

  const hasData = analysis?.yourAppSentiment?.positive > 0 || analysis?.competitorSentiment?.positive > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-pulse-white">Competitor Comparison</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="fp-btn-primary px-3 py-2"
        >
          <Plus className="w-4 h-4" /> Add Competitor
        </button>
      </div>

      {showForm && (
        <div className="fp-card-subtle p-5">
          <h3 className="mb-4 font-medium text-pulse-white">Add Competitor App</h3>
          {error && <div className="mb-3 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          <form onSubmit={handleAddCompetitor} className="space-y-3">
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="Competitor app name (e.g., YouTube Music)"
              className="fp-input"
              required
            />
            <input
              type="url"
              value={playStoreLink}
              onChange={(e) => setPlayStoreLink(e.target.value)}
              placeholder="Play Store link (optional)"
              className="fp-input"
            />
            <input
              type="url"
              value={appStoreLink}
              onChange={(e) => setAppStoreLink(e.target.value)}
              placeholder="App Store link (optional)"
              className="fp-input"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding}
                className="fp-btn-primary flex-1 py-2.5 disabled:opacity-50"
              >
                {adding ? <><span className="loader loader-sm loader-ink" /> Adding...</> : 'Add Competitor'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="fp-btn-muted px-4 py-2.5"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!hasData ? (
        <div className="fp-card-subtle p-12 text-center">
          <p className="mb-2 text-pulse-soft">No competitor data yet</p>
          <p className="text-sm text-pulse-muted">Add a competitor app to compare sentiment, features, and complaints.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="fp-card-subtle p-5">
            <h3 className="mb-4 font-semibold text-pulse-white">Sentiment Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              <SentimentColumn title="Your App" sentiment={analysis.yourAppSentiment} />
              <SentimentColumn title="Competitor" sentiment={analysis.competitorSentiment} />
            </div>
          </div>

          {analysis.featuresTheyHaveThatUsersWant?.length > 0 && (
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-orange-100">
                <span className="text-orange-500">⚡</span> Features Their Users Want
                <span className="text-xs text-orange-100/60">(your opportunity)</span>
              </h3>
              <ul className="space-y-2">
                {analysis.featuresTheyHaveThatUsersWant.map((f: string, i: number) => (
                  <li key={i} className="rounded-lg border-l-2 border-orange-300 bg-black/20 p-2.5 text-sm text-orange-50/80">
                    "{f}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.featuresYouHaveThatTheyLack?.length > 0 && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-emerald-100">
                <span className="text-emerald-400">✓</span> Your Strengths
              </h3>
              <ul className="space-y-2">
                {analysis.featuresYouHaveThatTheyLack.map((f: string, i: number) => (
                  <li key={i} className="rounded-lg border-l-2 border-emerald-400 bg-black/20 p-2.5 text-sm text-emerald-50/80">
                    "{f}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.commonComplaints?.length > 0 && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-red-100">
                <span className="text-red-500">!</span> Common Complaints
              </h3>
              <ul className="space-y-2">
                {analysis.commonComplaints.map((f: string, i: number) => (
                  <li key={i} className="rounded-lg border-l-2 border-red-300 bg-black/20 p-2.5 text-sm text-red-50/80">
                    "{f}"
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SentimentColumn({ title, sentiment }: { title: string; sentiment: { positive: number; neutral: number; negative: number } }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-medium text-pulse-soft">{title}</h4>
      <div className="space-y-2">
        <SentimentBar label="Positive" value={sentiment.positive} color="bg-emerald-500" />
        <SentimentBar label="Neutral" value={sentiment.neutral} color="bg-slate-500" />
        <SentimentBar label="Negative" value={sentiment.negative} color="bg-red-500" />
      </div>
    </div>
  );
}

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-pulse-muted">{label}</span>
        <span className="font-medium text-pulse-white">{value}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-pulse-border">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
