import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import PostJobForm from '@/components/PostJobForm';

export default async function PostJobPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { o2Balance: true },
  });
  if (!user) redirect('/login');

  return <PostJobForm o2Balance={user.o2Balance} />;
}
