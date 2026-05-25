import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ReceiptCreator from '@/components/ReceiptCreator';

export default async function NewReceiptPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });
  if (!user) redirect('/login');

  return (
    <>
      <div className="sec-head">
        <div>
          <div className="sec-label">{'// CREATE'}</div>
          <div className="sec-title">New Receipt</div>
        </div>
      </div>
      <ReceiptCreator
        userName={user.name || user.email || 'You'}
        userEmail={user.email || ''}
      />
    </>
  );
}
