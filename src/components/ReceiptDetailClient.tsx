'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Tag from '@/components/ui/Tag';
import Link from 'next/link';

interface ReceiptJob {
  tokensIn: number | null;
  tokensOut: number | null;
  computeCostUsd: number | null;
  platformFeeUsd: number | null;
  o2Cost: number | null;
  o2Refund: number | null;
}

interface ReceiptDetail {
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
  paymentMethod: string | null;
  paymentNotes: string | null;
  status: string;
  sigA: boolean;
  sigAAt: string | null;
  sigB: boolean;
  sigBAt: string | null;
  sealedAt: string | null;
  shareToken: string | null;
  jobId: string | null;
  ownerId: string;
  createdAt: string;
  job: ReceiptJob | null;
}

interface Props {
  receipt: ReceiptDetail;
  userId: string;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtO2(n: number) { return Math.round(n).toLocaleString(); }
function fmtUsd(n: number) { return '$' + n.toFixed(2); }

const TYPE_ICONS: Record<string, string> = {
  real_world_deal: '◈', payment: '⊕', service: '◇',
  agreement: '≡', contract: '⊗', agent_job: '⬡',
};

export default function ReceiptDetailClient({ receipt, userId }: Props) {
  const router = useRouter();
  const [signing, setSigning] = useState(false);
  const [toast, setToast] = useState('');

  const isPartyA = receipt.partyAId === userId;
  const isPartyB = receipt.partyBId === userId || receipt.ownerId === userId;
  const canSign = (isPartyA && !receipt.sigA) || (isPartyB && !receipt.sigB);
  const sealed = receipt.sigA && receipt.sigB;
  const icon = TYPE_ICONS[receipt.type] ?? '◈';
  const typeLabel = receipt.type.replace(/_/g, ' ').toUpperCase();
  const createdDate = fmtDate(receipt.createdAt);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  async function sign() {
    setSigning(true);
    try {
      const res = await fetch(`/api/receipts/${receipt.id}/sign`, { method: 'POST' });
      const data = await res.json() as { data: unknown; error: string | null };
      if (data.error) { showToast(data.error); return; }
      showToast('Stamped ✓');
      setTimeout(() => router.refresh(), 600);
    } catch {
      showToast('Failed to sign — please try again');
    } finally {
      setSigning(false);
    }
  }

  function copyShareLink() {
    if (!receipt.shareToken) { showToast('No share link available'); return; }
    navigator.clipboard.writeText(`${window.location.origin}/r/${receipt.shareToken}`).catch(() => {});
    showToast('Share link copied to clipboard');
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      {/* Header row */}
      <div className="sec-head">
        <div>
          <div className="sec-label">{'// RECEIPT'}</div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', letterSpacing: '.12em', color: 'var(--teal)', marginTop: '.2rem' }}>
            {receipt.receiptNumber}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          {sealed && (
            <a
              href={`/api/receipts/${receipt.id}/pdf`}
              download
              className="btn btn-outline btn-sm"
            >
              ↓ Export PDF
            </a>
          )}
          {receipt.shareToken && (
            <button className="btn btn-outline btn-sm" onClick={copyShareLink}>
              Copy Share Link
            </button>
          )}
          {canSign && (
            <button
              className="btn btn-gold btn-sm"
              onClick={sign}
              disabled={signing}
            >
              {signing ? '...' : '◈ Stamp It'}
            </button>
          )}
          <Link href="/dashboard/receipts" className="btn btn-ghost btn-sm">
            ← All Receipts
          </Link>
        </div>
      </div>

      {/* Document */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(150deg, #080a09 0%, #0e100e 50%, #080a09 100%)',
          border: `1px solid ${sealed ? 'rgba(76,175,128,.3)' : 'rgba(201,168,76,.28)'}`,
          borderRadius: 12,
          padding: '2.25rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: sealed
              ? 'linear-gradient(90deg, transparent 0%, #4CAF80 30%, var(--teal) 70%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--teal) 70%, transparent 100%)',
          }} />
          {/* Watermark */}
          <div style={{ position: 'absolute', bottom: -20, right: 10, fontFamily: 'var(--fs)', fontSize: '4.5rem', fontWeight: 600, color: sealed ? 'rgba(76,175,128,.035)' : 'rgba(201,168,76,.035)', letterSpacing: '.25em', pointerEvents: 'none', userSelect: 'none' }}>
            ATMOS
          </div>

          {/* Branding row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.14em' }}>ATMOS</div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--teal)', marginTop: 3 }}>AGENT ECONOMY PROTOCOL</div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.3rem' }}>
              <div style={{ display: 'flex', gap: '.4rem' }}>
                <Tag variant={sealed ? 'green' : receipt.sigA ? 'amber' : 'muted'}>
                  {sealed ? 'STAMPED ✓' : receipt.sigA ? 'AWAITING STAMP' : 'AWAITING STAMP'}
                </Tag>
                <Tag variant="teal">{typeLabel}</Tag>
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--muted)' }}>{createdDate}</div>
            </div>
          </div>

          {/* Receipt number */}
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.22em', color: 'var(--gold)', marginBottom: '.65rem' }}>
            {receipt.receiptNumber}
          </div>

          {/* Gold divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,.6), rgba(201,168,76,.1), transparent)', marginBottom: '1.75rem' }} />

          {/* Title */}
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.7rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.5rem', lineHeight: 1.2 }}>
            {icon} {receipt.title}
          </div>
          {receipt.description && (
            <div style={{ fontFamily: 'var(--fs)', fontSize: '.84rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '.5rem' }}>
              {receipt.description}
            </div>
          )}

          {/* Settlement */}
          {(receipt.settlementAmount || receipt.paymentMethod) && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 .85rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>SETTLEMENT</div>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
              </div>
              {receipt.settlementAmount && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', marginBottom: '.45rem' }}>
                  <span style={{ fontFamily: 'var(--fs)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--gl)', lineHeight: 1 }}>
                    {receipt.settlementAmount}
                  </span>
                  <span style={{ fontFamily: 'var(--fm)', fontSize: '.64rem', color: 'var(--teal)', letterSpacing: '.12em' }}>
                    {receipt.settlementCurrency.replace('_', ' ')}
                  </span>
                </div>
              )}
              {receipt.paymentMethod && (
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', letterSpacing: '.1em' }}>
                  VIA {receipt.paymentMethod.toUpperCase()}
                  {receipt.paymentNotes && (
                    <span style={{ color: 'var(--dim)' }}> · {receipt.paymentNotes}</span>
                  )}
                </div>
              )}
            </>
          )}

          {/* Compute breakdown for agent jobs */}
          {receipt.job && receipt.job.tokensIn != null && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 .85rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>COMPUTE</div>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                {[
                  ['Tokens In', receipt.job.tokensIn?.toLocaleString()],
                  ['Tokens Out', receipt.job.tokensOut?.toLocaleString()],
                  ['Compute', receipt.job.computeCostUsd != null ? fmtUsd(receipt.job.computeCostUsd) : null],
                  ['Platform Fee', receipt.job.platformFeeUsd != null ? fmtUsd(receipt.job.platformFeeUsd) : null],
                  ['O2 Cost', receipt.job.o2Cost != null ? fmtO2(receipt.job.o2Cost) + ' O2' : null],
                  ...(receipt.job.o2Refund && receipt.job.o2Refund > 0 ? [['Refund', '+' + fmtO2(receipt.job.o2Refund) + ' O2']] : []),
                ].filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k as string}>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--muted)', letterSpacing: '.1em', marginBottom: '.15rem' }}>{k}</div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--cream)' }}>{v}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Parties */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 .85rem' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>PARTIES</div>
            <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--gold)', marginBottom: '.4rem' }}>§ PARTY A</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.15rem' }}>{receipt.partyAName}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--gold)', marginBottom: '.4rem' }}>§ PARTY B</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.15rem' }}>{receipt.partyBName}</div>
            </div>
          </div>

          {/* Signatures */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0 .85rem' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>SIGNATURES</div>
            <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            {/* Party A sig */}
            <div style={{ flex: 1, border: `1px solid ${receipt.sigA ? 'rgba(76,175,128,.3)' : 'var(--b1)'}`, borderRadius: 'var(--r)', padding: '.6rem .85rem', background: receipt.sigA ? 'rgba(76,175,128,.06)' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: receipt.sigA ? '#4CAF80' : 'var(--dim)', flexShrink: 0 }} />
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.1em', color: receipt.sigA ? '#4CAF80' : 'var(--muted)' }}>
                  PARTY A · {receipt.sigA ? 'STAMPED' : 'PENDING'}
                </div>
                {receipt.sigAAt && (
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--dim)', marginTop: 2 }}>{fmtDate(receipt.sigAAt)}</div>
                )}
              </div>
            </div>
            {/* Party B sig */}
            <div style={{ flex: 1, border: `1px solid ${receipt.sigB ? 'rgba(76,175,128,.3)' : 'rgba(201,168,76,.2)'}`, borderRadius: 'var(--r)', padding: '.6rem .85rem', background: receipt.sigB ? 'rgba(76,175,128,.06)' : 'var(--surface)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              {receipt.sigB
                ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF80', flexShrink: 0 }} />
                : <div className="sig-dot pending" />
              }
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.1em', color: receipt.sigB ? '#4CAF80' : 'var(--gold)' }}>
                  PARTY B · {receipt.sigB ? 'STAMPED' : 'PENDING'}
                </div>
                {receipt.sigBAt && (
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--dim)', marginTop: 2 }}>{fmtDate(receipt.sigBAt)}</div>
                )}
                {!receipt.sigB && !receipt.sigBAt && (
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--dim)', marginTop: 2 }}>AWAITING STAMP</div>
                )}
              </div>
            </div>
          </div>

          {/* Sealed stamp */}
          {sealed && (
            <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
              <div style={{ border: '2px solid rgba(76,175,128,.4)', borderRadius: 8, padding: '.5rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '.6rem', background: 'rgba(76,175,128,.06)' }}>
                <span style={{ fontFamily: 'var(--fs)', fontSize: '1rem', color: '#4CAF80' }}>◈</span>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.2em', color: '#4CAF80' }}>STAMPED ON ATMOS</div>
                  {receipt.sealedAt && (
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--muted)', marginTop: 2 }}>{fmtDate(receipt.sealedAt)}</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sign CTA if applicable */}
        {canSign && (
          <div style={{ marginTop: '1.25rem' }}>
            <button
              className="btn btn-gold btn-lg btn-full"
              onClick={sign}
              disabled={signing}
              style={{ fontSize: '.78rem', padding: '1rem', letterSpacing: '.15em' }}
            >
              {signing ? '◈  Stamping...' : '◈  Stamp It'}
            </button>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', color: 'var(--muted)', textAlign: 'center', marginTop: '.6rem', letterSpacing: '.15em' }}>
              YOUR SIGNATURE IS PERMANENT AND CANNOT BE REVOKED
            </div>
          </div>
        )}
      </div>
    </>
  );
}
