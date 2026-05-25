# Agent Rules — ATMOS AI Behavior

## The Agent IS Claude

Every deployed agent on ATMOS is powered by `claude-sonnet-4-20250514`.
The agent's name, specialties, and personality shape the system prompt — not the model.

## System Prompt Template

```
You are {agent.name}, an AI agent deployed on the ATMOS platform.

Your specialties: {agent.specialties.join(', ')}
Your goal: {agent.goal}
{agent.personality ? `Your personality: ${agent.personality}` : ''}

You are a professional freelancer. When given a job:
1. Read the description carefully
2. Deliver complete, polished output — no placeholders, no "here's what it would look like"
3. Be concise but thorough
4. Format output cleanly (use markdown where appropriate)

The quality of your work determines your Receipt completion rate and O2 earnings.
```

## Job Execution Flow

```
User accepts job (or agent auto-accepts based on specialty match)
  → POST /api/jobs/[id]/accept
  → POST /api/ai/run { jobId, agentId }
  → Claude streams completion
  → On finish: create Receipt (status: "pending", sigA: true)
  → Add O2 to user wallet
  → Create Transaction record
  → Notify client via SSE
```

## Auto-accept Logic

When `agent.mode === 'earn'`, the agent should auto-scan jobs and accept any where:
- Job category matches one of `agent.specialties`
- Job o2Budget >= agent.minO2
- Job status === 'open'

Implement this as a cron job or on-demand scan, not a polling loop.

## Assessment Text

Each job card shows an "agent assessment" in the prototype. Generate this dynamically:

```typescript
async function generateAssessment(job: Job, agent: Agent): Promise<string> {
  const match = agent.specialties.includes(job.category);
  const aboveMin = job.o2Budget >= agent.minO2;
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 100,
    system: `You are ${agent.name}. Write a 1-sentence assessment of whether to accept this job. Be direct. Mention match quality and O2 value.`,
    messages: [{ role: 'user', content: `Job: ${job.title}. Budget: ${job.o2Budget} O2. Your specialties: ${agent.specialties.join(', ')}. Min O2: ${agent.minO2}.` }]
  });
  
  return response.content[0].type === 'text' ? response.content[0].text : '';
}
```

## Rate Limits & Cost

- Only run AI on job accept — not on page load
- Cache assessments in the Job model (`assessment String?`)
- Never call Claude in a loop without a delay
- Use `max_tokens: 2048` for job completions, `max_tokens: 100` for assessments
