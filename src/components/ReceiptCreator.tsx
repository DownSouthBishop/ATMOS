'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const RECEIPT_TYPES = [
  { id: 'real_world_deal', label: 'Real World Deal', icon: '◈', desc: 'Physical or in-person transaction' },
  { id: 'payment',         label: 'Payment',         icon: '⊕', desc: 'Direct money transfer between parties' },
  { id: 'service',         label: 'Service',         icon: '◇', desc: 'Professional services rendered' },
  { id: 'agreement',       label: 'Agreement',       icon: '≡', desc: 'Mutual terms accepted by both parties' },
  { id: 'contract',        label: 'Contract',        icon: '⊗', desc: 'Formal binding agreement' },
  { id: 'agent_job',       label: 'Agent Job',       icon: '⬡', desc: 'Automated AI agent work completed' },
];

const CURRENCIES = ['O2', 'USD', 'EUR', 'GBP', 'CAD', 'BTC', 'ETH', 'USDC', 'OTHER', 'OFF_PLATFORM'];
const PAYMENT_METHODS = ['O2', 'Card', 'Wire', 'Cash', 'Crypto', 'Venmo', 'PayPal', 'Zelle', 'Other'];

interface FormState {
  type: string;
  title: string;
  description: string;
  partyBName: string;
  partyBEmail: string;
  settlementCurrency: string;
  settlementAmount: string;
  paymentMethod: string;
  paymentNotes: string;
}

interface Props {
  userName: string;
  userEmail: string;
}

