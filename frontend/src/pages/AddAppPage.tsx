import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Star, Play, Apple } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { appsApi } from '../services/api';

export default function AddAppPage() {
  const navigate = useNavigate();
  const [playStoreLink, setPlayStoreLink] = useState('');
  const [appStoreLink, setAppStoreLink] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePreview = async () => {
    if (!playStoreLink && !appStoreLink) {
      setError('Enter at least one store link');
      return;
    }
    setError('');
    setPreviewLoading(true);
    try {
      const data = await appsApi.scrapePreview({ playStoreLink: playStoreLink || undefined, appStoreLink: appStoreLink || undefined });
      setPreview(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch app info');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const app = await appsApi.create({ playStoreLink: playStoreLink || undefined, appStoreLink: appStoreLink || undefined });
      navigate(`/apps/${app.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add app');
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <button
          onClick={() => navigate('/')}
          className="mb-10 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.22em] text-pulse-soft transition hover:text-pulse-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to the desk
        </button>

        <div className="mb-10 border-b border-pulse-line pb-8">
          <p className="fp-kicker mb-4">New listing</p>
          <h1 className="fp-display text-5xl leading-none md:text-6xl">
            Add an app to <span className="italic text-pulse-violet">today's edition.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-pulse-soft">
            Drop either store link — we'll auto-detect the rest, fetch metadata, and let you preview before committing to your archive.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="fp-card p-8">
            <div className="mb-7">
              <p className="fp-kicker">Store archive source</p>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-pulse-rust/25 bg-red-100/50 p-3 text-sm text-pulse-rust">
                {error}
              </div>
            )}

            <div className="space-y-5 mb-6">
              <div>
                <label className="fp-label">Play Store URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center rounded-l-xl border-r border-pulse-border bg-pulse-card2 px-4 text-[12px] font-black uppercase tracking-[0.18em] text-pulse-violet">
                    <Play className="mr-2 h-3.5 w-3.5" />
                    Play
                  </div>
                  <input
                    type="url"
                    value={playStoreLink}
                    onChange={(e) => setPlayStoreLink(e.target.value)}
                    placeholder="https://play.google.com/store/apps/details?id=..."
                    className="fp-input pl-32"
                  />
                </div>
              </div>
              <div>
                <label className="fp-label">App Store URL</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center rounded-l-xl border-r border-pulse-border bg-pulse-card2 px-4 text-[12px] font-black uppercase tracking-[0.18em] text-pulse-white">
                    <Apple className="mr-2 h-3.5 w-3.5" />
                    App
                  </div>
                  <input
                    type="url"
                    value={appStoreLink}
                    onChange={(e) => setAppStoreLink(e.target.value)}
                    placeholder="https://apps.apple.com/app/id..."
                    className="fp-input pl-28"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading || (!playStoreLink && !appStoreLink)}
              className="fp-btn-ghost mb-4"
            >
              {previewLoading ? (
                <><span className="loader loader-sm" /> Fetching app info...</>
              ) : (
                <><Search className="w-4 h-4" /> Preview before adding</>
              )}
            </button>

          {preview && (
            <div className="mb-6 rounded-2xl border border-pulse-border bg-pulse-card2 p-4">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-pulse-muted">App Preview</h3>
              <div className="flex items-start gap-3">
                {preview.iconUrl ? (
                  <img src={preview.iconUrl} alt="" className="h-16 w-16 rounded-2xl border border-pulse-border object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-pulse-border bg-pulse-card font-display text-2xl text-pulse-white">
                    {(preview.appName || 'A').charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-pulse-white">{preview.appName || 'Unknown App'}</h4>
                  {preview.averageRating && (
                    <div className="mt-1 flex items-center gap-1 text-pulse-rust">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-medium">{Number(preview.averageRating).toFixed(1)}</span>
                      <span className="text-xs text-pulse-muted">rating</span>
                    </div>
                  )}
                  {preview.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-pulse-muted">{preview.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSave}>
              <div className="mt-6 flex items-center justify-end gap-4 border-t border-pulse-border pt-5">
                <button type="button" onClick={() => navigate('/')} className="px-4 py-2 text-sm font-bold text-pulse-soft">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (!playStoreLink && !appStoreLink)}
                  className="fp-btn-primary px-6 py-3"
                >
                  {saving ? (
                    <><span className="loader loader-sm loader-ink" /> Adding app...</>
                  ) : (
                    <><Plus className="w-4 h-4" /> Add to archive</>
                  )}
                </button>
              </div>
            </form>
          </div>

          <aside className="space-y-6">
            <div className="fp-card p-6">
              <p className="fp-kicker mb-4">What you'll get</p>
              <ul className="space-y-4 text-sm text-pulse-white">
                <li>Daily review fetch from both stores</li>
                <li>AI-prioritized bugs and feature ideas</li>
                <li>Sentiment and competitor comparisons</li>
                <li>Exportable product brief</li>
              </ul>
            </div>
            <div className="fp-card p-6">
              <p className="fp-kicker mb-4">A note</p>
              <p className="text-sm leading-7 text-pulse-soft">
                We respect each store's terms — fetches are throttled and only public review data is collected.
                You can remove any app and its archive at any time.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
