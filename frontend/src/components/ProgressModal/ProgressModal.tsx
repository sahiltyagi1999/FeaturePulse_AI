import { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { useJob } from '../../contexts/JobContext';
import { useJobSocket } from '../../hooks/useSocket';

export function ProgressModal() {
  const { activeJob, clearJob } = useJob();
  const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useJobSocket(activeJob?.jobId ?? null);

  useEffect(() => {
    if (activeJob?.status === 'done') {
      autoCloseTimer.current = setTimeout(() => {
        clearJob();
        window.dispatchEvent(new CustomEvent('jobComplete'));
      }, 2000);
    }
    return () => {
      if (autoCloseTimer.current) clearTimeout(autoCloseTimer.current);
    };
  }, [activeJob?.status, clearJob]);

  if (!activeJob) return null;

  const { step, percent, status } = activeJob;
  const canClose = status === 'done' || status === 'error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="fp-card w-full max-w-sm p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {status === 'running' && <div className="loader loader-sm" />}
            {status === 'done' && <CheckCircle className="h-5 w-5 text-emerald-400" />}
            {status === 'error' && <XCircle className="h-5 w-5 text-red-400" />}
            <h2 className="text-base font-semibold text-pulse-white">
              {status === 'running' && 'Processing...'}
              {status === 'done' && 'Complete!'}
              {status === 'error' && 'Something went wrong'}
            </h2>
          </div>
          <button
            onClick={() => {
              clearJob();
              if (status === 'done') window.dispatchEvent(new CustomEvent('jobComplete'));
            }}
            title={canClose ? 'Close' : 'Stop & close'}
            className="rounded-lg p-1.5 text-pulse-muted transition hover:bg-pulse-border hover:text-pulse-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="mb-2 flex justify-between text-sm">
            <span className="truncate pr-4 text-pulse-muted">{step}</span>
            <span className="shrink-0 font-medium text-pulse-white">{percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-pulse-border">
            <div
              className={`h-2.5 rounded-full animate-progress transition-all duration-500 ${
                status === 'error'
                  ? 'bg-red-500'
                  : status === 'done'
                  ? 'bg-emerald-500'
                  : 'pulse-progress animate-[pulse-bar_1.5s_ease-in-out_infinite]'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {status !== 'running' && (
          <div className="mt-4 flex items-center">
            {status === 'done' && (
            <p className="flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle className="w-4 h-4" />
              {step}
            </p>
            )}
            {status === 'error' && (
            <p className="text-sm text-red-300">{step}</p>
            )}
          </div>
        )}

        {status === 'done' && (
          <p className="mt-3 text-xs text-pulse-muted">Auto-closing in 2 seconds...</p>
        )}
      </div>
    </div>
  );
}
