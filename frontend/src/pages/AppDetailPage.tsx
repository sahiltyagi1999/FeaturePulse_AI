import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, BarChart2, Download, X, Trash2, FileText } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { OverviewTab } from '../components/tabs/OverviewTab';
import { ReviewsTab } from '../components/tabs/ReviewsTab';
import { AnalysisTab } from '../components/tabs/AnalysisTab';
import { CompetitorTab } from '../components/tabs/CompetitorTab';
import { appsApi, reviewsApi, analysisApi, exportApi } from '../services/api';
import { useJob } from '../contexts/JobContext';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'competitor', label: 'Competitor' },
];

const REVIEW_COUNT_OPTIONS = [10, 50, 100, 200, 500, 1000];

function FetchModal({
  statusMessage,
  onConfirm,
  onClose,
}: {
  statusMessage: string;
  onConfirm: (limit: number, startDate: string, endDate: string) => void;
  onClose: () => void;
}) {
  const [limit, setLimit] = useState(100);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="fp-card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-pulse-white">Fetch Reviews</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-pulse-muted transition hover:bg-pulse-border hover:text-pulse-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mb-5 text-sm text-pulse-muted">{statusMessage}</p>

        <div className="space-y-4">
          <div>
            <label className="fp-label">How many reviews to fetch?</label>
            <div className="flex flex-wrap gap-2">
              {REVIEW_COUNT_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setLimit(n)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition duration-150 ${
                    limit === n
                      ? 'border-pulse-violet bg-pulse-violet text-pulse-white shadow-glow'
                      : 'border-pulse-border bg-pulse-card2 text-pulse-soft hover:border-pulse-violet/60 hover:text-pulse-white'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="fp-label">
              Date range <span className="font-normal tracking-normal text-pulse-muted">(optional)</span>
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate || today}
                placeholder="From"
                className="fp-input flex-1 px-3 py-2"
              />
              <span className="text-sm text-pulse-muted">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                max={today}
                placeholder="To"
                className="fp-input flex-1 px-3 py-2"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="mt-2 text-xs text-pulse-muted transition hover:text-pulse-white"
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="fp-btn-muted flex-1">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(limit, startDate, endDate)}
            className="fp-btn-primary flex-1"
          >
            Fetch {limit} Reviews
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startJob } = useJob();
  const [activeTab, setActiveTab] = useState('overview');
  const [app, setApp] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchModal, setFetchModal] = useState<{ open: boolean; statusMessage: string }>({
    open: false,
    statusMessage: '',
  });
  const [reviewsKey, setReviewsKey] = useState(0);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [appData, analysisData] = await Promise.all([
        appsApi.get(id),
        analysisApi.latest(id).catch(() => null),
      ]);
      setApp(appData);
      setAnalysis(analysisData);
    } catch (err) {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
    const handler = () => { fetchData(); setReviewsKey((k) => k + 1); };
    window.addEventListener('jobComplete', handler);
    return () => window.removeEventListener('jobComplete', handler);
  }, [fetchData]);

  const handleFetch = async () => {
    try {
      const status = await reviewsApi.getFetchStatus(id!);
      setFetchModal({ open: true, statusMessage: status.message });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to get fetch status');
    }
  };

  const handleFetchConfirm = async (limit: number, startDate: string, endDate: string) => {
    setFetchModal({ open: false, statusMessage: '' });
    try {
      const { jobId } = await reviewsApi.confirmFetch(id!, {
        limit,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      startJob(jobId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start fetch');
    }
  };

  const handleDeleteAllReviews = async () => {
    if (!confirm('Delete ALL reviews for this app? This cannot be undone.')) return;
    try {
      await reviewsApi.deleteAll(id!);
      setReviewsKey((k) => k + 1);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete reviews');
    }
  };

  const handleAnalyse = async () => {
    try {
      const { jobId } = await analysisApi.queue(id!);
      startJob(jobId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start analysis');
    }
  };

  const handleExport = async () => {
    try {
      const response = await exportApi.exportPdf(id!);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app?.appName || 'report'}-featurepulse-analysis.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleExportReviews = async () => {
    try {
      const response = await exportApi.exportReviewsPdf(id!);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${app?.appName || 'reviews'}-reviews-by-stars.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
    <div className="app-shell">
      <Navbar />
      <div className="flex items-center justify-center py-24">
          <div className="loader loader-md" />
      </div>
      </div>
    );
  }

  if (!app) return null;

  return (
    <div className="app-shell">
      <Navbar />

      {fetchModal.open && (
        <FetchModal
          statusMessage={fetchModal.statusMessage}
          onConfirm={handleFetchConfirm}
          onClose={() => setFetchModal({ open: false, statusMessage: '' })}
        />
      )}

      <div className="fp-container py-6">
        <button
          onClick={() => navigate('/')}
          className="mb-4 flex items-center gap-2 text-sm text-pulse-muted transition hover:text-pulse-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="fp-card mb-4 overflow-hidden">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4 flex-1">
              {app.iconUrl ? (
                <img src={app.iconUrl} alt={app.appName} className="h-16 w-16 rounded-2xl border border-pulse-border object-cover shadow-card" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pulse-border bg-pulse-card2 font-display text-3xl text-pulse-white shadow-card">
                  {app.appName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-pulse-white">{app.appName}</h1>
                <p className="mt-1 text-sm capitalize text-pulse-muted">{app.platform} • {app.totalReviews.toLocaleString()} reviews</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={handleFetch} className="fp-btn-ghost px-3 py-2">
                <RefreshCw className="w-4 h-4" /> Fetch Reviews
              </button>
              <button onClick={handleAnalyse} className="fp-btn-primary px-3 py-2">
                <BarChart2 className="w-4 h-4" /> Analyse
              </button>
              {analysis && (
                <button onClick={handleExport} className="fp-btn-ghost px-3 py-2">
                  <Download className="w-4 h-4" /> Export Analysis
                </button>
              )}
              {app.totalReviews > 0 && (
                <button onClick={handleExportReviews} className="fp-btn-ghost px-3 py-2">
                  <FileText className="w-4 h-4" /> Reviews PDF
                </button>
              )}
              {app.totalReviews > 0 && (
                <button onClick={handleDeleteAllReviews} className="flex items-center gap-1.5 rounded-xl border border-pulse-rust/30 bg-red-100/50 px-3 py-2 text-sm font-semibold text-pulse-rust transition hover:bg-red-100">
                  <Trash2 className="w-4 h-4" /> Delete Reviews
                </button>
              )}
            </div>
          </div>

          <div className="border-t border-pulse-border">
            <nav className="flex overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`fp-tab whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'fp-tab-active'
                      : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>
          {activeTab === 'overview' && <OverviewTab app={app} analysis={analysis} onFetch={handleFetch} onAnalyse={handleAnalyse} />}
          {activeTab === 'reviews' && <ReviewsTab appId={id!} key={reviewsKey} />}
          {activeTab === 'analysis' && <AnalysisTab analysis={analysis} onAnalyse={handleAnalyse} onExport={handleExport} />}
          {activeTab === 'competitor' && <CompetitorTab appId={id!} />}
        </div>
      </div>
    </div>
  );
}
