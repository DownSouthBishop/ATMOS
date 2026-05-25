'use client';
import { useState } from 'react';
import Tag from '@/components/ui/Tag';
import Modal from '@/components/ui/Modal';

interface MarketplaceAgent {
  id: string;
  name: string;
  specialties: string[];
  minO2: number;
  provider: string;
  model: string;
  goal: string;
  personality: string | null;
  completedJobs: number;
  ownerName: string;
}

interface Props {
  agents: MarketplaceAgent[];
  o2Balance: number;
}

const FILTERS = ['All', 'Writing', 'Research', 'Marketing', 'Data', 'Design', 'Code', 'Legal', 'Finance', 'Outreach'];

const SCOPE_OPTIONS = [
  { value: 'single', label: 'Single Task', desc: '1× completion' },
  { value: 'multi', label: 'Multi-Step', desc: 'Complex workflow' },
  { value: 'retainer', label: 'Retainer', desc: 'Ongoing work' },
];

const PRIORITY_OPTIONS = [
  { value: 'standard', label: 'Standard', multiplier: 1.0 },
  { value: 'urgent', label: 'Urgent', multiplier: 1.5 },
  { value: 'critical', label: 'Critical', multiplier: 2.0 },
];

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Claude',
  openai: 'GPT',
  google: 'Gemini',
  mistral: 'Mistral',
  custom: 'Custom',
};

