import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { loadStorage, saveStorage, CONTENT_PLAN_KEY, CONTENT_PERF_KEY, engagementScore, callClaude } from '../utils';

const mdComponents = {
  h1: ({ children }) => <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 400, color: '#1C1A18', margin: '20px 0 8px' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 17, fontWeight: 400, color: '#1C1A18', margin: '18px 0 6px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1C1A18', margin: '14px 0 4px' }}>{children}</h3>,
  p: ({ children }) => <p style={{ fontSize: 14, color: '#1C1A18', lineHeight: 1.7, margin: '0 0 10px' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '0 0 10px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '0 0 10px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ fontSize: 14, color: '#1C1A18', lineHeight: 1.7, marginBottom: 4 }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: '#1C1A18' }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid rgba(201,191,168,0.38)', margin: '16px 0' }} />,
};

const PILLARS = ['Education', 'Entertainment', 'Inspiration', 'Promotion', 'Personal'];
const FORMATS = ['Reel', 'Carousel', 'Static', 'Story', 'Live'];

function SubTabs({ tabs, active, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid rgba(201,191,168,0.38)' }}>
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '8px 16px', background: 'none', border: 'none',
          borderBottom: active === t ? `2px solid ${accent}` : '2px solid transparent',
          color: active === t ? '#1C1A18' : '#C9BFA8',
          fontSize: 14, fontWeight: active === t ? 700 : 400, cursor: 'pointer',
          fontFamily: 'DM Sans, sans-serif', marginBottom: -1,
        }}>{t}</button>
      ))}
    </div>
  );
}

