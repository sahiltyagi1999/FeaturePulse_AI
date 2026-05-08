import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="relative flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-pulse-violet">
              <Sparkles className="h-3.5 w-3.5" />
              New subscriber
            </div>
            <h1 className="fp-display text-5xl">Create account</h1>
            <p className="mt-3 text-sm text-pulse-muted">Join the desk and start archiving app-store signals.</p>
          </div>

        <div className="fp-card p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="floating-label">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="fp-input pt-6"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="relative">
              <label className="floating-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fp-input pt-6"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="relative">
              <label className="floating-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fp-input pt-6"
                placeholder="Min. 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fp-btn-primary w-full py-3"
            >
              {loading ? (
                <div className="loader loader-sm loader-ink" />
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-pulse-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-pulse-lavender transition hover:text-pulse-white">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
