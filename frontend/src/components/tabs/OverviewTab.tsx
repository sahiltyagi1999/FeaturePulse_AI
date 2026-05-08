import { Star, Calendar, BarChart2, RefreshCw } from 'lucide-react';

interface OverviewTabProps {
  app: any;
  analysis: any;
  onFetch: () => void;
  onAnalyse: () => void;
}

export function OverviewTab({ app, analysis, onFetch, onAnalyse }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Average Rating" value={app.averageRating ? `${Number(app.averageRating).toFixed(1)} / 5` : 'N/A'} icon={<Star className="w-4 h-4 text-amber-500" />} />
        <StatCard label="Total Reviews" value={app.totalReviews.toLocaleString()} icon={<BarChart2 className="w-4 h-4 text-pulse-lavender" />} />
        <StatCard label="Last Fetched" value={app.lastFetchedAt ? new Date(app.lastFetchedAt).toLocaleDateString() : 'Never'} icon={<RefreshCw className="w-4 h-4 text-emerald-400" />} />
        <StatCard label="Last Analysed" value={analysis ? new Date(analysis.generatedAt).toLocaleDateString() : 'Never'} icon={<Calendar className="w-4 h-4 text-purple-500" />} />
      </div>

      {app.description && (
        <div className="fp-card-subtle p-6">
          <h3 className="mb-2 font-semibold text-pulse-white">Description</h3>
          <p className="text-sm leading-relaxed text-pulse-muted">{app.description}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {app.playStoreLink && (
          <div className="fp-card-subtle p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">Play Store</p>
            <a href={app.playStoreLink} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-pulse-soft transition hover:text-pulse-white">
              {app.playStoreLink}
            </a>
          </div>
        )}
        {app.appStoreLink && (
          <div className="fp-card-subtle p-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">App Store</p>
            <a href={app.appStoreLink} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-pulse-soft transition hover:text-pulse-white">
              {app.appStoreLink}
            </a>
          </div>
        )}
      </div>

      {!analysis && app.totalReviews > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-pulse-violet/25 bg-pulse-violet/10 p-5">
          <div>
            <p className="font-medium text-pulse-white">Ready for AI Analysis</p>
            <p className="mt-0.5 text-sm text-pulse-muted">You have {app.totalReviews} reviews. Run AI analysis to get insights.</p>
          </div>
          <button onClick={onAnalyse} className="fp-btn-primary whitespace-nowrap px-4 py-2">
            Analyse Now
          </button>
        </div>
      )}

      {app.totalReviews === 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
          <div>
            <p className="font-medium text-amber-100">No Reviews Yet</p>
            <p className="mt-0.5 text-sm text-amber-100/70">Fetch reviews from the app stores to get started.</p>
          </div>
          <button onClick={onFetch} className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 whitespace-nowrap">
            Fetch Reviews
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="fp-card-subtle p-4 transition duration-150 hover:border-pulse-violet/40">
      <div className="mb-2 flex items-center gap-2">{icon}<span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">{label}</span></div>
      <p className="text-xl font-bold text-pulse-white">{value}</p>
    </div>
  );
}