export default function ContentTab({ brand, showToast, onNavigateToStudio }) {
  const [sub, setSub] = useState('Plan');
  const [plan, setPlan] = useState(() => loadStorage(CONTENT_PLAN_KEY, []));
  const [perf, setPerf] = useState(() => loadStorage(CONTENT_PERF_KEY, []));
  const [gapResult, setGapResult] = useState('');
  const [regenResult, setRegenResult] = useState('');
  const [loading, setLoading] = useState(false);

  const [planForm, setPlanForm] = useState({ date: '', format: 'Reel', pillar: 'Education', hook: '', notes: '' });
  const [perfForm, setPerfForm] = useState({ date: '', format: 'Reel', hook: '', likes: '', comments: '', saves: '' });

  const addPlan = () => {
    if (!planForm.hook) return;
    const entry = { ...planForm, id: Date.now(), flagged: false, likes: 0, comments: 0, saves: 0 };
    const updated = [entry, ...plan];
    setPlan(updated);
    saveStorage(CONTENT_PLAN_KEY, updated);
    setPlanForm({ date: '', format: 'Reel', pillar: 'Education', hook: '', notes: '' });
    showToast('Post planned');
  };

  const deletePlan = (id) => {
    const updated = plan.filter(p => p.id !== id);
    setPlan(updated);
    saveStorage(CONTENT_PLAN_KEY, updated);
  };

  const toggleFlag = (id) => {
    const updated = plan.map(p => p.id === id ? { ...p, flagged: !p.flagged } : p);
    setPlan(updated);
    saveStorage(CONTENT_PLAN_KEY, updated);
  };

  const addPerf = () => {
    if (!perfForm.hook) return;
    const entry = {
      ...perfForm, id: Date.now(),
      likes: Number(perfForm.likes) || 0,
      comments: Number(perfForm.comments) || 0,
      saves: Number(perfForm.saves) || 0,
    };
    const updated = [...perf, entry].sort((a, b) => engagementScore(b) - engagementScore(a));
    setPerf(updated);
    saveStorage(CONTENT_PERF_KEY, updated);
    setPerfForm({ date: '', format: 'Reel', hook: '', likes: '', comments: '', saves: '' });
    showToast('Post logged');
  };

  const deletePerf = (id) => {
    const updated = perf.filter(p => p.id !== id);
    setPerf(updated);
    saveStorage(CONTENT_PERF_KEY, updated);
  };

  const runGapAnalysis = async () => {
    if (!brand.anthropicKey) { showToast('Anthropic key missing', 'error'); return; }
    setLoading(true);
    try {
      const planSummary = plan.map(p => `[${p.format}] ${p.pillar}: "${p.hook}"${p.flagged ? ' (FLAGGED)' : ''}`).join('\n') || 'No planned posts yet.';
      const perfSummary = perf.slice(0, 10).map(p => `[${p.format}] "${p.hook}" - Score: ${engagementScore(p)} (L:${p.likes} C:${p.comments} S:${p.saves})`).join('\n') || 'No performance data yet.';
      const result = await callClaude(brand.anthropicKey, [{
        role: 'user',
        content: `You are auditing the content strategy for ${brand.name}, a ${brand.niche} Instagram creator.\n\nContent Plan:\n${planSummary}\n\nTop Performing Posts:\n${perfSummary}\n\nWrite a concise audit with exactly four sections:\n\n**What's Working**\n[2-3 bullet points]\n\n**Gaps In Your Plan**\n[2-3 bullet points]\n\n**Replace Immediately**\n[Specific planned posts to cut or rework]\n\n**Priority This Week**\n[Top 1-2 content priorities]\n\nBe direct and specific to ${brand.name}'s niche.`,
      }], 900);
      setGapResult(result);

      // Auto-flag weak planned posts
      const lowScorePosts = plan.filter(p => !p.flagged && p.hook.length < 30);
      if (lowScorePosts.length) {
        const flagged = plan.map(p =>
          lowScorePosts.find(l => l.id === p.id) ? { ...p, flagged: true } : p
        );
        setPlan(flagged);
        saveStorage(CONTENT_PLAN_KEY, flagged);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const runRegen = async () => {
    if (!brand.anthropicKey) { showToast('Anthropic key missing', 'error'); return; }
    if (!perf.length) { showToast('Log some posts in Performance first', 'error'); return; }
    setLoading(true);
    try {
      const top = perf.slice(0, 3).map(p => `[${p.format}] "${p.hook}" - Score: ${engagementScore(p)}`).join('\n');
      const result = await callClaude(brand.anthropicKey, [{
        role: 'user',
        content: `You are a content strategist for ${brand.name}, a ${brand.niche} creator.\n\nTop performing posts:\n${top}\n\nFor each top post, provide:\n1. A format pivot (e.g., turn a Static into a Reel)\n2. Three fresh hook variations\n3. An OpenArt AI image prompt for the visual\n4. A HeyGen avatar script hook (one sentence)\n\nKeep it specific to ${brand.name}'s aesthetic and niche.`,
      }], 1000);
      setRegenResult(result);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const pillarColor = (pillar) => {
    const colors = { Education: '#4f6d8a', Entertainment: '#d47dbc', Inspiration: '#2d7d5e', Promotion: '#c4821a', Personal: '#6366f1' };
    return colors[pillar] || brand.accent;
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <SubTabs tabs={['Plan', 'Performance', 'Gap Analysis', 'Regenerate']} active={sub} onChange={setSub} accent={brand.accent} />

      {sub === 'Plan' && (
        <div>
          <div style={{ background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)', borderRadius: 14, padding: 22, marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1C1A18', margin: '0 0 16px', fontWeight: 400 }}>Add Planned Post</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={planForm.date} onChange={e => setPlanForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Format</label>
                <select value={planForm.format} onChange={e => setPlanForm(f => ({ ...f, format: e.target.value }))} style={inputStyle}>
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Pillar</label>
                <select value={planForm.pillar} onChange={e => setPlanForm(f => ({ ...f, pillar: e.target.value }))} style={inputStyle}>
                  {PILLARS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Hook / Caption start</label>
              <input value={planForm.hook} onChange={e => setPlanForm(f => ({ ...f, hook: e.target.value }))} style={inputStyle} placeholder="First line of caption..." />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Notes</label>
              <input value={planForm.notes} onChange={e => setPlanForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} placeholder="Ideas, references..." />
            </div>
            <button onClick={addPlan} style={btnStyle(brand.accent)}>Add to Plan</button>
          </div>

          {plan.length === 0 && <div style={emptyStyle}>No posts planned yet.</div>}
          {plan.map(p => (
            <div key={p.id} style={{
              background: '#FDFAF5', border: `1px solid ${p.flagged ? '#c4821a' : 'rgba(201,191,168,0.38)'}`,
              borderRadius: 10, padding: '14px 18px', marginBottom: 8,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: `${pillarColor(p.pillar)}18`, color: pillarColor(p.pillar) }}>{p.pillar}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: 'rgba(201,191,168,0.18)', color: '#1C1A18' }}>{p.format}</span>
                  {p.flagged && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, background: '#c4821a18', color: '#c4821a' }}>NEEDS WORK</span>}
                  {p.date && <span style={{ fontSize: 12, color: '#C9BFA8' }}>{p.date}</span>}
                </div>
                <div style={{ fontSize: 14, color: '#1C1A18' }}>{p.hook}</div>
                {p.notes && <div style={{ fontSize: 12, color: '#C9BFA8', marginTop: 3 }}>{p.notes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                <button onClick={() => toggleFlag(p.id)} style={{ ...deleteBtnStyle, color: p.flagged ? '#c4821a' : '#C9BFA8' }}>
                  {p.flagged ? 'Unflag' : 'Flag'}
                </button>
                <button onClick={() => deletePlan(p.id)} style={deleteBtnStyle}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === 'Performance' && (
        <div>
          <div style={{ background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)', borderRadius: 14, padding: 22, marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: '#1C1A18', margin: '0 0 16px', fontWeight: 400 }}>Log Post Performance</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={perfForm.date} onChange={e => setPerfForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Format</label>
                <select value={perfForm.format} onChange={e => setPerfForm(f => ({ ...f, format: e.target.value }))} style={inputStyle}>
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Hook</label>
              <input value={perfForm.hook} onChange={e => setPerfForm(f => ({ ...f, hook: e.target.value }))} style={inputStyle} placeholder="First line or topic..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              {[['Likes', 'likes'], ['Comments', 'comments'], ['Saves', 'saves']].map(([l, k]) => (
                <div key={k}>
                  <label style={labelStyle}>{l}</label>
                  <input type="number" value={perfForm[k]} onChange={e => setPerfForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} placeholder="0" />
                </div>
              ))}
            </div>
            <button onClick={addPerf} style={btnStyle(brand.accent)}>Log Post</button>
          </div>

          <div style={{ fontSize: 12, color: '#C9BFA8', marginBottom: 12 }}>Ranked by engagement score (likes + comments x3 + saves x5)</div>
          {perf.length === 0 && <div style={emptyStyle}>No posts logged yet.</div>}
          {perf.map((p, rank) => (
            <div key={p.id} style={{
              background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 8,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: rank < 3 ? brand.accent : 'rgba(201,191,168,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: rank < 3 ? '#fff' : '#C9BFA8', flexShrink: 0,
                }}>#{rank + 1}</div>
                <div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(201,191,168,0.18)', color: '#1C1A18', fontWeight: 700 }}>{p.format}</span>
                    {p.date && <span style={{ fontSize: 12, color: '#C9BFA8' }}>{p.date}</span>}
                  </div>
                  <div style={{ fontSize: 14, color: '#1C1A18' }}>{p.hook}</div>
                  <div style={{ fontSize: 12, color: '#C9BFA8', marginTop: 3 }}>
                    {p.likes}L / {p.comments}C / {p.saves}S &middot; Score: {engagementScore(p)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => onNavigateToStudio && onNavigateToStudio(p)} style={{ ...btnStyle(brand.accent), padding: '6px 12px', fontSize: 12 }}>Build this</button>
                <button onClick={() => deletePerf(p.id)} style={deleteBtnStyle}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {sub === 'Gap Analysis' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <button onClick={runGapAnalysis} disabled={loading} style={{ ...btnStyle(brand.accent), opacity: loading ? 0.65 : 1 }}>
              {loading ? 'Analyzing...' : 'Run Gap Analysis'}
            </button>
            <p style={{ color: '#C9BFA8', fontSize: 13, marginTop: 10 }}>
              Claude audits your content plan and performance data. Weak posts are auto-flagged in Plan tab.
            </p>
          </div>
          {gapResult && (
            <div style={{ background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)', borderRadius: 14, padding: 24 }}>
              <ReactMarkdown components={mdComponents}>{gapResult}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {sub === 'Regenerate' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <button onClick={runRegen} disabled={loading} style={{ ...btnStyle(brand.accent), opacity: loading ? 0.65 : 1 }}>
              {loading ? 'Generating...' : 'Regenerate Top Performers'}
            </button>
            <p style={{ color: '#C9BFA8', fontSize: 13, marginTop: 10 }}>
              Claude generates format pivots, hook variations, OpenArt AI and HeyGen prompts for your top posts.
            </p>
          </div>
          {regenResult && (
            <div style={{ background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)', borderRadius: 14, padding: 24 }}>
              <ReactMarkdown components={mdComponents}>{regenResult}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#1C1A18', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 };
const inputStyle = {
  width: '100%', padding: '9px 12px', background: '#F5F0E8',
  border: '1px solid rgba(201,191,168,0.38)', borderRadius: 8,
  fontSize: 14, color: '#1C1A18', fontFamily: 'DM Sans, sans-serif',
  boxSizing: 'border-box', outline: 'none',
};
const emptyStyle = { padding: '20px 18px', background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.18)', borderRadius: 10, color: '#C9BFA8', fontSize: 14 };
const deleteBtnStyle = { background: 'none', border: 'none', color: '#C9BFA8', fontSize: 12, cursor: 'pointer', padding: '2px 6px', fontFamily: 'DM Sans, sans-serif' };
const btnStyle = (accent) => ({
  padding: '10px 20px', background: accent, color: '#fff',
  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
});
