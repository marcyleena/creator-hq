import { loadStorage, SNAPSHOTS_KEY, formatNumber } from '../utils';

const ACTIONS = [
  { label: 'Log snapshot', tab: 'Growth', sub: 'Snapshots' },
  { label: 'Run niche intel', tab: 'Intel', sub: 'Run Analysis' },
  { label: 'Plan content', tab: 'Content', sub: 'Plan' },
  { label: 'Write caption', tab: 'Studio', prompt: 'Write a compelling Instagram caption for my brand.' },
  { label: 'Image prompt', tab: 'Studio', prompt: 'Write a detailed AI image generation prompt for my brand aesthetic.' },
  { label: 'Develop persona', tab: 'Studio', prompt: 'Help me develop a detailed persona and backstory for my virtual influencer.' },
];

export default function HomeTab({ brand, onNavigate }) {
  const snapshots = loadStorage(SNAPSHOTS_KEY, []);
  const recent = snapshots.slice(-3).reverse();
  const latest = snapshots[snapshots.length - 1];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Hero card */}
      <div style={{
        background: brand.accent, borderRadius: 16, padding: '36px 36px 32px',
        marginBottom: 28, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
          AI-Powered Studio
        </p>
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#fff', margin: '0 0 6px', fontWeight: 400 }}>
          {brand.name}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.75)', margin: '0 0 24px', fontSize: 15 }}>
          {brand.niche}
        </p>
        {latest && (
          <div style={{ display: 'inline-block' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 48, color: '#fff', fontWeight: 400, lineHeight: 1 }}>
              {formatNumber(latest.followers)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, marginLeft: 8 }}>followers</span>
          </div>
        )}
        {!latest && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Log your first snapshot to see follower count</p>
        )}
      </div>

      {/* Quick actions */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#1C1A18', margin: '0 0 14px', fontWeight: 400 }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {ACTIONS.map(action => (
            <button key={action.label} onClick={() => onNavigate(action)} style={{
              padding: '14px 12px', background: '#FDFAF5',
              border: '1px solid rgba(201,191,168,0.38)', borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: '#1C1A18',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: 'DM Sans, sans-serif',
              transition: 'border-color 0.15s',
            }}>
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent snapshots */}
      <div>
        <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#1C1A18', margin: '0 0 14px', fontWeight: 400 }}>
          Recent Snapshots
        </h3>
        {recent.length === 0 ? (
          <div style={emptyStyle}>No snapshots yet. Log your first snapshot in the Growth tab.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recent.map((s, i) => (
              <div key={i} style={{
                background: '#FDFAF5', border: '1px solid rgba(201,191,168,0.38)',
                borderRadius: 10, padding: '14px 18px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1C1A18' }}>{formatNumber(s.followers)}</span>
                  <span style={{ color: '#C9BFA8', fontSize: 13, marginLeft: 6 }}>followers</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#C9BFA8' }}>{s.date}</div>
                  {s.notes && <div style={{ fontSize: 13, color: '#1C1A18', marginTop: 2, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.notes}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const emptyStyle = {
  padding: '20px 18px', background: '#FDFAF5',
  border: '1px solid rgba(201,191,168,0.18)', borderRadius: 10,
  color: '#C9BFA8', fontSize: 14,
};
