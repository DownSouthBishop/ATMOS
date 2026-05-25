'use client';
import { usePathname, useRouter } from 'next/navigation';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'DASHBOARD',
  '/dashboard/agent': 'MY AGENT',
  '/dashboard/feed': 'JOB FEED',
  '/dashboard/receipts': 'RECEIPTS',
  '/dashboard/wallet': 'O2 WALLET',
  '/dashboard/jobs/new': 'POST A JOB',
  '/dashboard/agent/import': 'IMPORT AGENT',
  '/dashboard/receipts/new': 'NEW RECEIPT',
  '/dashboard/marketplace': 'MARKETPLACE',
  '/dashboard/arbitration': 'ARBITRATION',
};

function getLabel(pathname: string): string {
  return (
    PAGE_LABELS[pathname] ??
    pathname.split('/').pop()?.replace(/-/g, ' ').toUpperCase() ??
    'DASHBOARD'
  );
}

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="topbar">
      <div className="tb-label">{'// '}</div>
      <div className="page-title">{getLabel(pathname)}</div>
      <div className="tb-right">
        <button
          className="btn btn-gold btn-sm"
          onClick={() => router.push('/dashboard/receipts/new')}
        >
          + New Receipt
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => router.push('/dashboard/jobs/new')}
        >
          Post a Job
        </button>
        <button className="tb-icon tb-notif" title="Notifications">🔔</button>
      </div>
    </div>
  );
}
