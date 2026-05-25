'use client';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';

interface Tx {
  id: string;
  type: string;
  title: string;
  o2Amount: number;
  usdAmount: string | null;
  createdAt: string;
}

interface WalletClientProps {
  balance: number;
  transactions: Tx[];
  totalEarned: number;
  earnedJobs: number;
  totalSpent: number;
  spentJobs: number;
  weeklyEarned: number;
}

const TX_ICONS: Record<string, string> = {
  earned: '💼',
  deposit: '💰',
  spend: '⚡',
  escrow: '🔒',
  refund: '↩️',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function WalletClient({
  balance: initialBalance,
  transactions: initialTxs,
  totalEarned,
  earnedJobs,
  totalSpent,
  spentJobs,
  weeklyEarned,
}: WalletClientProps) {
  const [balance, setBalance] = useState(initialBalance);
  const [txs, setTxs] = useState(initialTxs);
  const [modalOpen, setModalOpen] = useState(false);
  const [usdInput, setUsdInput] = useState('');
  const [buying, setBuying] = useState(false);
  const [toast, setToast] = useState('');

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  const o2Preview = usdInput ? (parseFloat(usdInput) / 0.65).toFixed(2) : '0';

  async function handleBuyO2() {
    const usd = parseFloat(usdInput);
    if (!usd || usd <= 0) return;
    setBuying(true);
    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdAmount: usd }),
      });
      const data = await res.json() as { data: { o2Amount: number; newBalance: number } | null; error: string | null };
      if (data.error) { showToast(data.error); return; }
      if (data.data) {
        setBalance(data.data.newBalance);
        setTxs(prev => [{
          id: Date.now().toString(),
          type: 'deposit',
          title: 'O2 purchased via exchange',
          o2Amount: data.data!.o2Amount,
          usdAmount: '$' + usd.toFixed(2),
          createdAt: new Date().toISOString(),
        }, ...prev]);
        setModalOpen(false);
        setUsdInput('');
        showToast(`${Math.round(data.data.o2Amount)} O2 added to wallet`);
      }
    } catch {
      showToast('Purchase failed. Please try again.');
    } finally {
      setBuying(false);
    }
  }

  return (
    <>
      {/* Buy O2 modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        subtitle="// O2 EXCHANGE"
        title="Buy Oxygen"
        width="400px"
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={handleBuyO2} disabled={buying || !usdInput}>
              {buying ? 'Processing...' : 'Convert Now'}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">USD Amount</label>
          <input
            className="form-input"
            type="number"
            value={usdInput}
            onChange={e => setUsdInput(e.target.value)}
            placeholder="100"
            autoFocus
          />
        </div>
        <div style={{ textAlign: 'center', padding: '.4rem', fontFamily: 'var(--fm)', fontSize: '.6rem', color: 'var(--teal)' }}>
          ↓ &nbsp; 1 O2 = $0.65 USD · WCPI Live Rate &nbsp; ↓
        </div>
        <div className="form-group">
          <label className="form-label">You Receive (O2)</label>
          <input
            className="form-input"
            value={o2Preview}
            readOnly
            style={{ color: 'var(--gl)', fontFamily: 'var(--fs)', fontSize: '1.1rem' }}
          />
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      {/* Section header */}
      <div className="sec-head mb2">
        <div>
          <div className="sec-label">{'// FINANCE'}</div>
          <div className="sec-title">O2 Wallet</div>
        </div>
      </div>

      {/* Hero */}
      <div className="wallet-hero">
        <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.3em', color: 'var(--teal)', marginBottom: '.5rem' }}>
          YOUR O2 BALANCE
        </div>
        <div className="wallet-big">
          {Math.round(balance)} <sup>O2</sup>
        </div>
        <div className="wallet-usd">
          ≈ ${(balance * 0.65).toFixed(2)} USD &nbsp;·&nbsp; 1 O2 = $0.65 · WCPI Live
        </div>
        {weeklyEarned > 0 && (
          <div className="wallet-delta">↑ +{Math.round(weeklyEarned)} O2 earned this week</div>
        )}
        <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-gold" onClick={() => setModalOpen(true)}>Buy O2</button>
          <button className="btn btn-outline" onClick={() => showToast('Withdrawal to bank initiated. 1–2 business days.')}>
            Withdraw USD
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="g2 mb2">
        <div style={{ background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '.9rem 1.1rem' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', marginBottom: '.3rem' }}>TOTAL EARNED</div>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.6rem', fontWeight: 600, color: '#4CAF80' }}>
            +{Math.round(totalEarned)} O2
          </div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
            from {earnedJobs} completed job{earnedJobs !== 1 ? 's' : ''}
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--b1)', borderRadius: 'var(--r2)', padding: '.9rem 1.1rem' }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', marginBottom: '.3rem' }}>TOTAL SPENT</div>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--gl)' }}>
            {Math.round(totalSpent)} O2
          </div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
            on {spentJobs} commissioned task{spentJobs !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card">
        <div className="card-t">
          <div className="card-title">Transaction History</div>
          <div className="card-sub">ALL ACTIVITY</div>
        </div>
        <div>
          {txs.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.72rem' }}>
              No transactions yet.
            </div>
          ) : (
            txs.map(tx => {
              const isEarn = tx.type === 'earned' || tx.type === 'deposit' || tx.type === 'refund';
              return (
                <div key={tx.id} className="tx-row">
                  <div className={`tx-icon ${isEarn ? 'earn' : 'spend'}`}>
                    {TX_ICONS[tx.type] ?? '·'}
                  </div>
                  <div className="tx-info">
                    <div className="tx-title">{tx.title}</div>
                    <div className="tx-time">{timeAgo(tx.createdAt)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={`tx-amount ${isEarn ? 'earn' : 'spend'}`}>
                      {isEarn ? '+' : '-'}{Math.round(Math.abs(tx.o2Amount))} O2
                    </div>
                    {tx.usdAmount && (
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
                        {tx.usdAmount}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
