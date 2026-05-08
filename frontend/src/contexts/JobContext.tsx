import React, { createContext, useContext, useState, useCallback } from 'react';

interface JobProgress {
  jobId: string;
  step: string;
  percent: number;
  status: 'running' | 'done' | 'error';
  message?: string;
}

interface JobContextType {
  activeJob: JobProgress | null;
  startJob: (jobId: string) => void;
  clearJob: () => void;
  updateProgress: (jobId: string, step: string, percent: number) => void;
  completeJob: (jobId: string, message: string) => void;
  failJob: (jobId: string, error: string) => void;
}

const JobContext = createContext<JobContextType>(null!);

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<JobProgress | null>(null);

  const startJob = useCallback((jobId: string) => {
    setActiveJob({ jobId, step: 'Initializing...', percent: 0, status: 'running' });
  }, []);

  const clearJob = useCallback(() => {
    setActiveJob(null);
  }, []);

  const updateProgress = useCallback((jobId: string, step: string, percent: number) => {
    setActiveJob((prev) => {
      if (!prev || prev.jobId !== jobId) return prev;
      return { ...prev, step, percent, status: 'running' };
    });
  }, []);

  const completeJob = useCallback((jobId: string, message: string) => {
    setActiveJob((prev) => {
      if (!prev || prev.jobId !== jobId) return prev;
      return { ...prev, step: message, percent: 100, status: 'done', message };
    });
  }, []);

  const failJob = useCallback((jobId: string, error: string) => {
    setActiveJob((prev) => {
      if (!prev || prev.jobId !== jobId) return prev;
      return { ...prev, step: error, status: 'error', message: error };
    });
  }, []);

  return (
    <JobContext.Provider value={{ activeJob, startJob, clearJob, updateProgress, completeJob, failJob }}>
      {children}
    </JobContext.Provider>
  );
}

export const useJob = () => useContext(JobContext);
