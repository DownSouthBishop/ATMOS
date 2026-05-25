'use client';
import { useState } from 'react';

interface PublicReceipt {
  id: string;
  receiptNumber: string;
  type: string;
  title: string;
  description: string | null;
  partyAName: string;
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
  createdAt: string;
}

interface Props {
  receipt: PublicReceipt;
  token: string;
}

const TYPE_LABELS: Record<string, string> = {
  real_world: 'REAL WORLD DEAL',
  payment: 'PAYMENT',
  service: 'SERVICE',
  agreement: 'AGREEMENT',
  contract: 'CONTRACT',
  agent_job: 'AGENT JOB',
  job_completion: 'JOB COMPLETION',
};

function GoldStamp({ date }: { date: string }) {
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180 - Math.PI / 2;
    const outerR = 54;
    const innerR = i % 6 === 0 ? 46 : 50;
    return {
      x1: 60 + outerR * Math.cos(angle),
      y1: 60 + outerR * Math.sin(angle),
      x2: 60 + innerR * Math.cos(angle),
      y2: 60 + innerR * Math.sin(angle),
      major: i % 6 === 0,
    };
  });

  return (
    <svg
      width="148"
      height="148"
      viewBox="0 0 120 120"
      aria-label="ATMOS verified stamp"
      style={{
        transform: 'rotate(15deg)',
        filter: 'drop-shadow(0 0 18px rgba(201,168,76,0.55))',
        opacity: 0.93,
      }}
    >
      <defs>
        <path id="stamp-top-arc" d="M 13,60 A 47,47 0 0,1 107,60" />
      </defs>

      {/* Outer ring */}
      <circle cx="60" cy="60" r="56" fill="none" stroke="var(--gold)" strokeWidth="2.5" />
      {/* Inner ring */}
      <circle cx="60" cy="60" r="50" fill="none" stroke="var(--gold)" strokeWidth="0.5" opacity="0.38" />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="var(--gold)"
          strokeWidth={t.major ? 1.6 : 0.75}
          opacity={t.major ? 0.85 : 0.32}
        />
      ))}

      {/* "STAMPED" along top arc */}
      <text
        fill="var(--gold)"
        fontFamily="'Syne Mono', monospace"
        fontSize="8"
        letterSpacing="6"
      >
        <textPath href="#stamp-top-arc" startOffset="50%" textAnchor="middle">
          STAMPED
        </textPath>
      </text>

      {/* ATMOS center */}
      <text
        x="60"
        y="56"
        textAnchor="middle"
        fill="var(--gold)"
        fontFamily="'Cormorant Garamond', serif"
        fontSize="16"
        fontWeight="700"
        letterSpacing="5"
      >
        ATMOS
      </text>

      {/* Divider line */}
      <line x1="36" y1="62" x2="84" y2="62" stroke="var(--gold)" strokeWidth="0.6" opacity="0.5" />

      {/* VERIFIED */}
      <text
        x="60"
        y="72"
        textAnchor="middle"
        fill="var(--gold)"
        fontFamily="'Syne Mono', monospace"
        fontSize="6"
        letterSpacing="3"
        opacity="0.72"
      >
        VERIFIED
      </text>

      {/* Date */}
      <text
        x="60"
        y="87"
        textAnchor="middle"
        fill="var(--gold)"
        fontFamily="'Syne Mono', monospace"
        fontSize="6"
        letterSpacing="1.5"
        opacity="0.6"
      >
        {date}
      </text>
    </svg>
  );
}