export default function ReceiptCreator({ userName, userEmail }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    type: '',
    title: '',
    description: '',
    partyBName: '',
    partyBEmail: '',
    settlementCurrency: 'USD',
    settlementAmount: '',
    paymentMethod: '',
    paymentNotes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function set(key: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const typeInfo = RECEIPT_TYPES.find(t => t.id === form.type);
  const canProceed1 = !!form.type;
  const canProceed2 = !!form.title.trim() && !!form.partyBName.trim();

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const previewNum = `ATMOS-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-XXXX`;

  async function executeAndSeal() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title,
          description: form.description || undefined,
          partyBName: form.partyBName,
          partyBEmail: form.partyBEmail || undefined,
          settlementCurrency: form.settlementCurrency,
          settlementAmount: form.settlementAmount || undefined,
          paymentMethod: form.paymentMethod || undefined,
          paymentNotes: form.paymentNotes || undefined,
        }),
      });

      const data = await res.json() as {
        data: { id: string; receiptNumber: string; shareToken: string | null } | null;
        error: string | null;
      };

      if (data.error || !data.data) {
        showToast(data.error ?? 'Failed to create receipt');
        return;
      }

      if (form.partyBEmail && data.data.shareToken) {
        const shareUrl = `${window.location.origin}/r/${data.data.shareToken}`;
        navigator.clipboard.writeText(shareUrl).catch(() => {});
        showToast(`${data.data.receiptNumber} · Share link copied`);
      } else {
        showToast(`${data.data.receiptNumber} · Stamped by Party A`);
      }

      setTimeout(() => router.push(`/dashboard/receipts/${data.data!.id}`), 900);
    } catch {
      showToast('Connection error — please try again');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Step indicator ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
          {/* Step 1 */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.28em', color: step > 1 ? 'var(--teal)' : step === 1 ? 'var(--gold)' : 'var(--dim)', marginBottom: '.15rem' }}>§ 01</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.2em', color: step > 1 ? 'var(--teal)' : step === 1 ? 'var(--gl)' : 'var(--muted)' }}>TYPE</div>
          </div>
          <div style={{ flex: 1, height: 1, background: step > 1 ? 'var(--teal)' : 'var(--b1)', margin: '10px 1rem 0', transition: 'background .4s' }} />
          {/* Step 2 */}
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.28em', color: step > 2 ? 'var(--teal)' : step === 2 ? 'var(--gold)' : 'var(--dim)', marginBottom: '.15rem' }}>§ 02</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.2em', color: step > 2 ? 'var(--teal)' : step === 2 ? 'var(--gl)' : 'var(--muted)' }}>TERMS</div>
          </div>
          <div style={{ flex: 1, height: 1, background: step > 2 ? 'var(--teal)' : 'var(--b1)', margin: '10px 1rem 0', transition: 'background .4s' }} />
          {/* Step 3 */}
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.28em', color: step === 3 ? 'var(--gold)' : 'var(--dim)', marginBottom: '.15rem' }}>§ 03</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', letterSpacing: '.2em', color: step === 3 ? 'var(--gl)' : 'var(--muted)' }}>EXECUTE</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress mb3">
          <div className="progress-fill" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>


        {/* ────────────────────────────────────── STEP 1 */}
        {step === 1 && (
          <>
            <div className="mb2">
              <div className="sec-label">{'// SELECT TYPE'}</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.02em', lineHeight: 1.1 }}>
                Choose Receipt Category
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--muted)', marginTop: '.5rem', letterSpacing: '.06em' }}>
                Every transaction deserves a record. Select the type that best describes this deal.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {RECEIPT_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => set('type', t.id)}
                  style={{
                    background: form.type === t.id ? 'var(--g10)' : 'var(--card)',
                    border: `1px solid ${form.type === t.id ? 'rgba(201,168,76,.45)' : 'var(--b1)'}`,
                    borderRadius: 'var(--r2)',
                    padding: '1.5rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all .2s',
                  }}
                >
                  {/* shimmer */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                    opacity: form.type === t.id ? 1 : 0,
                    transition: 'opacity .2s',
                  }} />
                  <div style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '2.2rem',
                    color: form.type === t.id ? 'var(--gl)' : 'var(--dim)',
                    marginBottom: '.65rem',
                    transition: 'color .2s',
                    lineHeight: 1,
                  }}>
                    {t.icon}
                  </div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '.9rem', fontWeight: 600, color: form.type === t.id ? 'var(--gl)' : 'var(--cream)', marginBottom: '.3rem', transition: 'color .2s' }}>
                    {t.label}
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', letterSpacing: '.06em', lineHeight: 1.5 }}>
                    {t.desc}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-gold btn-lg"
                onClick={() => setStep(2)}
                disabled={!canProceed1}
                style={{ opacity: canProceed1 ? 1 : 0.35, cursor: canProceed1 ? 'pointer' : 'not-allowed' }}
              >
                Continue → Define Terms
              </button>
            </div>
          </>
        )}


        {/* ────────────────────────────────────── STEP 2 */}
        {step === 2 && (
          <>
            <div className="mb2">
              <div className="sec-label">{'// 02 · TERMS & PARTIES'}</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.02em', lineHeight: 1.1 }}>
                Document the Deal
              </div>
            </div>

            {/* § 01 IDENTIFICATION */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.3em', color: 'var(--gold)', flexShrink: 0 }}>§ 01 · IDENTIFICATION</div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--b1), transparent)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Receipt Title <span style={{ color: 'var(--teal)' }}>*</span></label>
                <input
                  className="form-input"
                  placeholder="e.g. Website redesign, consulting agreement, asset sale..."
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  style={{ fontSize: '.85rem' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Description{' '}
                  <span style={{ color: 'var(--dim)', fontFamily: 'var(--fm)', fontSize: '.45rem' }}>OPTIONAL</span>
                </label>
                <textarea
                  className="form-input"
                  placeholder="Describe the work completed, transaction details, or agreement terms..."
                  rows={3}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  style={{ resize: 'none', lineHeight: 1.6 }}
                />
              </div>
            </div>

            {/* § 02 COUNTERPARTY */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.3em', color: 'var(--gold)', flexShrink: 0 }}>§ 02 · COUNTERPARTY</div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--b1), transparent)' }} />
              </div>
              <div className="g2">
                <div>
                  <label className="form-label">Party A — You</label>
                  <input
                    className="form-input"
                    value={userName || userEmail}
                    readOnly
                    style={{ opacity: 0.65, cursor: 'default', color: 'var(--teal)', fontFamily: 'var(--fm)', fontSize: '.65rem', letterSpacing: '.05em' }}
                  />
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', letterSpacing: '.15em', color: 'var(--dim)', marginTop: '.35rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4CAF80', display: 'inline-block', flexShrink: 0 }} />
                    SIGNING ON SUBMIT
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: '.75rem' }}>
                    <label className="form-label">Party B — Name <span style={{ color: 'var(--teal)' }}>*</span></label>
                    <input
                      className="form-input"
                      placeholder="Their name or business"
                      value={form.partyBName}
                      onChange={e => set('partyBName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Party B — Email{' '}
                      <span style={{ color: 'var(--dim)', fontFamily: 'var(--fm)', fontSize: '.45rem' }}>OPTIONAL · SENDS LINK</span>
                    </label>
                    <input
                      className="form-input"
                      placeholder="they@example.com"
                      type="email"
                      value={form.partyBEmail}
                      onChange={e => set('partyBEmail', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* § 03 SETTLEMENT */}
            <div style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.3em', color: 'var(--gold)', flexShrink: 0 }}>§ 03 · SETTLEMENT</div>
                <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--b1), transparent)' }} />
              </div>
              <div className="g2" style={{ marginBottom: '.9rem' }}>
                <div>
                  <label className="form-label">Currency</label>
                  <select
                    className="form-input form-select"
                    value={form.settlementCurrency}
                    onChange={e => set('settlementCurrency', e.target.value)}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>{c.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Amount{' '}
                    <span style={{ color: 'var(--dim)', fontFamily: 'var(--fm)', fontSize: '.45rem' }}>OPTIONAL</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g. 4500"
                    value={form.settlementAmount}
                    onChange={e => set('settlementAmount', e.target.value)}
                  />
                </div>
              </div>
              <div className="g2">
                <div>
                  <label className="form-label">
                    Payment Method{' '}
                    <span style={{ color: 'var(--dim)', fontFamily: 'var(--fm)', fontSize: '.45rem' }}>OPTIONAL</span>
                  </label>
                  <select
                    className="form-input form-select"
                    value={form.paymentMethod}
                    onChange={e => set('paymentMethod', e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">
                    Payment Notes{' '}
                    <span style={{ color: 'var(--dim)', fontFamily: 'var(--fm)', fontSize: '.45rem' }}>OPTIONAL</span>
                  </label>
                  <input
                    className="form-input"
                    placeholder="e.g. Wire ref #1234, paid in full"
                    value={form.paymentNotes}
                    onChange={e => set('paymentNotes', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '.5rem' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button
                className="btn btn-gold btn-lg"
                onClick={() => setStep(3)}
                disabled={!canProceed2}
                style={{ opacity: canProceed2 ? 1 : 0.35, cursor: canProceed2 ? 'pointer' : 'not-allowed' }}
              >
                Review & Sign →
              </button>
            </div>
          </>
        )}


        {/* ────────────────────────────────────── STEP 3 */}
        {step === 3 && (
          <>
            <div className="mb2">
              <div className="sec-label">{'// 03 · EXECUTE'}</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.02em', lineHeight: 1.1 }}>
                Review & Sign
              </div>
            </div>

            {/* ── Receipt document preview ── */}
            <div style={{
              background: 'linear-gradient(150deg, #080a09 0%, #0e100e 50%, #080a09 100%)',
              border: '1px solid rgba(201,168,76,.28)',
              borderRadius: 12,
              padding: '2rem',
              marginBottom: '1.5rem',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Top gradient bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 30%, var(--teal) 70%, transparent 100%)' }} />
              {/* Watermark */}
              <div style={{ position: 'absolute', bottom: -20, right: 10, fontFamily: 'var(--fs)', fontSize: '4.5rem', fontWeight: 600, color: 'rgba(201,168,76,.035)', letterSpacing: '.25em', pointerEvents: 'none', userSelect: 'none' }}>
                ATMOS
              </div>

              {/* Branding row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '1rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.14em' }}>ATMOS</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--teal)', marginTop: 3 }}>AGENT ECONOMY PROTOCOL</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.18em', color: 'var(--muted)', marginBottom: 3 }}>FOUNDING SEAL</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', letterSpacing: '.12em', color: 'var(--teal)' }}>
                    {typeInfo?.icon} {typeInfo?.label.toUpperCase() ?? form.type.replace(/_/g, ' ').toUpperCase()}
                  </div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--dim)', marginTop: 3 }}>{today}</div>
                </div>
              </div>

              {/* Receipt number */}
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.22em', color: 'var(--gold)', marginBottom: '.6rem' }}>
                {previewNum}
              </div>

              {/* Gold divider */}
              <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(201,168,76,.6), rgba(201,168,76,.1), transparent)', marginBottom: '1.5rem' }} />

              {/* Title */}
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.5rem', lineHeight: 1.2 }}>
                {form.title}
              </div>
              {form.description && (
                <div style={{ fontFamily: 'var(--fs)', fontSize: '.82rem', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: '.5rem' }}>
                  {form.description}
                </div>
              )}

              {/* Settlement block */}
              {(form.settlementAmount || form.paymentMethod) && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0 .8rem' }}>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>SETTLEMENT</div>
                    <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
                  </div>
                  {form.settlementAmount && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '.6rem', marginBottom: '.4rem' }}>
                      <span style={{ fontFamily: 'var(--fs)', fontSize: '2rem', fontWeight: 600, color: 'var(--gl)', lineHeight: 1 }}>
                        {form.settlementAmount}
                      </span>
                      <span style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--teal)', letterSpacing: '.12em' }}>
                        {form.settlementCurrency.replace('_', ' ')}
                      </span>
                    </div>
                  )}
                  {form.paymentMethod && (
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', letterSpacing: '.1em' }}>
                      VIA {form.paymentMethod.toUpperCase()}
                      {form.paymentNotes && (
                        <span style={{ color: 'var(--dim)' }}> · {form.paymentNotes}</span>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Parties */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0 .8rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>PARTIES</div>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--gold)', marginBottom: '.4rem' }}>§ PARTY A</div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '.95rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.15rem' }}>{userName}</div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', color: 'var(--muted)' }}>{userEmail}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', letterSpacing: '.28em', color: 'var(--gold)', marginBottom: '.4rem' }}>§ PARTY B</div>
                  <div style={{ fontFamily: 'var(--fs)', fontSize: '.95rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.15rem' }}>{form.partyBName}</div>
                  {form.partyBEmail && (
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', color: 'var(--muted)' }}>{form.partyBEmail}</div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.4rem 0 .8rem' }}>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.44rem', letterSpacing: '.28em', color: 'var(--muted)' }}>SIGNATURES</div>
                <div style={{ flex: 1, height: 1, background: 'var(--b1)' }} />
              </div>
              <div style={{ display: 'flex', gap: '.75rem' }}>
                <div style={{ flex: 1, border: '1px solid rgba(76,175,128,.3)', borderRadius: 'var(--r)', padding: '.5rem .75rem', background: 'rgba(76,175,128,.06)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF80', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', color: '#4CAF80', letterSpacing: '.1em' }}>PARTY A · STAMPED</div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--muted)', marginTop: 2 }}>{today}</div>
                  </div>
                </div>
                <div style={{ flex: 1, border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '.5rem .75rem', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div className="sig-dot pending" />
                  <div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', color: 'var(--gold)', letterSpacing: '.1em' }}>PARTY B · PENDING</div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.42rem', color: 'var(--dim)', marginTop: 2 }}>
                      {form.partyBEmail ? 'LINK WILL BE COPIED' : 'AWAITING STAMP'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Execute button */}
            <button
              className="btn btn-gold btn-lg btn-full"
              onClick={executeAndSeal}
              disabled={submitting}
              style={{ fontSize: '.82rem', padding: '1.1rem', opacity: submitting ? 0.7 : 1, letterSpacing: '.15em' }}
            >
              {submitting ? '◈  Stamping...' : '◈  Stamp It'}
            </button>

            <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', color: 'var(--muted)', textAlign: 'center', marginTop: '.8rem', letterSpacing: '.18em' }}>
              PARTY A SIGNATURE APPLIED IMMEDIATELY · PERMANENT RECORD ON ATMOS
            </div>
            {form.partyBEmail && (
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.46rem', color: 'var(--teal)', textAlign: 'center', marginTop: '.3rem', letterSpacing: '.12em' }}>
                SHARE LINK COPIED TO CLIPBOARD FOR PARTY B
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>← Edit Details</button>
            </div>
          </>
        )}

      </div>
    </>
  );
}
