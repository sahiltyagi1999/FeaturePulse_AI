import { useState, useEffect, useCallback } from 'react';
import { Star, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { reviewsApi } from '../../services/api';

interface ReviewsTabProps {
  appId: string;
}

export function ReviewsTab({ appId }: ReviewsTabProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [platformFilter, setPlatformFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reviewsApi.list(appId, {
        page,
        limit: 20,
        rating: ratingFilter,
        platform: platformFilter || undefined,
        search: searchText || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setReviews(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [appId, page, ratingFilter, platformFilter, searchText, startDate, endDate]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSearch = () => {
    setSearchText(searchInput);
    setPage(1);
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-current text-amber-300' : 'text-pulse-line'}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="fp-card-subtle p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search reviews..."
                className="fp-input flex-1 px-3 py-2"
              />
              <button onClick={handleSearch} className="fp-btn-muted px-3 py-2">
                <Search className="w-4 h-4" />
              </button>
            </div>
            <select
              value={ratingFilter || ''}
              onChange={(e) => { setRatingFilter(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
              className="fp-input px-3 py-2 sm:w-40"
            >
              <option value="">All Ratings</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} Stars</option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
              className="fp-input px-3 py-2 sm:w-44"
            >
              <option value="">All Platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 items-center">
            <span className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-pulse-muted">Date range</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              max={endDate || new Date().toISOString().split('T')[0]}
              className="fp-input px-3 py-1.5"
            />
            <span className="text-xs text-pulse-muted">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
              className="fp-input px-3 py-1.5"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
                className="text-xs text-pulse-muted underline transition hover:text-pulse-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <p className="mt-3 text-xs text-pulse-muted">{total.toLocaleString()} reviews found</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="fp-card-subtle p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-1/4 rounded bg-pulse-border" />
                <div className="h-4 w-1/6 rounded bg-pulse-border" />
              </div>
              <div className="mb-1 h-3 rounded bg-pulse-border" />
              <div className="h-3 w-5/6 rounded bg-pulse-border" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="fp-card-subtle p-12 text-center">
          <p className="text-pulse-muted">No reviews found matching your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="fp-card-subtle p-4 transition duration-150 hover:border-pulse-violet/40">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-pulse-border bg-pulse-card text-xs font-semibold text-pulse-soft">
                    {(review.reviewerName || 'A').charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-pulse-white">{review.reviewerName || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {renderStars(review.rating)}
                  <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${
                    review.platform === 'android'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-sky-400/20 bg-sky-400/10 text-sky-300'
                  }`}>
                    {review.platform === 'android' ? 'Android' : 'iOS'}
                  </span>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-pulse-soft">{review.reviewText}</p>
              {review.reviewDate && (
                <p className="mt-2 text-right text-xs text-pulse-muted">
                  {new Date(review.reviewDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-pulse-border p-2 text-pulse-muted transition hover:bg-pulse-card hover:text-pulse-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-pulse-muted">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-pulse-border p-2 text-pulse-muted transition hover:bg-pulse-card hover:text-pulse-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
