import { Link } from 'react-router-dom';
import { Star, RefreshCw, Sparkles, Trash2 } from 'lucide-react';

interface AppCardProps {
  app: {
    id: string;
    appName: string;
    iconUrl?: string;
    averageRating?: number;
    totalReviews: number;
    platform: string;
    lastFetchedAt?: string;
    updatedAt?: string;
  };
  onFetch: (appId: string) => void;
  onAnalyse: (appId: string) => void;
  onDelete: (appId: string) => void;
}

export function AppCard({ app, onFetch, onAnalyse, onDelete }: AppCardProps) {
  const platformTone =
    app.platform === 'android'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
      : app.platform === 'ios'
      ? 'border-pulse-blue/25 bg-pulse-blue/10 text-pulse-blue'
      : 'border-pulse-violet/30 bg-pulse-violet/10 text-pulse-lavender';

  const health =
    app.totalReviews === 0 ? 'Watch' : Number(app.averageRating || 0) >= 4.4 ? 'Healthy' : Number(app.averageRating || 0) >= 4 ? 'Watch' : 'Needs Care';
  const healthTone =
    health === 'Healthy'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
      : health === 'Watch'
      ? 'border-pulse-ochre/35 bg-pulse-ochre/10 text-pulse-ochre'
      : 'border-pulse-rust/35 bg-pulse-rust/10 text-pulse-rust';

  return (
    <div className="group relative flex min-h-[330px] flex-col overflow-hidden rounded-2xl border border-pulse-border bg-pulse-card shadow-card transition duration-150 hover:-translate-y-0.5 hover:border-pulse-violet/70">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pulse-lavender/70 to-transparent opacity-70" />
      <button
        onClick={() => onDelete(app.id)}
        className="absolute right-4 top-4 z-10 rounded-full border border-pulse-border bg-pulse-card2 p-1.5 text-pulse-muted opacity-0 transition duration-150 hover:border-pulse-rust hover:text-pulse-rust group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <Link to={`/apps/${app.id}`} className="block p-5 pb-0">
        <div className="mb-4 flex items-start gap-4">
          {app.iconUrl ? (
            <img
              src={app.iconUrl}
              alt={app.appName}
              className="h-14 w-14 flex-shrink-0 rounded-2xl border border-pulse-border object-cover shadow-card"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-pulse-border bg-pulse-card2 font-display text-2xl text-pulse-white shadow-card">
              {app.appName.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1 pr-7">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`fp-badge ${platformTone}`}>
                {app.platform}
              </span>
              <span className="truncate text-[11px] font-bold uppercase tracking-[0.2em] text-pulse-muted">Productivity</span>
            </div>
            <h3 className="line-clamp-2 min-h-[3.4rem] font-display text-[1.7rem] leading-[1] tracking-[-0.06em] text-pulse-white">{app.appName}</h3>
            <p className="mt-2 line-clamp-2 min-h-[2.6rem] text-sm leading-5 text-pulse-soft">
              User feedback archive, review intelligence, and product signals.
            </p>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-3 border-y border-pulse-border">
        <div className="border-r border-pulse-border p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-pulse-muted">Rating</p>
          <div className="mt-2 flex items-center gap-1 text-pulse-white">
            <Star className="h-4 w-4 fill-current text-pulse-rust" />
            <span className="font-bold">{app.averageRating ? Number(app.averageRating).toFixed(1) : 'N/A'}</span>
          </div>
        </div>
        <div className="border-r border-pulse-border p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-pulse-muted">Reviews</p>
          <p className="mt-2 font-bold text-pulse-white">{app.totalReviews.toLocaleString()}</p>
        </div>
        <div className="min-w-0 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-pulse-muted">Fetched</p>
          <p className="mt-2 truncate text-sm font-bold text-pulse-white">
            {app.lastFetchedAt ? new Date(app.lastFetchedAt).toLocaleDateString() : 'Never'}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 p-4">
        <span className={`fp-badge mr-auto ${healthTone}`}>{health}</span>
        <button
          onClick={() => onFetch(app.id)}
          className="inline-flex items-center gap-1 rounded-2xl border border-pulse-border bg-pulse-card2 px-3 py-2 text-sm font-bold text-pulse-white transition hover:border-pulse-violet/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Fetch
        </button>
        <button
          onClick={() => onAnalyse(app.id)}
          className="ink-btn px-4 py-2"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Analyse
        </button>
      </div>
    </div>
  );
}
