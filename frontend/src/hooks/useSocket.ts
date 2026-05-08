import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useJob } from '../contexts/JobContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
  }
  return socket;
}

export function useJobSocket(jobId: string | null) {
  const { updateProgress, completeJob, failJob } = useJob();
  const joinedRoom = useRef<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const s = getSocket();

    if (joinedRoom.current !== jobId) {
      if (joinedRoom.current) s.emit('leaveJob', joinedRoom.current);
      s.emit('joinJob', jobId);
      joinedRoom.current = jobId;
    }

    const handleProgress = (data: { jobId: string; step: string; percent: number }) => {
      if (data.jobId === jobId) updateProgress(jobId, data.step, data.percent);
    };
    const handleComplete = (data: { jobId: string; message: string }) => {
      if (data.jobId === jobId) {
        completeJob(jobId, data.message);
        s.emit('leaveJob', jobId);
        joinedRoom.current = null;
      }
    };
    const handleError = (data: { jobId: string; error: string }) => {
      if (data.jobId === jobId) {
        failJob(jobId, data.error);
        s.emit('leaveJob', jobId);
        joinedRoom.current = null;
      }
    };

    s.on('jobProgress', handleProgress);
    s.on('jobComplete', handleComplete);
    s.on('jobError', handleError);

    return () => {
      s.off('jobProgress', handleProgress);
      s.off('jobComplete', handleComplete);
      s.off('jobError', handleError);
    };
  }, [jobId, updateProgress, completeJob, failJob]);
}
