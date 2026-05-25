'use client';
import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Modal from '@/components/ui/Modal';

interface ReceiptJob {
  tokensIn: number | null;
  tokensOut: number | null;
  computeCostUsd: number | null;
  platformFeeUsd: number | null;
  o2Cost: number | null;
  o2Refund: number | null;
}

interface Receipt {
  id: string;
  receiptNumber: string;
  type: string;
  title: string;
  description: string | null;
  partyAId: string | null;
  partyAName: string;
  partyBId: string | null;
  partyBName: string;
  settlementCurrency: string;
  settlementAmount: string | null;
  status: string;
  sigA: boolean;
  sigB: boolean;
  createdAt: string;
  jobId: string | null;
  ownerId: string;
  job: ReceiptJob | null;
}

interface ReceiptsClientProps {
  receipts: Receipt[];
  totalSealed: number;
  totalUsdValue: number;
}

function formatO2(v: number) { return Math.round(v).toLocaleString(); }
function formatUsd(v: number) { return '$' + v.toFixed(2); }

export default function ReceiptsClient({ receipts: initial, totalSealed, totalUsdValue }: ReceiptsClientProps) {
  const [receipts, setReceipts] = useState(initial);
  const [shareReceipt, setShareReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState('');
  const [signingId, setSigningId] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  async function signReceipt(id: string) {
    setSigningId(id);
    try {
      const res = await fetch(`/api/receipts/${id}/sign`, { method: 'POST' });
      const data = await res.json() as { data: Receipt | null; error: string | null };
      if (data.error) { showToast(data.error); return; }
      if (data.data) {
        setReceipts(prev => prev.map(r => r.id === id ? { ...r, ...data.data! } : r));
        showToast('Stamped ✓ · Deal recorded forever.');
        setTimeout(() => setShareReceipt(receipts.find(r => r.id === id) ?? null), 800);
      }
    } catch {
      showToast('Failed to stamp receipt.');
    } finally {
      setSigningId('');
    }
  }

  function sigLabel(r: Receipt) {
    if (r.sigA && r.sigB) return 'STAMPED';
    if (r.sigA && !r.sigB) return 'AWAITING CLIENT';
    if (!r.sigA && r.sigB) return 'AWAITING AGENT';
    return 'PENDING';
  }

  function sigVariant(r: Receipt): 'green' | 'amber' | 'muted' {
    if (r.sigA && r.sigB) return 'green';
    if (r.sigA || r.sigB) return 'amber';
    return 'muted';
  }

  const pending = receipts.filter(r => !(r.sigA && r.sigB)).length;

  return (
    <>
      {/* Share modal */}
      <Modal
        isOpen={!!shareReceipt}
        onClose={() => setShareReceipt(null)}
        subtitle="// RECEIPT STAMPED"
        title="Share Your Win"
        width="460px"
      >
        {shareReceipt && (
          <>
            <div className="share-card mb2">
              <div className="share-seal">◈</div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.3em', color: 'var(--teal)', marginBottom: '.3rem' }}>
                ATMOS · FOUNDING SEAL
              </div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--gl)', marginBottom: '.4rem' }}>
                {shareReceipt.title.slice(0, 40)}
              </div>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: '.75rem' }}>
                {shareReceipt.type.replace(/_/g, ' ')} · {new Date(shareReceipt.createdAt).toLocaleDateString()}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', color: 'var(--muted)', marginBottom: '.15rem' }}>EARNED</div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--gl)' }}>
                    {shareReceipt.settlementCurrency === 'O2' && shareReceipt.settlementAmount != null ? formatO2(parseFloat(shareReceipt.settlementAmount)) : '—'}{' '}
                    <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', color: 'var(--muted)', marginBottom: '.15rem' }}>USD VALUE</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.75rem', color: 'var(--cream)' }}>
                    {shareReceipt.settlementCurrency === 'USD'
                      ? shareReceipt.settlementAmount
                      : shareReceipt.settlementAmount
                        ? formatUsd(parseFloat(shareReceipt.settlementAmount) * 0.65)
                        : '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                {[shareReceipt.partyAName, shareReceipt.partyBName].map((p, i) => (
                  <div key={i} style={{ flex: 1, background: 'rgba(76,175,128,.12)', border: '1px solid rgba(76,175,128,.2)', borderRadius: 'var(--r)', padding: '.3rem .5rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4CAF80', flexShrink: 0 }} />
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: '#4CAF80' }}>
                      {p.slice(0, 16)} ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {['X', 'TikTok', 'Instagram'].map(platform => (
                <button
                  key={platform}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setShareReceipt(null); showToast(`Receipt shared to ${platform}`); }}
                >
                  {platform}
                </button>
              ))}
              <button
                className="btn btn-teal btn-sm"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/receipts/${shareReceipt.id}`).catch(() => {});
                  setShareReceipt(null);
                  showToast('Link copied to clipboard');
                }}
              >
                Copy Link
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="sec-head">
        <div>
          <div className="sec-label">{'// RECORDS'}</div>
          <div className="sec-title">Receipts</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="g3 mb2">
        <div className="stat">
          <div className="stat-label">Total Sealed</div>
          <div className="stat-val">{totalSealed}</div>
          <div className="stat-delta up">↑ verified on-chain</div>
        </div>
        <div className="stat">
          <div className="stat-label">Awaiting Stamp</div>
          <div className="stat-val">{pending}</div>
          {pending > 0
            ? <div className="stat-delta" style={{ color: 'var(--gold)' }}>Action required</div>
            : <div className="stat-delta up">All clear</div>
          }
        </div>
        <div className="stat">
          <div className="stat-label">Total Value Verified</div>
          <div className="stat-val" style={{ fontSize: '1.5rem' }}>${totalUsdValue.toLocaleString()}</div>
          <div className="stat-delta up">↑ USD equivalent</div>
        </div>
      </div>

      {/* Receipt list */}
      {receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontFamily: 'var(--fm)', fontSize: '.65rem', letterSpacing: '.2em' }}>
          NO RECEIPTS YET
        </div>
      ) : (
        receipts.map(r => (
          <div key={r.id} className="receipt-card">
            <div className="receipt-header">
              <div>
                <div className="receipt-id">{r.id.slice(0, 20)}</div>
                <div style={{ display: 'flex', gap: '.4rem', marginTop: '.25rem' }}>
                  <Tag variant={r.type === 'deposit' ? 'gold' : 'teal'}>
                    {r.type.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                  <Tag variant={sigVariant(r)}>{sigLabel(r)}</Tag>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {r.settlementCurrency === 'O2' && r.settlementAmount != null && (
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', fontWeight: 600, color: 'var(--gl)' }}>
                    {formatO2(parseFloat(r.settlementAmount))}{' '}
                    <sup style={{ fontFamily: 'var(--fm)', fontSize: '.45em', color: 'var(--teal)' }}>O2</sup>
                  </div>
                )}
                {r.settlementCurrency === 'USD' && r.settlementAmount && (
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.6rem', color: 'var(--muted)' }}>{r.settlementAmount}</div>
                )}
              </div>
            </div>

            <div className="receipt-body">
              <div className="receipt-row">
                <span className="receipt-key">Task</span>
                <span className="receipt-val" style={{ maxWidth: 300, textAlign: 'right' }}>{r.title}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Party A</span>
                <span className="receipt-val">{r.partyAName.slice(0, 24)}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Party B</span>
                <span className="receipt-val">{r.partyBName ? r.partyBName.slice(0, 24) : '—'}</span>
              </div>
              <div className="receipt-row">
                <span className="receipt-key">Date</span>
                <span className="receipt-val">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Compute breakdown */}
            {r.job && r.job.tokensIn != null && (
              <div style={{ padding: '.6rem 1rem', background: 'var(--surface)', borderTop: '1px solid rgba(255,255,255,.04)' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.15em', color: 'var(--muted)', marginBottom: '.4rem' }}>
                  COMPUTE BREAKDOWN
                </div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {[
                    ['Tokens In', r.job.tokensIn?.toLocaleString()],
                    ['Tokens Out', r.job.tokensOut?.toLocaleString()],
                    ['Compute', r.job.computeCostUsd != null ? formatUsd(r.job.computeCostUsd) : null],
                    ['Platform Fee', r.job.platformFeeUsd != null ? formatUsd(r.job.platformFeeUsd) : null],
                    ['O2 Cost', r.job.o2Cost != null ? formatO2(r.job.o2Cost) + ' O2' : null],
                    ...(r.job.o2Refund && r.job.o2Refund > 0 ? [['Refund', '+' + formatO2(r.job.o2Refund) + ' O2']] : []),
                  ].map(([k, v]) => v != null ? (
                    <div key={k as string}>
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', color: 'var(--muted)' }}>{k}</div>
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--cream)' }}>{v}</div>
                    </div>
                  ) : null)}
                </div>
              </div>
            )}

            <div className="receipt-sigs">
              <div className="sig-block">
                <div className={`sig-dot ${r.sigA ? 'signed' : 'pending'}`} />
                <div className="sig-txt">PARTY A · {r.sigA ? 'SIGNED' : 'PENDING'}</div>
              </div>
              <div className="sig-block">
                <div className={`sig-dot ${r.sigB ? 'signed' : 'pending'}`} />
                <div className="sig-txt">PARTY B · {r.sigB ? 'SIGNED' : 'PENDING'}</div>
              </div>
              <div style={{ display: 'flex', gap: '.4rem', marginLeft: 'auto' }}>
                {!(r.sigA && r.sigB) && (
                  <button
                    className="btn btn-gold btn-xs"
                    onClick={() => signReceipt(r.id)}
                    disabled={signingId === r.id}
                  >
                    {signingId === r.id ? '...' : 'Sign ✓'}
                  </button>
                )}
                <button className="btn btn-teal btn-xs" onClick={() => setShareReceipt(r)}>
                  Share
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </>
  );
}
