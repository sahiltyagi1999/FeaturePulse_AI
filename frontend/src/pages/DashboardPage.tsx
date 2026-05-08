import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus, Search, Zap } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { AppCard } from '../components/AppCard/AppCard';
import { appsApi, reviewsApi, analysisApi } from '../services/api';
import { useJob } from '../contexts/JobContext';

export default function DashboardPage() {
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const { startJob } = useJob();

  const fetchApps = useCallback(async () => {
    try {
      const data = await appsApi.list();
      setApps(data);
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
    const handler = () => fetchApps();
    window.addEventListener('jobComplete', handler);
    return () => window.removeEventListener('jobComplete', handler);
  }, [fetchApps]);

  const handleFetch = async (appId: string) => {
    try {
      const status = await reviewsApi.getFetchStatus(appId);
      const confirmed = window.confirm(status.message + '\n\nProceed?');
      if (!confirmed) return;
      const { jobId } = await reviewsApi.confirmFetch(appId);
      startJob(jobId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start fetch');
    }
  };

  const handleAnalyse = async (appId: string) => {
    try {
      const { jobId } = await analysisApi.queue(appId);
      startJob(jobId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start analysis');
    }
  };

  const handleDelete = async (appId: string) => {
    if (!confirm('Delete this app and all its data?')) return;
    try {
      await appsApi.delete(appId);
      setApps((prev) => prev.filter((a) => a.id !== appId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete app');
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesSearch = (app.appName || '').toLowerCase().includes(search.toLowerCase());
    const matchesPlatform = platform === 'all' || app.platform === platform || app.platform === 'both';
    return matchesSearch && matchesPlatform;
  });

  const totalReviews = apps.reduce((sum, app) => sum + (Number(app.totalReviews) || 0), 0);
  const ratings = apps.map((app) => Number(app.averageRating)).filter(Boolean);
  const avgRating = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;

  return (
    <div className="app-shell">
      <Navbar />
      <div className="fp-container py-8">
        <section className="mb-12">
          <div className="mb-8 flex items-center justify-between border-b-2 border-pulse-white pb-3">
            <p className="fp-kicker">The Daily Brief · Fri May 8, 2026</p>
            <p className="text-[12px] font-black uppercase tracking-[0.24em] text-pulse-violet">All systems green</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="fp-kicker mb-4">Today on the desk</p>
              <h1 className="fp-display max-w-3xl text-6xl leading-[0.95] md:text-7xl">
                Your apps, read between <span className="italic text-pulse-violet">the stars.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-xl leading-8 text-pulse-soft">
                {totalReviews.toLocaleString()} reviews archived across {apps.length || 0} apps.
                Average rating sits at <b>{avgRating ? avgRating.toFixed(2) : '0.00'}</b> — see who needs a closer read below.
              </p>
            </div>
            <Link to="/apps/new" className="fp-btn-primary h-14 px-7 text-lg">
              <Plus className="h-5 w-5" />
              Track new app
            </Link>
          </div>

          <div className="mt-10 grid overflow-hidden rounded-2xl border border-pulse-border bg-pulse-card/70 md:grid-cols-4">
            {[
              ['Apps tracked', apps.length.toString()],
              ['Reviews archived', totalReviews.toLocaleString()],
              ['Avg. rating', avgRating ? avgRating.toFixed(2) : '0.00'],
              ['Signal status', apps.length ? 'Live' : 'Ready'],
            ].map(([label, value], index) => (
              <div key={label} className={`p-6 ${index < 3 ? 'border-b border-pulse-border md:border-b-0 md:border-r' : ''}`}>
                <p className="fp-kicker text-[11px]">{label}</p>
                <p className="mt-3 font-display text-4xl tracking-[-0.08em] text-pulse-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 border-b border-pulse-line pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="fp-display text-4xl">My Apps</h2>
            <span className="rounded-full border border-pulse-border bg-pulse-card2 px-3 py-1 text-sm font-bold text-pulse-soft">{filteredApps.length}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-pulse-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search the desk..."
                className="fp-input h-11 w-full pl-10 sm:w-72"
              />
            </div>
            <div className="flex overflow-hidden rounded-xl border border-pulse-border bg-pulse-card">
              {[
                ['all', 'All'],
                ['ios', 'iOS'],
                ['android', 'Android'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setPlatform(value)}
                  className={`px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] transition ${
                    platform === value ? 'bg-pulse-white text-pulse-paper' : 'text-pulse-soft hover:bg-pulse-card2'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="fp-card animate-pulse p-5">
                <div className="mb-4 flex gap-3">
                  <div className="h-16 w-16 rounded-2xl bg-pulse-border" />
                  <div className="flex-1">
                    <div className="mb-2 h-4 w-3/4 rounded bg-pulse-border" />
                    <div className="h-3 w-1/2 rounded bg-pulse-border" />
                  </div>
                </div>
                <div className="h-24 rounded-xl bg-pulse-card2" />
              </div>
            ))}
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="relative mb-6 h-28 w-28">
              <div className="absolute inset-0 rounded-[2rem] bg-pulse-violet/10 blur-2xl" />
              <div className="relative flex h-full w-full items-center justify-center rounded-[2rem] border border-pulse-border bg-pulse-card shadow-card">
                <Zap className="h-10 w-10 text-pulse-violet" />
              </div>
            </div>
            <h3 className="fp-display mb-2 text-4xl">No apps yet</h3>
            <p className="mb-6 max-w-sm text-sm text-pulse-muted">
              Add your first app using its Play Store or App Store link and start getting AI-powered insights.
            </p>
            <Link to="/apps/new" className="fp-btn-primary">
              <Plus className="h-4 w-4" />
              Add Your First App
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onFetch={handleFetch}
                onAnalyse={handleAnalyse}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <section className="mt-16 rounded-[1.75rem] bg-pulse-white p-8 text-pulse-paper md:p-12">
          <p className="mb-5 text-[12px] font-black uppercase tracking-[0.24em] text-pulse-rust">Editor's note</p>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-4xl tracking-[-0.06em] md:text-5xl">
                Stop reading reviews. Start <span className="italic text-pulse-violet">shipping fixes.</span>
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-pulse-paper/70">
                Run AI on any app and get prioritized bugs, feature ideas and competitor signals — written like a brief from your sharpest PM.
              </p>
            </div>
            <Link to={filteredApps[0] ? `/apps/${filteredApps[0].id}` : '/apps/new'} className="fp-btn-primary shrink-0 px-7 py-4 text-lg">
              Try a free analysis
              <ArrowUpRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
