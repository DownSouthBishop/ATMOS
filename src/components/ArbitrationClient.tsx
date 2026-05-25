'use client';
import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Modal from '@/components/ui/Modal';

interface Dispute {
  id: string;
  reason: string;
  status: string;
  resolution: string | null;
  votesFor: number;
  votesAgainst: number;
  createdAt: string;
  receiptTitle: string;
  receiptNumber: string | null;
}

interface Props {
  myDisputes: Dispute[];
  juryDisputes: Dispute[];
  juryEligible: boolean;
  userReceipts: { id: string; title: string; receiptNumber: string }[];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusVariant(status: string): 'red' | 'gold' | 'green' | 'muted' {
  if (status === 'open') return 'red';
  if (status === 'disputed') return 'red';
  if (status === 'resolved') return 'green';
  return 'muted';
}

export default function ArbitrationClient({ myDisputes: initial, juryDisputes: initialJury, juryEligible, userReceipts }: Props) {
  const [myDisputes, setMyDisputes] = useState(initial);
  const [juryDisputes, setJuryDisputes] = useState(initialJury);
  const [openModal, setOpenModal] = useState<'new' | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [votingId, setVotingId] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function handleOpenDispute() {
    if (!selectedReceipt || !reason.trim()) {
      setError('Select a receipt and enter a reason.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId: selectedReceipt, reason: reason.trim() }),
      });
      const json = await res.json() as { data: { id: string } | null; error: string | null };
      if (json.error) { setError(json.error); return; }
      showToast('Dispute opened — jury notified');
      setOpenModal(null);
      setReason('');
      setSelectedReceipt('');
      // Refresh disputes
      const refreshRes = await fetch('/api/disputes');
      const refreshJson = await refreshRes.json() as { data: { myDisputes: Dispute[]; juryDisputes: Dispute[] } | null };
      if (refreshJson.data) {
        setMyDisputes(refreshJson.data.myDisputes);
        setJuryDisputes(refreshJson.data.juryDisputes);
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(disputeId: string, vote: 'for' | 'against') {
    setVotingId(disputeId);
    try {
      const res = await fetch(`/api/disputes/${disputeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      const json = await res.json() as {
        data: { votesFor: number; votesAgainst: number; resolved: boolean } | null;
        error: string | null;
      };
      if (json.error) { showToast(json.error); return; }
      showToast(vote === 'for' ? 'Voted in favor' : 'Voted against');
      setJuryDisputes(prev => prev.filter(d => d.id !== disputeId));
    } catch {
      showToast('Vote failed.');
    } finally {
      setVotingId(null);
    }
  }

  return (
    <>
      {/* New dispute modal */}
      <Modal
        isOpen={openModal === 'new'}
        onClose={() => setOpenModal(null)}
        subtitle="// OPEN DISPUTE"
        title="File a Dispute"
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setOpenModal(null)}>Cancel</button>
            <button className="btn btn-sm" style={{ background: 'var(--red)', color: '#fff' }} onClick={handleOpenDispute} disabled={loading}>
              {loading ? 'Opening...' : 'Open Dispute →'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Receipt</label>
          <select
            className="form-input form-select"
            value={selectedReceipt}
            onChange={e => setSelectedReceipt(e.target.value)}
          >
            <option value="">Select a receipt...</option>
            {userReceipts.map(r => (
              <option key={r.id} value={r.id}>{r.receiptNumber} — {r.title}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reason for Dispute</label>
          <textarea
            className="form-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Describe why you are disputing this receipt..."
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>
        {error && (
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--red)', padding: '.5rem .75rem', background: 'var(--r10)', border: '1px solid var(--r20)', borderRadius: 'var(--r)' }}>
            {error}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item">{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="sec-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="sec-label">{'// DISPUTE RESOLUTION'}</div>
          <div className="sec-title">Arbitration</div>
        </div>
        <button
          className="btn btn-sm"
          style={{ background: 'var(--r10)', border: '1px solid var(--r20)', color: 'var(--red)' }}
          onClick={() => setOpenModal('new')}
        >
          + Open Dispute
        </button>
      </div>

      {/* My disputes */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-t">
          <div className="card-title">My Disputes</div>
          <div className="card-sub">{myDisputes.length} TOTAL</div>
        </div>
        {myDisputes.length === 0 ? (
          <div className="card-b" style={{ color: 'var(--muted)', fontFamily: 'var(--fm)', fontSize: '.62rem', letterSpacing: '.1em' }}>
            NO OPEN DISPUTES
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>RECEIPT</th>
                <th>REASON</th>
                <th>VOTES</th>
                <th>STATUS</th>
                <th>DATE</th>
              </tr>
            </thead>
            <tbody>
              {myDisputes.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '.78rem', color: 'var(--gl)' }}>{d.receiptTitle}</div>
                    {d.receiptNumber && <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>{d.receiptNumber}</div>}
                  </td>
                  <td style={{ maxWidth: 220, color: 'var(--muted)', fontSize: '.72rem' }}>
                    {d.reason.length > 80 ? d.reason.slice(0, 80) + '…' : d.reason}
                    {d.resolution && (
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: '#4CAF80', marginTop: '.2rem' }}>{d.resolution}</div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: '#4CAF80' }}>↑{d.votesFor}</span>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--red)' }}>↓{d.votesAgainst}</span>
                    </div>
                  </td>
                  <td><Tag variant={statusVariant(d.status)}>{d.status.toUpperCase()}</Tag></td>
                  <td className="monof">{fmtDate(d.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Jury view */}
      {juryEligible && (
        <div className="card">
          <div className="card-t">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div className="card-title">Jury Queue</div>
              <Tag variant="gold">ELIGIBLE</Tag>
            </div>
            <div className="card-sub">VOTE ON OPEN DISPUTES</div>
          </div>

          {juryDisputes.length === 0 ? (
            <div className="card-b" style={{ color: 'var(--muted)', fontFamily: 'var(--fm)', fontSize: '.62rem', letterSpacing: '.1em' }}>
              NO DISPUTES TO REVIEW
            </div>
          ) : (
            <div style={{ padding: '0 1.25rem 1rem' }}>
              {juryDisputes.map(d => (
                <div key={d.id} style={{
                  background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '.9rem 1rem',
                  border: '1px solid var(--b1)', marginTop: '.75rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--fs)', fontSize: '.88rem', color: 'var(--gl)', marginBottom: '.2rem' }}>
                        {d.receiptTitle}
                      </div>
                      {d.receiptNumber && <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>{d.receiptNumber}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center', flexShrink: 0, marginLeft: '1rem' }}>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: '#4CAF80' }}>↑{d.votesFor}</span>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--red)' }}>↓{d.votesAgainst}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '.75rem' }}>
                    {d.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '.5rem' }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(76,175,128,.1)', border: '1px solid rgba(76,175,128,.25)', color: '#4CAF80' }}
                      onClick={() => handleVote(d.id, 'for')}
                      disabled={votingId === d.id}
                    >
                      ↑ Uphold
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'var(--r10)', border: '1px solid var(--r20)', color: 'var(--red)' }}
                      onClick={() => handleVote(d.id, 'against')}
                      disabled={votingId === d.id}
                    >
                      ↓ Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!juryEligible && (
        <div style={{
          background: 'var(--surface)', borderRadius: 'var(--r2)', padding: '1.25rem',
          border: '1px solid var(--b1)', display: 'flex', alignItems: 'flex-start', gap: '.75rem',
        }}>
          <span style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1 }}>⊗</span>
          <div>
            <div style={{ fontFamily: 'var(--ff)', fontSize: '.72rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.3rem' }}>
              Jury Eligibility Required
            </div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--dim)', lineHeight: 1.6 }}>
              To vote on disputes you need: 100+ O2 balance and 5+ sealed receipts.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
