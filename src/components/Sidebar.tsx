'use client';
import { useRouter } from 'next/navigation';
import NavItem from '@/components/ui/NavItem';
import { formatO2, o2ToUsd } from '@/lib/o2';

interface SidebarProps {
  o2Balance: number;
  agent: {
    name: string;
    specialties: string;
    isLive: boolean;
  } | null;
}

export default function Sidebar({ o2Balance, agent }: SidebarProps) {
  const router = useRouter();
  const usd = o2ToUsd(o2Balance);

  let firstSpecialty = '';
  if (agent) {
    try {
      const specs = JSON.parse(agent.specialties) as string[];
      firstSpecialty = specs[0] ?? '';
    } catch {
      firstSpecialty = '';
    }
  }

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div className="sb-logo">ATMOS</div>
        <div className="sb-sub">Every receipt. Stamped.</div>
      </div>

      <nav className="sb-nav">
        <div className="nav-section">Core</div>
        <NavItem href="/dashboard/receipts/new" icon="◈" label="New Receipt" />
        <NavItem href="/dashboard/receipts" icon="◻" label="Receipts" />
        <NavItem href="/dashboard/feed" icon="⚡" label="Job Feed" />
        <NavItem href="/dashboard/marketplace" icon="⊞" label="Marketplace" />
        <div className="nav-section">Account</div>
        <NavItem href="/dashboard" icon="⊡" label="Dashboard" />
        <NavItem href="/dashboard/agent" icon="⊕" label="My Agent" />
        <NavItem href="/dashboard/arbitration" icon="⊗" label="Arbitration" />
        <div className="nav-section">Finance</div>
        <NavItem href="/dashboard/wallet" icon="◎" label="O2 Wallet" />
      </nav>

      <div className="sb-wallet">
        <div className="w-label">O2 BALANCE</div>
        <div>
          <span className="w-amount">{formatO2(o2Balance)}</span>
          <span className="w-unit">O2</span>
        </div>
        <div className="w-usd">≈ ${usd.toFixed(2)} USD</div>
        <div className="w-actions">
          <button className="w-btn" onClick={() => router.push('/dashboard/wallet')}>
            Buy O2
          </button>
          <button className="w-btn" onClick={() => router.push('/dashboard/wallet')}>
            History
          </button>
        </div>
      </div>

      {agent ? (
        <div className="sb-agent-box">
          <div className={`agent-av${agent.isLive ? '' : ' offline'}`}>
            {agent.name[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <div className="agent-name-sm">{agent.name}</div>
            <div className="agent-role-sm">
              {agent.isLive
                ? `ACTIVE · ${firstSpecialty}`
                : `OFFLINE · ${firstSpecialty || 'DEPLOY'}`}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ margin: '.75rem', marginTop: 0 }}>
          <button
            className="btn btn-gold btn-sm btn-full"
            onClick={() => router.push('/dashboard/receipts/new')}
          >
            + New Receipt
          </button>
        </div>
      )}
    </aside>
  );
}
