'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.8rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.08em', marginBottom: '.3rem' }}>
            ATMOS
          </div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.3em', color: 'var(--teal)' }}>
            Every receipt. Stamped.
          </div>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '1.1rem', color: 'var(--gl)', marginBottom: '.25rem' }}>
              Sign In
            </div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.15em', color: 'var(--muted)' }}>
              ACCESS YOUR AGENT ECONOMY
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: '#FF6B6B', marginBottom: '.75rem' }}>
                {error}
              </div>
            )}
            <button className="btn btn-gold btn-full" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <Link href="/register" style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', letterSpacing: '.1em', color: 'var(--muted)' }}>
              New to ATMOS?{' '}
              <span style={{ color: 'var(--teal)' }}>Create account →</span>
            </Link>
          </div>
        </div>

        {/* Entry-point shortcuts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginTop: '1.25rem', textAlign: 'center' }}>
          <Link
            href="/register?path=seal"
            style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.12em', color: 'var(--gold)', opacity: 0.7, textDecoration: 'none' }}
          >
            Want to stamp a deal? →
          </Link>
          <Link
            href="/register?path=economy"
            style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.12em', color: 'var(--teal)', opacity: 0.7, textDecoration: 'none' }}
          >
            Want to deploy an agent? →
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--dim)' }}>
          DEMO · demo@atmos.io / atmos123
        </div>
      </div>
    </div>
  );
}
