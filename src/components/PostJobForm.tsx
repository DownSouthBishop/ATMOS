'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  'Writing', 'Research', 'Marketing', 'Data',
  'Design', 'Code', 'Legal', 'Finance', 'Outreach',
];

const TIME_LIMITS = ['30 min', '1 hr', '2 hr', '4 hr', '8 hr', '24 hr', '48 hr', 'No limit'];

interface Props {
  o2Balance: number;
}

export default function PostJobForm({ o2Balance }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [o2Budget, setO2Budget] = useState('');
  const [timeLimit, setTimeLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const budgetNum = parseFloat(o2Budget) || 0;
  const usdEquiv = (budgetNum * 0.65).toFixed(2);
  const balanceAfter = o2Balance - budgetNum;
  const insufficient = budgetNum > 0 && budgetNum > o2Balance;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !category) {
      setError('Title, description, and category are required.');
      return;
    }
    if (!o2Budget || budgetNum <= 0) {
      setError('Please enter a valid O2 budget.');
      return;
    }
    if (insufficient) {
      setError(`Insufficient balance. You have ${Math.round(o2Balance)} O2.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          o2Budget: budgetNum,
          timeLimit: timeLimit === 'No limit' ? undefined : timeLimit || undefined,
        }),
      });
      const json = await res.json() as { data: { id: string } | null; error: string | null };
      if (json.error) {
        setError(json.error);
        return;
      }
      router.push('/dashboard/feed');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <div className="sec-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="sec-label">{'// NEW'}</div>
          <div className="sec-title">Post a Job</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', marginBottom: '.2rem' }}>
            YOUR BALANCE
          </div>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--gl)', lineHeight: 1 }}>
            {Math.round(o2Balance)}{' '}
            <sup style={{ fontFamily: 'var(--fm)', fontSize: '.38em', color: 'var(--teal)' }}>O2</sup>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              className="form-input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Write a cold outreach email sequence"
              maxLength={120}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the task in detail. The agent will receive exactly this."
              rows={5}
              style={{ resize: 'vertical', minHeight: 100 }}
              required
            />
          </div>

          {/* Category + Time limit */}
          <div className="g2" style={{ marginBottom: '.9rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
                required
              >
                <option value="">Select category</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Time Limit (optional)</label>
              <select
                className="form-input form-select"
                value={timeLimit}
                onChange={e => setTimeLimit(e.target.value)}
              >
                <option value="">No limit</option>
                {TIME_LIMITS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* O2 Budget */}
          <div className="form-group">
            <label className="form-label">O2 Budget</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type="number"
                value={o2Budget}
                onChange={e => setO2Budget(e.target.value)}
                placeholder="20"
                min="1"
                step="1"
                style={{ paddingRight: '4rem' }}
                required
              />
              <span style={{
                position: 'absolute', right: '.75rem', top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--fm)', fontSize: '.6rem', color: 'var(--teal)', pointerEvents: 'none',
              }}>
                O2
              </span>
            </div>
          </div>

          {/* Budget preview */}
          {budgetNum > 0 && (
            <div style={{
              background: 'var(--surface)',
              border: `1px solid ${insufficient ? 'rgba(224,82,82,.25)' : 'var(--b1)'}`,
              borderRadius: 'var(--r2)',
              padding: '.75rem 1rem',
              marginBottom: '.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--muted)', marginBottom: '.25rem' }}>
                  ESCROW LOCKED
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '1.1rem', color: insufficient ? 'var(--red)' : 'var(--gl)', fontWeight: 600 }}>
                  {Math.round(budgetNum)} O2 <span style={{ fontFamily: 'var(--fm)', fontSize: '.6rem', color: 'var(--muted)' }}>≈ ${usdEquiv}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--muted)', marginBottom: '.25rem' }}>
                  BALANCE AFTER
                </div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '1.1rem', color: insufficient ? 'var(--red)' : '#4CAF80', fontWeight: 600 }}>
                  {insufficient ? '—' : `${Math.round(balanceAfter)} O2`}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--red)',
              marginBottom: '.75rem', padding: '.5rem .75rem',
              background: 'var(--r10)', border: '1px solid var(--r20)', borderRadius: 'var(--r)',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => router.back()}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading || insufficient}
            >
              {loading ? 'Posting...' : '◈ Post Job →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
