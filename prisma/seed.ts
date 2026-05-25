import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('atmos123', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@atmos.io' },
    update: {},
    create: {
      email: 'demo@atmos.io',
      name: 'Demo User',
      password: passwordHash,
      o2Balance: 248,
    },
  });

  const client = await prisma.user.upsert({
    where: { email: 'client@atmos.io' },
    update: {},
    create: {
      email: 'client@atmos.io',
      name: 'Alex Client',
      password: passwordHash,
      o2Balance: 500,
    },
  });

  const jobs = await Promise.all([
    prisma.job.upsert({
      where: { id: 'seed-job-1' },
      update: {},
      create: {
        id: 'seed-job-1',
        title: 'Write a market analysis report',
        description: 'Analyze current trends in the renewable energy sector and produce a 2-page executive summary.',
        category: 'research',
        o2Budget: 45,
        timeLimit: '2h',
        status: 'open',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-2' },
      update: {},
      create: {
        id: 'seed-job-2',
        title: 'Summarize 10 research papers',
        description: 'Read and summarize 10 provided academic papers on LLM alignment into a structured document.',
        category: 'research',
        o2Budget: 80,
        timeLimit: '4h',
        status: 'open',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-3' },
      update: {},
      create: {
        id: 'seed-job-3',
        title: 'Draft cold outreach email sequence',
        description: 'Create a 5-email B2B cold outreach sequence targeting SaaS founders.',
        category: 'writing',
        o2Budget: 30,
        timeLimit: '1h',
        status: 'completed',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-4' },
      update: {},
      create: {
        id: 'seed-job-4',
        title: 'Translate product page to Spanish',
        description: 'Translate a 500-word SaaS product landing page from English to Latin American Spanish.',
        category: 'translation',
        o2Budget: 20,
        status: 'open',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-5' },
      update: {},
      create: {
        id: 'seed-job-5',
        title: 'Build a Python data pipeline script',
        description: 'Write a Python script that pulls data from a REST API, cleans it, and outputs a CSV.',
        category: 'coding',
        o2Budget: 120,
        timeLimit: '6h',
        status: 'open',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-6' },
      update: {},
      create: {
        id: 'seed-job-6',
        title: 'Create social media content calendar',
        description: 'Plan 30 days of LinkedIn + Twitter content for a B2B fintech brand.',
        category: 'marketing',
        o2Budget: 55,
        timeLimit: '3h',
        status: 'in_progress',
        postedById: client.id,
      },
    }),
    prisma.job.upsert({
      where: { id: 'seed-job-7' },
      update: {},
      create: {
        id: 'seed-job-7',
        title: 'Audit website copy for SEO',
        description: 'Review all pages of a 10-page SaaS website and provide keyword and copy recommendations.',
        category: 'marketing',
        o2Budget: 65,
        status: 'open',
        postedById: client.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.receipt.upsert({
      where: { id: 'seed-receipt-1' },
      update: {},
      create: {
        id: 'seed-receipt-1',
        receiptNumber: 'RCP-SEED-001',
        type: 'job_completion',
        title: 'Cold outreach email sequence',
        partyAId: demo.id,
        partyAName: 'Demo User',
        partyBId: client.id,
        partyBName: 'Alex Client',
        settlementCurrency: 'O2',
        settlementAmount: '30',
        status: 'sealed',
        sigA: true,
        sigB: true,
        jobId: jobs[2].id,
        ownerId: demo.id,
      },
    }),
    prisma.receipt.upsert({
      where: { id: 'seed-receipt-2' },
      update: {},
      create: {
        id: 'seed-receipt-2',
        receiptNumber: 'RCP-SEED-002',
        type: 'job_completion',
        title: 'Market analysis draft',
        partyAId: demo.id,
        partyAName: 'Demo User',
        partyBId: client.id,
        partyBName: 'Alex Client',
        settlementCurrency: 'O2',
        settlementAmount: '45',
        status: 'pending',
        sigA: true,
        sigB: false,
        jobId: jobs[0].id,
        ownerId: demo.id,
      },
    }),
    prisma.receipt.upsert({
      where: { id: 'seed-receipt-3' },
      update: {},
      create: {
        id: 'seed-receipt-3',
        receiptNumber: 'RCP-SEED-003',
        type: 'deposit',
        title: 'O2 balance top-up',
        partyAName: 'ATMOS',
        partyBId: demo.id,
        partyBName: 'Demo User',
        settlementCurrency: 'O2',
        settlementAmount: '100',
        status: 'sealed',
        sigA: true,
        sigB: true,
        ownerId: demo.id,
      },
    }),
    prisma.receipt.upsert({
      where: { id: 'seed-receipt-4' },
      update: {},
      create: {
        id: 'seed-receipt-4',
        receiptNumber: 'RCP-SEED-004',
        type: 'deposit',
        title: 'O2 balance top-up',
        partyAName: 'ATMOS',
        partyBId: client.id,
        partyBName: 'Alex Client',
        settlementCurrency: 'O2',
        settlementAmount: '500',
        status: 'sealed',
        sigA: true,
        sigB: true,
        ownerId: client.id,
      },
    }),
    prisma.receipt.upsert({
      where: { id: 'seed-receipt-5' },
      update: {},
      create: {
        id: 'seed-receipt-5',
        receiptNumber: 'RCP-SEED-005',
        type: 'job_completion',
        title: 'Content calendar — social media',
        partyAId: demo.id,
        partyAName: 'Demo User',
        partyBId: client.id,
        partyBName: 'Alex Client',
        settlementCurrency: 'O2',
        settlementAmount: '55',
        status: 'pending',
        sigA: false,
        sigB: false,
        jobId: jobs[5].id,
        ownerId: demo.id,
      },
    }),
  ]);

  await Promise.all([
    prisma.transaction.upsert({
      where: { id: 'seed-tx-1' },
      update: {},
      create: {
        id: 'seed-tx-1',
        type: 'deposit',
        title: 'Initial O2 deposit',
        o2Amount: 248,
        usdAmount: '$161.20',
        userId: demo.id,
      },
    }),
    prisma.transaction.upsert({
      where: { id: 'seed-tx-2' },
      update: {},
      create: {
        id: 'seed-tx-2',
        type: 'earned',
        title: 'O2 earned from job: Cold outreach email sequence',
        o2Amount: 30,
        jobId: jobs[2].id,
        userId: demo.id,
      },
    }),
    prisma.transaction.upsert({
      where: { id: 'seed-tx-3' },
      update: {},
      create: {
        id: 'seed-tx-3',
        type: 'deposit',
        title: 'Initial O2 deposit',
        o2Amount: 500,
        usdAmount: '$325.00',
        userId: client.id,
      },
    }),
  ]);

  console.log('Seed complete. Demo user: demo@atmos.io / atmos123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
