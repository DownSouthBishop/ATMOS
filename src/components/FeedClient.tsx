'use client';
import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Modal from '@/components/ui/Modal';
import Link from 'next/link';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  o2Budget: number;
  timeLimit: string | null;
  status: string;
  assessment: string | null;
  createdAt: string;
  postedBy: { name: string | null } | null;
}

interface FeedClientProps {
  jobs: Job[];
  hasAgent: boolean;
}

const FILTERS = ['All', 'Writing', 'Research', 'Marketing', 'Data', 'Design', 'Code', 'Legal', 'Finance', 'Outreach'];

const CATEGORY_VARIANTS: Record<string, 'teal' | 'gold' | 'green' | 'amber' | 'muted'> = {
  research: 'teal',
  writing: 'teal',
  marketing: 'amber',
  data: 'teal',
  design: 'gold',
  coding: 'teal',
  code: 'teal',
  legal: 'amber',
  finance: 'gold',
  outreach: 'teal',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

export default function FeedClient({ jobs, hasAgent }: FeedClientProps) {
  const [filter, setFilter] = useState('All');
  const [bidJob, setBidJob] = useState<Job | null>(null);
  const [assessment, setAssessment] = useState('');
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  const filtered = filter === 'All'
    ? jobs
    : jobs.filter(j => j.category.toLowerCase() === filter.toLowerCase());

  async function openBid(job: Job) {
    setBidJob(job);
    setAssessment(job.assessment || '');
    if (!job.assessment) {
      setLoading(true);
      try {
        const res = await fetch(`/api/jobs/${job.id}/accept`, { method: 'POST' });
        const data = await res.json() as { data: { assessment: string } | null; error: string | null };
        if (data.data?.assessment) {
          setAssessment(data.data.assessment);
          // Mark as accepted
          setAccepted(prev => [...prev, job.id]);
          setBidJob(null);
          showToast(`${job.title.slice(0, 40)} — agent dispatched`);
        } else if (data.error) {
          setAssessment(data.error);
        }
      } catch {
        setAssessment('Failed to connect. Check your agent config.');
      } finally {
        setLoading(false);
      }
    }
  }

  async function approveBid() {
    if (!bidJob) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${bidJob.id}/accept`, { method: 'POST' });
      const data = await res.json() as { data: { assessment: string } | null; error: string | null };
      if (data.error) {
        setAssessment(data.error);
        return;
      }
      setAccepted(prev => [...prev, bidJob.id]);
      setBidJob(null);
      showToast(`Agent dispatched — ${bidJob.title.slice(0, 40)}. You'll be notified when complete.`);
    } catch {
      setAssessment('Failed to accept job.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bid modal */}
      <Modal
        isOpen={!!bidJob}
        onClose={() => setBidJob(null)}
        subtitle="// APPROVE BID"
        title={bidJob?.title ?? ''}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setBidJob(null)}>Skip</button>
            <button className="btn btn-gold btn-sm" onClick={approveBid} disabled={loading}>
              {loading ? 'Dispatching...' : 'Approve · Let Agent Run'}
            </button>
          </>
        }
      >
        <div style={{ background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '.9rem', marginBottom: '1rem' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--teal)', marginBottom: '.4rem' }}>
            YOUR AGENT&apos;S ASSESSMENT
          </div>
          <div style={{ fontSize: '.76rem', color: 'var(--cream)', lineHeight: 1.6 }}>
            {loading ? 'Generating assessment...' : (assessment || 'Loading...')}
          </div>
        </div>
        {bidJob && (
          <div className="g2">
            <div style={{ background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '.75rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', marginBottom: '.3rem' }}>YOU EARN</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--gl)' }}>
                {Math.round(bidJob.o2Budget)} <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
                ≈ ${(bidJob.o2Budget * 0.65).toFixed(2)}
              </div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '.75rem', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', marginBottom: '.3rem' }}>EST. TIME</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--gl)' }}>
                {bidJob.timeLimit ?? '—'}
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>to complete</div>
            </div>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      {/* Section header */}
      <div className="sec-head">
        <div>
          <div className="sec-label">{'// LIVE'}</div>
          <div className="sec-title">Job Feed</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
          <span className="sdot live" />
          <span style={{ fontFamily: 'var(--fm)', fontSize: '.55rem', color: 'var(--teal)' }}>
            {jobs.length} OPEN JOBS
          </span>
        </div>
      </div>

      {/* No agent warning */}
      {!hasAgent && (
        <div style={{ background: 'var(--g10)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '.75rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '.72rem', color: 'var(--muted)' }}>
            You need an agent to accept jobs from the feed.
          </div>
          <Link href="/dashboard/agent" className="btn btn-gold btn-sm">Build Agent →</Link>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontFamily: 'var(--fm)', fontSize: '.65rem', letterSpacing: '.2em' }}>
          NO MATCHING JOBS RIGHT NOW
        </div>
      ) : (
        filtered.map(job => {
          const isAccepted = accepted.includes(job.id);
          const variant = CATEGORY_VARIANTS[job.category.toLowerCase()] ?? 'teal';
          return (
            <div key={job.id} className="job-card">
              <div className="job-meta">
                <Tag variant={variant}>{job.category.toUpperCase()}</Tag>
                <span className="job-posted">{timeAgo(job.createdAt)}</span>
                {isAccepted && <Tag variant="green">ACCEPTED</Tag>}
              </div>
              <div className="job-title">{job.title}</div>
              <div className="job-desc">{job.description}</div>
              <div className="job-footer">
                <div>
                  <div className="job-price">
                    {Math.round(job.o2Budget)}{' '}
                    <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
                    ≈ ${(job.o2Budget * 0.65).toFixed(2)}
                    {job.timeLimit && ` · ${job.timeLimit}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  {isAccepted ? (
                    <Tag variant="green">Agent Dispatched ✓</Tag>
                  ) : (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => setFilter(filter)}>Skip</button>
                      <button
                        className="btn btn-gold btn-sm"
                        onClick={() => openBid(job)}
                        disabled={!hasAgent}
                      >
                        Approve Bid →
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}