export default function PublicReceiptView({ receipt: initialReceipt, token }: Props) {
  const [receipt, setReceipt] = useState(initialReceipt);
  const [signName, setSignName] = useState('');
  const [inputFocused, setInputFocused] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');
  const [justSigned, setJustSigned] = useState(false);

  const sealed = receipt.status === 'sealed';
  const canSign = !receipt.sigB && receipt.sigA;

  async function handleSign() {
    if (!signName.trim()) {
      setSignError('Please enter your full name to continue.');
      return;
    }
    setSigning(true);
    setSignError('');
    try {
      const res = await fetch(`/api/r/${token}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signName.trim() }),
      });
      const json = await res.json() as {
        data: { status: string; sealedAt: string | null } | null;
        error: string | null;
      };
      if (json.error) {
        setSignError(json.error);
        return;
      }
      const now = new Date().toISOString();
      setReceipt(prev => ({
        ...prev,
        sigB: true,
        sigBAt: now,
        partyBName: signName.trim(),
        status: json.data?.status ?? 'sealed',
        sealedAt: json.data?.sealedAt ?? now,
      }));
      setJustSigned(true);
    } catch {
      setSignError('Network error. Please try again.');
    } finally {
      setSigning(false);
    }
  }

  function fmtLong(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function fmtShort(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const typeLabel =
    TYPE_LABELS[receipt.type] ?? receipt.type.replace(/_/g, ' ').toUpperCase();
  const stampDate = fmtShort(receipt.sealedAt ?? receipt.createdAt);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        background: 'var(--black)',
      }}
    >
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '0 24px 100px' }}>

        {/* ── Topbar ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '28px 0 24px',
            borderBottom: '1px solid rgba(201,168,76,0.1)',
            marginBottom: '56px',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--ff)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '5px',
              color: 'var(--gold)',
            }}
          >
            ATMOS
          </span>
          <span
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '9px',
              letterSpacing: '3px',
              color: 'var(--muted)',
            }}
          >
            Every receipt. Stamped.
          </span>
        </div>

        {/* ── Receipt Card ── */}
        <div
          style={{
            position: 'relative',
            background: 'var(--card)',
            borderRadius: 'var(--r2)',
            padding: '52px 56px 60px',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: sealed
              ? 'inset 0 2px 0 var(--gold), 0 0 60px rgba(201,168,76,0.06)'
              : 'inset 0 2px 0 rgba(201,168,76,0.22)',
            overflow: 'visible',
          }}
        >
          {/* ── Card header ── */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '44px',
            }}
          >
            <div style={{ flex: 1, marginRight: '32px' }}>
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '9px',
                  letterSpacing: '3px',
                  color: 'var(--muted)',
                  marginBottom: '12px',
                }}
              >
                {typeLabel}
              </div>
              <div
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '38px',
                  lineHeight: 1.1,
                  color: 'var(--cream)',
                  fontWeight: 300,
                }}
              >
                {receipt.title}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '10px',
                  color: 'var(--gold)',
                  letterSpacing: '1px',
                  marginBottom: '8px',
                }}
              >
                {receipt.receiptNumber}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '3px',
                  fontFamily: 'var(--fm)',
                  fontSize: '8px',
                  letterSpacing: '2px',
                  background: sealed
                    ? 'rgba(201,168,76,0.1)'
                    : 'rgba(255,255,255,0.04)',
                  color: sealed ? 'var(--gold)' : 'var(--muted)',
                  border: sealed
                    ? '1px solid rgba(201,168,76,0.28)'
                    : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {sealed ? '◈ STAMPED' : '◇ PENDING'}
              </div>
            </div>
          </div>

          {/* ── Description ── */}
          {receipt.description && (
            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '18px',
                color: 'var(--muted)',
                lineHeight: 1.75,
                marginBottom: '44px',
                paddingBottom: '44px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {receipt.description}
            </div>
          )}

          {/* ── §01 PARTIES ── */}
          <div style={{ marginBottom: '40px' }}>
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '8px',
                letterSpacing: '3px',
                color: 'var(--muted)',
                marginBottom: '20px',
              }}
            >
              §01 · PARTIES
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Party A */}
              <div
                style={{
                  padding: '22px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--r)',
                  border: receipt.sigA
                    ? '1px solid rgba(201,168,76,0.18)'
                    : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '8px',
                    letterSpacing: '2px',
                    color: 'var(--muted)',
                    marginBottom: '10px',
                  }}
                >
                  PARTY A
                </div>
                <div
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '22px',
                    color: 'var(--cream)',
                    marginBottom: '14px',
                  }}
                >
                  {receipt.partyAName || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {receipt.sigA ? (
                    <>
                      <span style={{ color: 'var(--gold)' }}>◈</span>
                      <span
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '8px',
                          letterSpacing: '1.5px',
                          color: 'var(--gold)',
                        }}
                      >
                        STAMPED{receipt.sigAAt ? ` · ${fmtShort(receipt.sigAAt)}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--muted)' }}>◇</span>
                      <span
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '8px',
                          letterSpacing: '1.5px',
                          color: 'var(--muted)',
                        }}
                      >
                        AWAITING STAMP
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Party B */}
              <div
                style={{
                  padding: '22px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--r)',
                  border: receipt.sigB
                    ? '1px solid rgba(201,168,76,0.18)'
                    : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '8px',
                    letterSpacing: '2px',
                    color: 'var(--muted)',
                    marginBottom: '10px',
                  }}
                >
                  PARTY B
                </div>
                <div
                  style={{
                    fontFamily: 'var(--fs)',
                    fontSize: '22px',
                    color: 'var(--cream)',
                    marginBottom: '14px',
                  }}
                >
                  {receipt.partyBName || '—'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {receipt.sigB ? (
                    <>
                      <span style={{ color: 'var(--gold)' }}>◈</span>
                      <span
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '8px',
                          letterSpacing: '1.5px',
                          color: 'var(--gold)',
                        }}
                      >
                        STAMPED{receipt.sigBAt ? ` · ${fmtShort(receipt.sigBAt)}` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ color: 'var(--muted)' }}>◇</span>
                      <span
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '8px',
                          letterSpacing: '1.5px',
                          color: 'var(--muted)',
                        }}
                      >
                        AWAITING STAMP
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── §02 SETTLEMENT ── */}
          {(receipt.settlementAmount ?? receipt.paymentMethod) && (
            <div style={{ marginBottom: '40px' }}>
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '8px',
                  letterSpacing: '3px',
                  color: 'var(--muted)',
                  marginBottom: '20px',
                }}
              >
                §02 · SETTLEMENT
              </div>

              <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {receipt.settlementAmount && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '8px',
                        letterSpacing: '2px',
                        color: 'var(--muted)',
                        marginBottom: '8px',
                      }}
                    >
                      AMOUNT
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--fs)',
                        fontSize: '36px',
                        color: 'var(--gold)',
                        fontWeight: 300,
                        lineHeight: 1,
                      }}
                    >
                      {receipt.settlementAmount}
                      <span
                        style={{
                          fontFamily: 'var(--fm)',
                          fontSize: '11px',
                          color: 'var(--muted)',
                          marginLeft: '10px',
                          verticalAlign: 'middle',
                        }}
                      >
                        {receipt.settlementCurrency}
                      </span>
                    </div>
                  </div>
                )}

                {receipt.paymentMethod && (
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--fm)',
                        fontSize: '8px',
                        letterSpacing: '2px',
                        color: 'var(--muted)',
                        marginBottom: '8px',
                      }}
                    >
                      METHOD
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--ff)',
                        fontSize: '15px',
                        color: 'var(--cream)',
                      }}
                    >
                      {receipt.paymentMethod.replace(/_/g, ' ').toUpperCase()}
                    </div>
                  </div>
                )}
              </div>

              {receipt.paymentNotes && (
                <div
                  style={{
                    marginTop: '20px',
                    fontFamily: 'var(--fs)',
                    fontSize: '15px',
                    color: 'var(--muted)',
                    lineHeight: 1.6,
                  }}
                >
                  {receipt.paymentNotes}
                </div>
              )}
            </div>
          )}

          {/* ── §03 RECORD ── */}
          <div
            style={{
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '8px',
                letterSpacing: '3px',
                color: 'var(--muted)',
                marginBottom: '18px',
              }}
            >
              §03 · RECORD
            </div>

            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '7px',
                    letterSpacing: '1.5px',
                    color: 'var(--muted)',
                    marginBottom: '5px',
                  }}
                >
                  ISSUED
                </div>
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '11px',
                    color: 'var(--cream)',
                  }}
                >
                  {fmtLong(receipt.createdAt)}
                </div>
              </div>

              {receipt.sealedAt && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '7px',
                      letterSpacing: '1.5px',
                      color: 'var(--muted)',
                      marginBottom: '5px',
                    }}
                  >
                    STAMPED
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--fm)',
                      fontSize: '11px',
                      color: 'var(--gold)',
                    }}
                  >
                    {fmtLong(receipt.sealedAt)}
                  </div>
                </div>
              )}

              <div>
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '7px',
                    letterSpacing: '1.5px',
                    color: 'var(--muted)',
                    marginBottom: '5px',
                  }}
                >
                  PLATFORM
                </div>
                <div
                  style={{
                    fontFamily: 'var(--fm)',
                    fontSize: '11px',
                    color: 'var(--cream)',
                  }}
                >
                  ATMOS
                </div>
              </div>
            </div>
          </div>

          {/* ── Gold Stamp ── */}
          {sealed && (
            <div
              style={{
                position: 'absolute',
                bottom: '-20px',
                right: '44px',
                pointerEvents: 'none',
              }}
            >
              <GoldStamp date={stampDate} />
            </div>
          )}
        </div>

        {/* ── Sign CTA ── */}
        {canSign && !justSigned && (
          <div
            style={{
              marginTop: '32px',
              padding: '44px 56px 40px',
              background: 'var(--card)',
              borderRadius: 'var(--r2)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: 'inset 0 2px 0 rgba(201,168,76,0.3)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '8px',
                letterSpacing: '3px',
                color: 'var(--muted)',
                marginBottom: '14px',
              }}
            >
              § YOUR SIGNATURE
            </div>

            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '26px',
                color: 'var(--cream)',
                fontWeight: 300,
                marginBottom: '8px',
              }}
            >
              Apply Your Signature
            </div>

            <div
              style={{
                fontFamily: 'var(--fs)',
                fontSize: '16px',
                color: 'var(--muted)',
                lineHeight: 1.7,
                marginBottom: '32px',
              }}
            >
              You have been named as a counterparty on this receipt.
              Enter your name to stamp the record permanently.
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <input
                type="text"
                value={signName}
                onChange={e => setSignName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleSign(); }}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Your full name"
                autoComplete="name"
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: `1px solid ${inputFocused ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 'var(--r)',
                  padding: '14px 18px',
                  fontFamily: 'var(--ff)',
                  fontSize: '14px',
                  color: 'var(--cream)',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
              />
              <button
                onClick={() => void handleSign()}
                disabled={signing}
                style={{
                  background: 'var(--gold)',
                  color: 'var(--black)',
                  border: 'none',
                  borderRadius: 'var(--r)',
                  padding: '14px 32px',
                  fontFamily: 'var(--ff)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  cursor: signing ? 'not-allowed' : 'pointer',
                  opacity: signing ? 0.65 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'opacity 0.15s',
                }}
              >
                {signing ? 'Stamping...' : 'Stamp It →'}
              </button>
            </div>

            {signError && (
              <div
                style={{
                  fontFamily: 'var(--fm)',
                  fontSize: '10px',
                  color: '#e57373',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                {signError}
              </div>
            )}

            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '9px',
                color: 'var(--muted)',
                letterSpacing: '0.5px',
                lineHeight: 1.7,
                marginTop: '8px',
              }}
            >
              By signing, you confirm the terms stated above are accurate.
              Your name will be recorded as the official counterparty signature.
              No account required.
            </div>
          </div>
        )}

        {/* ── Signed confirmation ── */}
        {justSigned && (
          <div
            style={{
              marginTop: '24px',
              padding: '24px 32px',
              background: 'rgba(201,168,76,0.06)',
              borderRadius: 'var(--r2)',
              border: '1px solid rgba(201,168,76,0.28)',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ff)',
                fontSize: '22px',
                color: 'var(--gold)',
                lineHeight: 1,
              }}
            >
              ◈
            </span>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--ff)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'var(--gold)',
                  marginBottom: '4px',
                  letterSpacing: '0.5px',
                }}
              >
                Stamped
              </div>
              <div
                style={{
                  fontFamily: 'var(--fs)',
                  fontSize: '16px',
                  color: 'var(--muted)',
                }}
              >
                Both parties have stamped this receipt. Permanently sealed.
              </div>
            </div>
            <a
              href={`/api/r/${token}/pdf`}
              download
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: 'var(--r)',
                flexShrink: 0,
              }}
            >
              ↓ Export PDF
            </a>
          </div>
        )}

        {/* ── Already sealed message (if they visit after both signed) ── */}
        {sealed && !canSign && !justSigned && (
          <div
            style={{
              marginTop: '28px',
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                opacity: 0.7,
              }}
            >
              ◈ THIS RECEIPT IS STAMPED
            </div>
            <a
              href={`/api/r/${token}/pdf`}
              download
              style={{
                fontFamily: 'var(--fm)',
                fontSize: '10px',
                letterSpacing: '2px',
                color: 'var(--muted)',
                textDecoration: 'none',
                padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--r)',
              }}
            >
              ↓ PDF
            </a>
          </div>
        )}

        {/* ── Acquisition Footer ── */}
        <div
          style={{
            textAlign: 'center',
            padding: '64px 0 40px',
            marginTop: '64px',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--fm)',
              fontSize: '9px',
              letterSpacing: '2px',
              color: 'var(--muted)',
              marginBottom: '16px',
              opacity: 0.6,
            }}
          >
            RECORD WHAT MATTERS
          </div>
          <a
            href="/register"
            style={{
              display: 'inline-block',
              fontFamily: 'var(--fm)',
              fontSize: '10px',
              letterSpacing: '3px',
              color: 'var(--muted)',
              textDecoration: 'none',
              padding: '10px 24px',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--r)',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            Stamp your own receipts — ATMOS
          </a>
        </div>

      </div>
    </div>
  );
}
