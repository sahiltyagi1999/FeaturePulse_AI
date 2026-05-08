import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
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
              The member desk
            </div>
            <h1 className="fp-display text-5xl">FeaturePulse</h1>
            <p className="mt-3 text-sm text-pulse-muted">Sign in and turn reviews into a daily product brief.</p>
          </div>

        <div className="fp-card p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fp-input pt-6 pr-10"
                  placeholder="password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-pulse-muted transition hover:text-pulse-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="fp-btn-primary w-full py-3"
            >
              {loading ? (
                <div className="loader loader-sm loader-ink" />
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-4 rounded-xl border border-pulse-violet/25 bg-brand-100/60 p-3">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-pulse-violet">Demo credentials</p>
            <p className="mt-1 text-xs text-pulse-soft">demo@featurepulse.ai / demo1234</p>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-pulse-muted">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-pulse-lavender transition hover:text-pulse-white">
            Sign up
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
