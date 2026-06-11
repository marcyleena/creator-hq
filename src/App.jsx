import { useState, useCallback } from 'react';
import { loadStorage, saveStorage, STORAGE_KEY } from './utils';
import Onboarding from './Onboarding';
import Settings from './Settings';
import Toast from './Toast';
import HomeTab from './tabs/HomeTab';
import GrowthTab from './tabs/GrowthTab';
import IntelTab from './tabs/IntelTab';
import ContentTab from './tabs/ContentTab';
import StudioTab from './tabs/StudioTab';

const TABS = ['Home', 'Growth', 'Intel', 'Content', 'Studio'];

export default function App() {
  const [brand, setBrand] = useState(() => loadStorage(STORAGE_KEY, null));
  const [activeTab, setActiveTab] = useState('Home');
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [studioPrompt, setStudioPrompt] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const handleOnboardingComplete = (data) => {
    setBrand(data);
  };

  const handleSettingsSave = (data) => {
    setBrand(data);
    setShowSettings(false);
    showToast('Settings saved');
  };

  // Navigation from Home quick actions or Content "Build this"
  const handleNavigate = (action) => {
    if (action.tab === 'Studio' && action.prompt) {
      setStudioPrompt(action.prompt);
    }
    setActiveTab(action.tab);
  };

  if (!brand) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const accent = brand.accent || '#6366f1';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      fontFamily: 'DM Sans, sans-serif',
      color: '#1C1A18',
    }}>
      {/* Nav */}
      <header style={{
        background: '#FDFAF5',
        borderBottom: '1px solid rgba(201,191,168,0.38)',
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        height: 56,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', fontSize: 14, color: '#fff', marginRight: 12, flexShrink: 0,
        }}>
          {(brand.name || 'C')[0].toUpperCase()}
        </div>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#1C1A18', marginRight: 28, whiteSpace: 'nowrap' }}>
          Creator HQ
        </span>

        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${accent}` : '2px solid transparent',
              color: activeTab === tab ? '#1C1A18' : '#C9BFA8',
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              height: 56,
              transition: 'color 0.15s',
            }}>
              {tab}
            </button>
          ))}
        </nav>

        <button onClick={() => setShowSettings(true)} title="Settings" style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#C9BFA8', fontSize: 18, padding: '4px 8px',
          display: 'flex', alignItems: 'center',
        }}>
          <GearIcon />
        </button>
      </header>

      {/* Main */}
      <main style={{ padding: '32px 28px', maxWidth: 1000, margin: '0 auto' }}>
        {activeTab === 'Home' && (
          <HomeTab brand={brand} onNavigate={handleNavigate} />
        )}
        {activeTab === 'Growth' && (
          <GrowthTab brand={brand} showToast={showToast} />
        )}
        {activeTab === 'Intel' && (
          <IntelTab brand={brand} showToast={showToast} />
        )}
        {activeTab === 'Content' && (
          <ContentTab
            brand={brand}
            showToast={showToast}
            onNavigateToStudio={(post) => {
              setStudioPrompt(
                `Expand on this top-performing post for ${brand.name} (${brand.niche}):\n\nFormat: ${post.format}\nHook: "${post.hook}"\nEngagement score: ${post.likes + post.comments * 3 + (post.saves || 0) * 5}\n\nWrite a full caption, image direction, and 3 hook variations.`
              );
              setActiveTab('Studio');
            }}
          />
        )}
        {activeTab === 'Studio' && (
          <StudioTab
            brand={brand}
            showToast={showToast}
            initialPrompt={studioPrompt}
          />
        )}
      </main>

      {showSettings && (
        <Settings
          brand={brand}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  );
}

function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