export default function MarketplaceClient({ agents, o2Balance }: Props) {
  const [filter, setFilter] = useState('All');
  const [selectedAgent, setSelectedAgent] = useState<MarketplaceAgent | null>(null);
  const [taskDesc, setTaskDesc] = useState('');
  const [scope, setScope] = useState('single');
  const [priority, setPriority] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [commissioned, setCommissioned] = useState<string[]>([]);
  const [modalError, setModalError] = useState('');

  const filtered = filter === 'All'
    ? agents
    : agents.filter(a => a.specialties.some(s => s.toLowerCase() === filter.toLowerCase()));

  const multiplier = PRIORITY_OPTIONS.find(p => p.value === priority)?.multiplier ?? 1;
  const scopeMultiplier = scope === 'retainer' ? 3 : scope === 'multi' ? 1.75 : 1;
  const estimatedO2 = selectedAgent
    ? Math.ceil(selectedAgent.minO2 * multiplier * scopeMultiplier)
    : 0;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  function openModal(agent: MarketplaceAgent) {
    setSelectedAgent(agent);
    setTaskDesc('');
    setScope('single');
    setPriority('standard');
    setModalError('');
  }

  async function handleCommission() {
    if (!selectedAgent || !taskDesc.trim()) {
      setModalError('Please describe the task.');
      return;
    }
    if (estimatedO2 > o2Balance) {
      setModalError(`Insufficient balance. Need ${estimatedO2} O2, have ${Math.round(o2Balance)}.`);
      return;
    }
    setLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/marketplace/commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          description: taskDesc.trim(),
          scope,
          priority,
          o2Budget: estimatedO2,
        }),
      });
      const json = await res.json() as { data: { jobId: string } | null; error: string | null };
      if (json.error) { setModalError(json.error); return; }
      setCommissioned(prev => [...prev, selectedAgent.id]);
      setSelectedAgent(null);
      showToast(`${selectedAgent.name} commissioned — job created`);
    } catch {
      setModalError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Commission modal */}
      <Modal
        isOpen={!!selectedAgent}
        onClose={() => setSelectedAgent(null)}
        subtitle="// COMMISSION"
        title={selectedAgent?.name ?? ''}
        footer={
          <>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedAgent(null)}>Cancel</button>
            <button className="btn btn-gold btn-sm" onClick={handleCommission} disabled={loading}>
              {loading ? 'Commissioning...' : `Commission · ${estimatedO2} O2 →`}
            </button>
          </>
        }
      >
        {/* Task description */}
        <div className="form-group">
          <label className="form-label">Task Description</label>
          <textarea
            className="form-input"
            value={taskDesc}
            onChange={e => setTaskDesc(e.target.value)}
            placeholder={`Describe exactly what you need ${selectedAgent?.name ?? 'this agent'} to do...`}
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Scope */}
        <div className="form-group">
          <label className="form-label">Scope</label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {SCOPE_OPTIONS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setScope(s.value)}
                style={{
                  flex: 1, padding: '.5rem .4rem', borderRadius: 'var(--r)',
                  background: scope === s.value ? 'var(--g10)' : 'var(--surface)',
                  border: `1px solid ${scope === s.value ? 'var(--gold)' : 'var(--b1)'}`,
                  color: scope === s.value ? 'var(--gold)' : 'var(--muted)',
                  cursor: 'pointer', textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--ff)', fontSize: '.65rem', fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--fm)', fontSize: '.48rem', marginTop: '2px' }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div className="form-group">
          <label className="form-label">Priority</label>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            {PRIORITY_OPTIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPriority(p.value)}
                style={{
                  flex: 1, padding: '.45rem .4rem', borderRadius: 'var(--r)',
                  background: priority === p.value ? 'var(--g10)' : 'var(--surface)',
                  border: `1px solid ${priority === p.value ? 'var(--gold)' : 'var(--b1)'}`,
                  color: priority === p.value ? 'var(--gold)' : 'var(--muted)',
                  cursor: 'pointer', textAlign: 'center',
                  fontFamily: 'var(--ff)', fontSize: '.65rem', fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cost preview */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--b1)',
          borderRadius: 'var(--r2)', padding: '.75rem 1rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--muted)', marginBottom: '.2rem' }}>
              ESTIMATED COST
            </div>
            <div style={{ fontFamily: 'var(--fs)', fontSize: '1.4rem', color: 'var(--gl)', fontWeight: 600 }}>
              {estimatedO2} <sup style={{ fontFamily: 'var(--fm)', fontSize: '.38em', color: 'var(--teal)' }}>O2</sup>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', letterSpacing: '.15em', color: 'var(--muted)', marginBottom: '.2rem' }}>
              YOUR BALANCE
            </div>
            <div style={{
              fontFamily: 'var(--fs)', fontSize: '1.1rem', fontWeight: 600,
              color: estimatedO2 > o2Balance ? 'var(--red)' : '#4CAF80',
            }}>
              {Math.round(o2Balance)} O2
            </div>
          </div>
        </div>

        {modalError && (
          <div style={{
            marginTop: '.75rem', fontFamily: 'var(--fm)', fontSize: '.62rem', color: 'var(--red)',
            padding: '.5rem .75rem', background: 'var(--r10)', border: '1px solid var(--r20)', borderRadius: 'var(--r)',
          }}>
            {modalError}
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500 }}>
          <div className="toast-item gold">{toast}</div>
        </div>
      )}

      {/* Header */}
      <div className="sec-head" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div className="sec-label">{'// AGENTS FOR HIRE'}</div>
          <div className="sec-title">Marketplace</div>
        </div>
        <span style={{ fontFamily: 'var(--fm)', fontSize: '.55rem', color: 'var(--teal)' }}>
          {filtered.length} AGENTS
        </span>
      </div>

      {/* Filters */}
      <div className="filters">
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontFamily: 'var(--fm)', fontSize: '.65rem', letterSpacing: '.2em' }}>
          NO AGENTS AVAILABLE IN THIS CATEGORY
        </div>
      ) : (
        <div className="g3">
          {filtered.map(agent => {
            const isDone = commissioned.includes(agent.id);
            return (
              <div key={agent.id} className="card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {/* Agent avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'var(--t10)', border: '1px solid var(--teal)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--fs)', fontSize: '1rem', color: 'var(--teal)',
                    flexShrink: 0,
                  }}>
                    {agent.name[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '.9rem', fontWeight: 600, color: 'var(--gl)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {agent.name}
                    </div>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.5rem', color: 'var(--muted)', letterSpacing: '.08em' }}>
                      by {agent.ownerName}
                    </div>
                  </div>
                  <Tag variant="teal">{PROVIDER_LABELS[agent.provider] ?? agent.provider}</Tag>
                </div>

                {/* Specialties */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                  {agent.specialties.slice(0, 3).map(s => (
                    <Tag key={s} variant="muted">{s.toUpperCase()}</Tag>
                  ))}
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <div style={{
                    flex: 1, background: 'var(--surface)', borderRadius: 'var(--r)',
                    padding: '.4rem .5rem', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.45rem', color: 'var(--muted)', marginBottom: '2px' }}>JOBS DONE</div>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '.9rem', color: 'var(--gl)', fontWeight: 600 }}>{agent.completedJobs}</div>
                  </div>
                  <div style={{
                    flex: 1, background: 'var(--surface)', borderRadius: 'var(--r)',
                    padding: '.4rem .5rem', textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: 'var(--fm)', fontSize: '.45rem', color: 'var(--muted)', marginBottom: '2px' }}>MIN RATE</div>
                    <div style={{ fontFamily: 'var(--fs)', fontSize: '.9rem', color: 'var(--gl)', fontWeight: 600 }}>
                      {Math.round(agent.minO2)} <sup style={{ fontFamily: 'var(--fm)', fontSize: '.4em', color: 'var(--teal)' }}>O2</sup>
                    </div>
                  </div>
                </div>

                {/* Commission button */}
                <button
                  className={isDone ? 'btn btn-outline btn-sm btn-full' : 'btn btn-gold btn-sm btn-full'}
                  onClick={() => !isDone && openModal(agent)}
                  disabled={isDone}
                >
                  {isDone ? '✓ Commissioned' : 'Commission Agent →'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
