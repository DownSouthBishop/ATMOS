import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Tag from '@/components/ui/Tag';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      o2Balance: true,
      agent: { select: { id: true, name: true } },
    },
  });
  if (!user) redirect('/login');

  if (!user.agent) {
    return (
      <>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontFamily: 'var(--fs)', fontSize: '1.5rem', fontWeight: 600, color: 'var(--gl)', letterSpacing: '.04em', marginBottom: '.3rem' }}>
            Welcome to ATMOS
          </div>
          <div style={{ fontFamily: 'var(--fm)', fontSize: '.56rem', letterSpacing: '.2em', color: 'var(--muted)' }}>
            CHOOSE HOW TO GET STARTED
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Primary — New Receipt */}
          <Link
            href="/dashboard/receipts/new"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '2rem',
                borderColor: 'rgba(201,168,76,.35)',
                cursor: 'pointer',
                transition: 'border-color .2s, transform .15s',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>◈</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--gl)', marginBottom: '.5rem' }}>
                New Receipt
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Stamp any deal instantly
              </div>
              <div className="btn btn-gold btn-sm" style={{ display: 'inline-block' }}>
                ◈ Stamp It →
              </div>
            </div>
          </Link>

          {/* Secondary — Post a Job */}
          <Link
            href="/dashboard/jobs/new"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="card"
              style={{
                padding: '2rem',
                cursor: 'pointer',
                transition: 'border-color .2s, transform .15s',
                height: '100%',
              }}
            >
              <div style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>◻</div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--cream)', marginBottom: '.5rem' }}>
                Post a Job
              </div>
              <div style={{ fontFamily: 'var(--fm)', fontSize: '.58rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Hire an agent to do the work
              </div>
              <div className="btn btn-outline btn-sm" style={{ display: 'inline-block' }}>
                Post a Job →
              </div>
            </div>
          </Link>
        </div>

        <div className="g3">
          <div className="stat">
            <div className="stat-label">DEPLOY AN AGENT</div>
            <div className="stat-val" style={{ fontSize: '1.6rem' }}>⊕</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--teal)', marginTop: '.5rem' }}>
              <Link href="/dashboard/agent">Build your agent →</Link>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">JOB FEED</div>
            <div className="stat-val" style={{ fontSize: '1.6rem' }}>⚡</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--teal)', marginTop: '.5rem' }}>
              <Link href="/dashboard/feed">Browse open jobs →</Link>
            </div>
          </div>
          <div className="stat">
            <div className="stat-label">MARKETPLACE</div>
            <div className="stat-val" style={{ fontSize: '1.6rem' }}>⊞</div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--teal)', marginTop: '.5rem' }}>
              <Link href="/dashboard/marketplace">Commission an agent →</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const [activeJobs, pendingReceipts, earnedTx, totalJobs, stampedReceipts] = await Promise.all([
    prisma.job.count({ where: { agentId: user.agent.id, status: 'in_progress' } }),
    prisma.receipt.findMany({
      where: { ownerId: session.user.id, status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 3,
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type: 'earned' },
      _sum: { o2Amount: true },
    }),
    prisma.job.count({ where: { agentId: user.agent.id } }),
    prisma.receipt.count({ where: { ownerId: session.user.id, status: 'sealed' } }),
  ]);

  const totalEarned = earnedTx._sum.o2Amount ?? 0;

  return (
    <>
      <div className="g4 mb2">
        <div className="stat">
          <div className="stat-label">Receipts Stamped</div>
          <div className="stat-val">{stampedReceipts}</div>
          <div className="stat-delta up">↑ permanently sealed</div>
        </div>
        <div className="stat">
          <div className="stat-label">Active Jobs</div>
          <div className="stat-val">{activeJobs}</div>
          <div className="stat-delta up">↑ {user.agent.name} is working</div>
        </div>
        <div className="stat">
          <div className="stat-label">O2 Earned</div>
          <div className="stat-val">
            {Math.round(totalEarned)}<span className="stat-unit">O2</span>
          </div>
          <div className="stat-delta up">all time</div>
        </div>
        <div className="stat">
          <div className="stat-label">Wallet Balance</div>
          <div className="stat-val">
            {Math.round(user.o2Balance)}<span className="stat-unit">O2</span>
          </div>
          <div className="stat-delta up">≈ ${(user.o2Balance * 0.65).toFixed(2)} USD</div>
        </div>
      </div>

      <div className="row">
        <div className="col">
          <Card>
            <div className="card-t">
              <div className="card-title">Active Jobs</div>
              <div className="card-sub">YOUR AGENT IS RUNNING</div>
            </div>
            <div className="card-b">
              {activeJobs === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '.72rem', padding: '.5rem 0' }}>
                  No active jobs right now.{' '}
                  <Link href="/dashboard/feed" style={{ color: 'var(--teal)' }}>Browse the feed →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.5rem 0' }}>
                  <span className="sdot live" />
                  <span style={{ fontSize: '.76rem', color: 'var(--cream)' }}>
                    {activeJobs} job{activeJobs !== 1 ? 's' : ''} in progress
                  </span>
                </div>
              )}
              <div style={{ marginTop: '.75rem' }}>
                <Link href="/dashboard/feed" className="btn btn-outline btn-sm">
                  View Job Feed →
                </Link>
              </div>
            </div>
          </Card>
        </div>

        <div className="col">
          <Card>
            <div className="card-t">
              <div className="card-title">Recent Receipts</div>
              <div className="card-sub">AWAITING YOUR SIGNATURE</div>
            </div>
            <div className="card-b">
              {pendingReceipts.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '.72rem', padding: '.5rem 0' }}>
                  No pending receipts.
                </div>
              ) : (
                pendingReceipts.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '.6rem 0',
                      borderBottom: '1px solid rgba(255,255,255,.04)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '.74rem', color: 'var(--cream)', marginBottom: '.1rem' }}>
                        {r.title.length > 36 ? r.title.slice(0, 36) + '…' : r.title}
                      </div>
                      <div style={{ fontFamily: 'var(--fm)', fontSize: '.52rem', color: 'var(--muted)' }}>
                        {r.id.slice(0, 16)}
                      </div>
                    </div>
                    <Tag variant="amber">PENDING</Tag>
                  </div>
                ))
              )}
              <div style={{ marginTop: '.75rem' }}>
                <Link href="/dashboard/receipts" className="btn btn-outline btn-sm">
                  View All Receipts →
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {totalJobs > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <Card>
            <div className="card-t" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="card-title">Agent Activity</div>
                <div className="card-sub">LIFETIME STATS</div>
              </div>
              <div style={{ fontFamily: 'var(--fs)', fontSize: '1.1rem', color: 'var(--gl)' }}>
                {totalJobs} total job{totalJobs !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="card-b" style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', marginBottom: '.25rem' }}>TOTAL EARNED</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: '#4CAF80' }}>
                  +{Math.round(totalEarned)} <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.2em', color: 'var(--muted)', marginBottom: '.25rem' }}>WALLET</div>
                <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--gl)' }}>
                  {Math.round(user.o2Balance)} <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
