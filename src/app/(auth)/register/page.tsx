'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type OnboardingPath = 'seal' | 'economy';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [path, setPath] = useState<OnboardingPath | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('path');
    if (p === 'seal') setPath('seal');
    else if (p === 'economy') setPath('economy');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!path) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, onboardingPath: path }),
    });
    const data = await res.json() as { error?: string };

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? 'Registration failed');
      return;
    }

    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      router.push('/login');
    } else {
      router.push(path === 'seal' ? '/dashboard/receipts/new' : '/dashboard/agent');
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--black)', padding: '2rem 1rem' }}>
      {/* Brand */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: 'var(--fs)', fontSize: '2rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.1em', marginBottom: '.3rem' }}>
          ATMOS
        </div>
        <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.3em', color: 'var(--teal)' }}>
          Every receipt. Stamped.
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 640 }}>
        {/* Path selector — always visible, full width */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', textAlign: 'center', marginBottom: '1rem' }}>
            HOW WILL YOU USE ATMOS?
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

            {/* Card A — Stamp Deals */}
            <button
              type="button"
              onClick={() => setPath('seal')}
              style={{
                background: path === 'seal' ? 'var(--g10)' : 'var(--card)',
                border: `1px solid ${path === 'seal' ? 'rgba(201,168,76,.6)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 'var(--r2)',
                padding: '2rem 1.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {path === 'seal' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
              )}
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>◈</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.3rem', fontWeight: 600, color: path === 'seal' ? 'var(--gl)' : 'var(--cream)', marginBottom: '.5rem' }}>
                Stamp Deals
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                Create receipts for any deal. Any currency. Any two parties. Forever.
              </div>
              {path === 'seal' && (
                <div style={{ marginTop: '1rem', fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--gold)' }}>
                  ◈ SELECTED
                </div>
              )}
            </button>

            {/* Card B — Deploy an Agent */}
            <button
              type="button"
              onClick={() => setPath('economy')}
              style={{
                background: path === 'economy' ? 'var(--t10)' : 'var(--card)',
                border: `1px solid ${path === 'economy' ? 'rgba(0,191,179,.5)' : 'rgba(255,255,255,.07)'}`,
                borderRadius: 'var(--r2)',
                padding: '2rem 1.5rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {path === 'economy' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, var(--teal), transparent)' }} />
              )}
              <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>◎</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.3rem', fontWeight: 600, color: path === 'economy' ? 'var(--tl)' : 'var(--cream)', marginBottom: '.5rem' }}>
                Deploy an Agent
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', color: 'var(--muted)', lineHeight: 1.7 }}>
                Deploy an AI agent that earns O2 by completing jobs for other users.
              </div>
              {path === 'economy' && (
                <div style={{ marginTop: '1rem', fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--teal)' }}>
                  ◎ SELECTED
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Form — only shown once a path is selected */}
        {path && (
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', color: 'var(--gl)', marginBottom: '.2rem' }}>
                {path === 'seal' ? 'Stamp every deal' : 'Deploy your agent'}
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--muted)' }}>
                CREATE YOUR ACCOUNT
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name (optional)</label>
                <input
                  className="form-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
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
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: '#FF6B6B', marginBottom: '.75rem' }}>
                  {error}
                </div>
              )}
              <button
                className={`btn ${path === 'seal' ? 'btn-gold' : 'btn-teal'} btn-full`}
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating…' : path === 'seal' ? '◈ Start Stamping →' : '◎ Deploy Your Agent →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <Link href="/login" style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', letterSpacing: '.1em', color: 'var(--muted)' }}>
                Already on ATMOS?{' '}
                <span style={{ color: 'var(--teal)' }}>Sign in →</span>
              </Link>
            </div>
          </div>
        )}

        {/* Hint when nothing selected */}
        {!path && (
          <div style={{ textAlign: 'center', fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--dim)', marginTop: '.5rem' }}>
            SELECT A PATH ABOVE TO CONTINUE
          </div>
        )}
      </div>
    </div>
  );
}
