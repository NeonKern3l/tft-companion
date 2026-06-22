import React, { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';

/* ─────────────────────────────────────────────────────
   Utility helpers
───────────────────────────────────────────────────── */
const formatUnitName = (name) => {
  if (!name) return 'Unknown';
  if (name === 'TFT17_IvernMinion') return 'Meepsie';
  if (name === 'TFT17_Summon')      return 'Bia & Bayin';
  if (name === 'TFT17_Galio')       return 'The Mighty Mech';
  return name.replace(/TFT\d+_/g, '');
};

const StarBadge = ({ level, onClick }) => {
  const stars = '★'.repeat(Math.min(level, 3));
  const colors = { 1: '#767586', 2: '#4648d4', 3: '#f5c542' };
  return (
    <button 
      onClick={onClick}
      className="hover:scale-110 transition-transform select-none"
      style={{ color: colors[level] || '#767586', fontSize: 11, fontWeight: 800, background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {stars}
    </button>
  );
};

const PulseDot = ({ color = 'var(--primary)', size = 7 }) => (
  <span
    className="animate-pulse-dot"
    style={{
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
    }}
  />
);

/* ─────────────────────────────────────────────────────
   LOADING SCREEN
───────────────────────────────────────────────────── */
function LoadingScreen() {
  return (
    <div className="loading-wrap">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p style={{
          color: 'var(--on-surface)',
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 13,
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}>
          Calibrating Soft HUD Interface
        </p>
        <p style={{
          color: 'var(--secondary)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          animation: 'pulseDot 2s ease-in-out infinite',
        }}>
          Connecting to 127.0.0.1:8000…
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'comps',    label: 'Comps',    icon: '◈' },
  { id: 'units',    label: 'Units',    icon: '◉' },
  { id: 'items',    label: 'Items',    icon: '◆' },
  { id: 'terminal', label: 'Terminal', icon: '⌥' },
];

function Sidebar({ activeNav, setActiveNav }) {
  return (
    <aside className="sidebar" style={{
      width: 220,
      flexShrink: 0,
      background: 'var(--surface)',
      borderRadius: 'var(--radius-xl)',
      padding: '20px 14px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 16,
      boxShadow: 'var(--neo-raise)',
      border: '1px solid rgba(255,255,255,0.7)',
      position: 'sticky',
      top: 24,
      height: 'fit-content',
      alignSelf: 'flex-start',
    }}>
      {/* Logo */}
      <div>
        <div style={{ padding: '4px 4px 16px', borderBottom: '1px solid var(--outline-variant)', marginBottom: 14 }}>
          <h1 style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            fontWeight: 800,
            color: 'var(--primary)',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
          }}>
            SPACE GODS
          </h1>
          <p style={{ color: 'var(--secondary)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
            TFT Companion
          </p>
        </div>

        {/* Profile */}
        <div className="silk-raised-sm" style={{ padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-container), var(--tertiary-container))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 14, color: 'var(--primary)',
            boxShadow: 'var(--neo-raise-sm)',
            flexShrink: 0,
          }}>S</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 11, color: 'var(--on-surface)', lineHeight: 1.3 }}>Steven#NA1</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Diamond IV</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map((link) => (
            <button
              key={link.id}
              className={`nav-link${activeNav === link.id ? ' active' : ''}`}
              onClick={() => setActiveNav(link.id)}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>{link.icon}</span>
              <span>{link.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Optimize Button */}
      <button className="btn-neo btn-neo-primary" style={{ width: '100%', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
        ⚡ Optimize Board
      </button>
    </aside>
  );
}

/* ─────────────────────────────────────────────────────
   TOP HEADER
───────────────────────────────────────────────────── */
function TopHeader({ level, setLevel, gold, setGold }) {
  return (
    <header style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingBottom: 20,
      borderBottom: '1px solid var(--outline-variant)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--on-surface)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}>
          Space Gods Companion
        </h2>
        <span className="tag" style={{ color: 'var(--primary)', borderColor: 'rgba(70,72,212,0.2)', background: 'var(--primary-container)' }}>
          <PulseDot size={6} />
          MANUAL CONTROL
        </span>
      </div>

      {/* Econ controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div className="stat-pill">
          <span style={{ color: 'var(--secondary)', fontSize: 11 }}>Level</span>
          <button className="btn-neo" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setLevel(Math.max(1, level - 1))}>-</button>
          <strong style={{ color: 'var(--primary)', fontHeight: 800, fontSize: 15 }}>{level}</strong>
          <button className="btn-neo" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setLevel(Math.min(10, level + 1))}>+</button>
        </div>

        <div className="stat-pill">
          <span style={{ color: 'var(--secondary)', fontSize: 11 }}>Gold</span>
          <button className="btn-neo" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setGold(Math.max(0, gold - 5))}>-5</button>
          <strong style={{ color: 'var(--tertiary)', fontWeight: 800, fontSize: 15 }}>{gold}g</strong>
          <button className="btn-neo" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setGold(gold + 5)}>+5</button>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────────────
   TERMINAL CONSOLE
───────────────────────────────────────────────────── */
function TerminalConsole({ logs }) {
  return (
    <div className="terminal-console">
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f57', '#ffbd2e', '#28ca41'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.8 }} />
            ))}
          </div>
          <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            AI Core Processing Unit
          </span>
        </div>
        <PulseDot color="#818cf8" size={6} />
      </div>
      <div className="terminal-body">
        {logs?.length > 0 ? logs.map((log, i) => (
          <div key={i} className="terminal-line">
            <span className="terminal-prompt">&gt;&gt;</span>
            <span style={{ opacity: 0.85 }}>{log}</span>
          </div>
        )) : (
          <div className="terminal-line" style={{ opacity: 0.5 }}>
            <span className="terminal-prompt">&gt;&gt;</span>
            <span>Awaiting manual state triggers…</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   COMPOSITION LIST
───────────────────────────────────────────────────── */
function CompList({ comps, selectedCompId, onSelect, activeTab, onTabChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Tab Bar */}
      <div className="tab-bar">
        <button className={`tab-btn${activeTab === 'meta' ? ' active' : ''}`} onClick={() => onTabChange('meta')}>
          Meta Lists
        </button>
        <button className={`tab-btn${activeTab === 'custom' ? ' active' : ''}`} onClick={() => onTabChange('custom')}>
          Synergies
        </button>
      </div>

      {/* Composition Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comps.length === 0 ? (
          <div className="silk-inset" style={{ padding: 24, textALign: 'center', color: 'var(--secondary)', fontFamily: 'var(--font-mono)', fontSize: 11, fontStyle: 'italic' }}>
            No compositions match your current board.
          </div>
        ) : comps.map((comp) => {
          if (!comp) return null;
          const isSelected = selectedCompId === comp.comp_id;
          const fitPct = ((comp.fit_score || 0) * 100).toFixed(0);
          const winPct = ((comp.dynamic_win_rate || 0) * 100).toFixed(1);
          return (
            <button
              key={comp.comp_id || comp.name}
              className={`comp-card${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(comp.comp_id)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{
                  fontWeight: 700,
                  fontSize: 13,
                  color: isSelected ? '#fff' : 'var(--on-surface)',
                  lineHeight: 1.3,
                  flex: 1,
                  paddingRight: 8,
                }}>
                  {comp.name}
                </span>
                {comp.tier && comp.tier !== 'Flex' && (
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: isSelected ? 'rgba(255,255,255,0.15)' : 'var(--error-container)',
                    color: isSelected ? '#fff' : 'var(--error)',
                    border: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(186,26,26,0.15)'}`,
                    flexShrink: 0,
                  }}>
                    {comp.tier}
                  </span>
                )}
              </div>

              {/* Stats Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
                paddingTop: 10,
                borderTop: `1px solid ${isSelected ? 'rgba(255,255,255,0.2)' : 'var(--outline-variant)'}`,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: isSelected ? 'rgba(255,255,255,0.75)' : 'var(--secondary)',
              }}>
                <span>Match <strong style={{ color: isSelected ? '#fff' : 'var(--on-surface)' }}>{fitPct}%</strong></span>
                {comp.tier !== 'Flex' && (
                  <span>Win <strong style={{ color: isSelected ? '#fff' : 'var(--primary)' }}>{winPct}%</strong></span>
                )}
                {comp.contested_count > 0 && (
                  <span style={{ gridColumn: '1 / -1', color: isSelected ? 'rgba(255,200,200,0.9)' : 'var(--error)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <PulseDot color={isSelected ? 'rgba(255,200,200,0.9)' : 'var(--error)'} size={5} />
                    {comp.contested_count} contested
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   ANALYZING OVERLAY
───────────────────────────────────────────────────── */
function AnalyzingPanel() {
  return (
    <div className="silk-raised" style={{
      padding: 40,
      minHeight: 440,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Laser sweep */}
      <div
        className="animate-laserSweep"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, var(--primary), var(--tertiary), transparent)',
          boxShadow: '0 0 12px rgba(70,72,212,0.4)',
          pointerEvents: 'none',
        }}
      />

      {/* Terminal log */}
      <div>
        <div className="section-label" style={{ color: 'var(--primary)', marginBottom: 16 }}>AI Core Processing Unit</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            'Initiating tactical telemetry sweep…',
            'Simulating combat power and board weights…',
            'Correlating lobby contestation indices…',
          ].map((msg, i) => (
            <div key={i} className="terminal-line" style={{ color: 'var(--on-surface-variant)', padding: '6px 0' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>&gt;&gt;</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress + Spectrogram */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            <span>Calculating optimal board configurations</span>
            <span>84%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: '84%' }} />
          </div>
        </div>

        {/* Spectrogram */}
        <div className="spectrogram">
          {Array.from({ length: 18 }, (_, i) => (
            <div
              key={i}
              className="spectrogram-bar animate-tacticalWave"
              style={{ animationDelay: `${i * 0.055}s`, height: `${30 + Math.sin(i) * 12}px` }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', borderTop: '1px solid var(--outline-variant)', paddingTop: 10 }}>
          <span>CPU LOAD: 24.5%</span>
          <span style={{ animation: 'pulseDot 1.5s ease-in-out infinite' }}>DIAGNOSTICS IN PROGRESS…</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   LOCKED PANEL
───────────────────────────────────────────────────── */
function LockedPanel({ activeComp, onUnlock }) {
  return (
    <div className="silk-raised" style={{
      padding: 24,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: 20,
      minHeight: 220,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <PulseDot color="var(--error)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--error)' }}>Lock Mode Active</span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, color: 'var(--on-surface)', lineHeight: 1.2 }}>
          {activeComp?.name}
        </h3>
        <p style={{ marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--secondary)', lineHeight: 1.6 }}>
          All alternative recommendations are filtered out to isolate focus on this transition pathway.
        </p>
      </div>
      <button className="btn-neo" style={{ width: '100%', padding: '12px 16px' }} onClick={onUnlock}>
        ← Back to All Pathways
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────── */
function EmptyDetail() {
  return (
    <div className="silk-inset" style={{ padding: 48, textALign: 'center', color: 'var(--secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Select a composition to display operational HUD details.
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════ */
export default function App() {
  const socketRef = useRef(null);
  const [championsDb, setChampionsDb] = useState([]); // Loaded from backend INIT
  const [analysisData, setAnalysisData] = useState(null); // Received from backend UPDATE
  
  // Manual Board State
  const [board, setBoard] = useState([
    { apiName: "TFT17_Teemo", starLevel: 1 },
    { apiName: "TFT17_Nasus", starLevel: 1 },
    { apiName: "TFT17_Aatrox", starLevel: 2 }
  ]);
  const [bench, setBench] = useState([
    { apiName: "TFT17_Riven", starLevel: 1 },
    { apiName: "TFT17_Nami", starLevel: 1 }
  ]);
  const [opponents, setOpponents] = useState([]); // Contested registry
  const [gold, setGold] = useState(38);
  const [level, setLevel] = useState(6);

  const [selectedCompId, setSelectedCompId] = useState(null);
  const [activeTab, setActiveTab] = useState('meta'); 
  const [isLocked, setIsLocked] = useState(false);
  const [activeNav, setActiveNav] = useState('comps');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Dropdown States
  const [selectedAddChamp, setSelectedAddChamp] = useState('');
  const [selectedContestChamp, setSelectedContestChamp] = useState('');

  /* ── WebSocket Connection ─────────────────────── */
  useEffect(() => {
    const socket = new WebSocket('ws://127.0.0.1:8000');
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('[WS] Connected to backend. Syncing initial state...');
      const statePacket = {
        board,
        bench,
        opponents,
        gold,
        level
      };
      socket.send(JSON.stringify(statePacket));
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "INIT") {
          setChampionsDb(payload.champions || []);
        } else if (payload.type === "UPDATE") {
          setAnalysisData(payload);
        }
      } catch (err) {
        console.error('[WS] Failed to parse payload:', err);
      }
    };

    socket.onclose = () => console.log('[WS] Connection closed.');

    return () => socket.close();
  }, []);

  // Send state update to Python server whenever board, bench, gold, level, or contested units change
  const syncWithBackend = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const statePacket = {
        board,
        bench,
        opponents,
        gold,
        level
      };
      socketRef.current.send(JSON.stringify(statePacket));
    }
  }, [board, bench, opponents, gold, level]);

  useEffect(() => {
    syncWithBackend();
  }, [board, bench, opponents, gold, level, syncWithBackend]);

  // Handle Analysis transition on comp change
  useEffect(() => {
    if (!selectedCompId) return;
    setIsAnalyzing(true);
    const delay = Math.floor(Math.random() * 800) + 1200;
    const t = setTimeout(() => setIsAnalyzing(false), delay);
    return () => clearTimeout(t);
  }, [selectedCompId]);

  // Sync selected comp automatically
  useEffect(() => {
    if (!analysisData) return;
    const list = activeTab === 'meta'
      ? (analysisData.recommended_comps || [])
      : (analysisData.custom_synergy_comps || []);
    if (list.length === 0) return;
    const exists = list.some(c => c && c.comp_id === selectedCompId);
    if (!selectedCompId || !exists) {
      setSelectedCompId(list[0].comp_id);
    }
  }, [analysisData, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedCompId(null);
    setIsLocked(false);
  };

  // State modification triggers
  const addUnitToBoard = () => {
    if (!selectedAddChamp) return;
    setBoard([...board, { apiName: selectedAddChamp, starLevel: 1 }]);
    setSelectedAddChamp('');
  };

  const addUnitToBench = () => {
    if (!selectedAddChamp) return;
    setBench([...bench, { apiName: selectedAddChamp, starLevel: 1 }]);
    setSelectedAddChamp('');
  };

  const removeUnitFromBoard = (index) => {
    const updated = [...board];
    updated.splice(index, 1);
    setBoard(updated);
  };

  const removeUnitFromBench = (index) => {
    const updated = [...bench];
    updated.splice(index, 1);
    setBench(updated);
  };

  const toggleStarLevelBoard = (index) => {
    const updated = [...board];
    const current = updated[index].starLevel;
    updated[index].starLevel = current === 3 ? 1 : current + 1;
    setBoard(updated);
  };

  const toggleStarLevelBench = (index) => {
    const updated = [...bench];
    const current = updated[index].starLevel;
    updated[index].starLevel = current === 3 ? 1 : current + 1;
    setBench(updated);
  };

  const adjustContestation = (apiName, amount) => {
    const existing = opponents.find(u => u.apiName === apiName);
    let updated;
    if (existing) {
      const newCount = Math.max(0, (existing.count || 0) + amount);
      if (newCount === 0) {
        updated = opponents.filter(u => u.apiName !== apiName);
      } else {
        updated = opponents.map(u => u.apiName === apiName ? { ...u, count: newCount } : u);
      }
    } else if (amount > 0) {
      updated = [...opponents, { apiName, count: amount }];
    } else {
      return;
    }
    setOpponents(updated);
  };

  const addContestedUnit = () => {
    if (!selectedContestChamp) return;
    adjustContestation(selectedContestChamp, 1);
    setSelectedContestChamp('');
  };

  const getUnitFromPayload = (unitApiName) => {
    const boardUnit = board.find(u => u.apiName === unitApiName);
    const benchUnit = bench.find(u => u.apiName === unitApiName);
    
    if (boardUnit) {
      return { owned: true, location: 'BOARD', star: boardUnit.starLevel || 1 };
    }
    if (benchUnit) {
      return { owned: true, location: 'BENCH', star: benchUnit.starLevel || 1 };
    }
    return { owned: false, location: null, star: 1 };
  };

  if (!analysisData) return <LoadingScreen />;

  const currentCompsList = activeTab === 'meta'
    ? (analysisData.recommended_comps || [])
    : (analysisData.custom_synergy_comps || []);

  const activeComp =
    (analysisData.recommended_comps || []).find(c => c && c.comp_id === selectedCompId) ||
    (analysisData.custom_synergy_comps || []).find(c => c && c.comp_id === selectedCompId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface)', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', gap: 20, alignItems: 'flex-start' }}>

        {/* Sidebar */}
        <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} />

        {/* Main Content Area */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Top Header */}
          <TopHeader level={level} setLevel={setLevel} gold={gold} setGold={setGold} />

          {/* AI Logs Console */}
          <TerminalConsole logs={analysisData.ai_logs} />

          {/* Interactive Manual Board & Bench Manager */}
          <section className="silk-raised" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top addition controls */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 14 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--on-surface-variant)' }}>Quick Add Unit:</span>
              <select 
                value={selectedAddChamp} 
                onChange={(e) => setSelectedAddChamp(e.target.value)}
                style={{ background: 'var(--surface-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 12, outline: 'none' }}
              >
                <option value="">Select Champion...</option>
                {championsDb.map(c => (
                  <option key={c.apiName} value={c.apiName}>{c.name} ({c.cost}g)</option>
                ))}
              </select>
              <button className="btn-neo" style={{ padding: '6px 14px', fontSize: 10 }} onClick={addUnitToBoard}>+ Active Board</button>
              <button className="btn-neo" style={{ padding: '6px 14px', fontSize: 10 }} onClick={addUnitToBench}>+ Bench</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Manual Board List */}
              <div>
                <div className="section-label" style={{ color: 'var(--primary)' }}>Deploys ({board.length})</div>
                {board.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>No board units deployed. Use select list above to populate.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {board.map((u, i) => (
                      <div key={i} className="unit-chip" style={{ gap: 8 }}>
                        <PulseDot color="var(--primary)" size={5} />
                        <span>{formatUnitName(u.apiName)}</span>
                        <StarBadge level={u.starLevel} onClick={() => toggleStarLevelBoard(i)} />
                        <button style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, marginLeft: 2 }} onClick={() => removeUnitFromBoard(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Manual Bench List */}
              <div style={{ borderLeft: '1px solid var(--outline-variant)', paddingLeft: 20 }}>
                <div className="section-label" style={{ color: 'var(--tertiary)' }}>Holdings ({bench.length})</div>
                {bench.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>No bench units held.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bench.map((u, i) => (
                      <div key={i} className="unit-chip" style={{ gap: 8 }}>
                        <PulseDot color="var(--tertiary)" size={5} />
                        <span>{formatUnitName(u.apiName)}</span>
                        <StarBadge level={u.starLevel} onClick={() => toggleStarLevelBench(i)} />
                        <button style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 11, marginLeft: 2 }} onClick={() => removeUnitFromBench(i)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Lobby Contested Units Panel */}
          <section className="silk-raised" style={{ padding: 20 }}>
            <div className="section-label" style={{ color: 'var(--error)', marginBottom: 14 }}>Opponent Deployed Registry (Lobby Contested Units)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', borderBottom: '1px solid var(--outline-variant)', paddingBottom: 14, marginBottom: 14 }}>
              <select 
                value={selectedContestChamp} 
                onChange={(e) => setSelectedContestChamp(e.target.value)}
                style={{ background: 'var(--surface-low)', color: 'var(--on-surface)', border: '1px solid var(--outline-variant)', padding: '6px 12px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)', fontSize: 12, outline: 'none' }}
              >
                <option value="">Select Champion...</option>
                {championsDb.map(c => (
                  <option key={c.apiName} value={c.apiName}>{c.name}</option>
                ))}
              </select>
              <button className="btn-neo" style={{ padding: '6px 14px', fontSize: 10 }} onClick={addContestedUnit}>+ Mark Contested</button>
            </div>

            {opponents.length === 0 ? (
              <p style={{ fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic', fontFamily: 'var(--font-mono)' }}>No contested units declared. Comps calculation evaluates uncontested.</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {opponents.map((u) => (
                  <div key={u.apiName} className="unit-chip" style={{ gap: 8, borderColor: 'var(--error-container)' }}>
                    <PulseDot color="var(--error)" size={5} />
                    <span>{formatUnitName(u.apiName)}</span>
                    <strong style={{ color: 'var(--error)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>x{u.count}</strong>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} onClick={() => adjustContestation(u.apiName, 1)}>+</button>
                      <button style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} onClick={() => adjustContestation(u.apiName, -1)}>-</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Workspace: Comp List + Details */}
          <div className="workspace-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
            
            {/* Left Column Comp Selector / Locked Panel */}
            {!isLocked ? (
              <CompList
                comps={currentCompsList}
                selectedCompId={selectedCompId}
                onSelect={setSelectedCompId}
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            ) : (
              <LockedPanel activeComp={activeComp} onUnlock={() => setIsLocked(false)} />
            )}

            {/* Right Details Column with AI scanning transitions */}
            <div>
              {isAnalyzing ? (
                <AnalyzingPanel />
              ) : activeComp ? (
                <div className="silk-raised animate-fadeSlideIn" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {/* Panel Header */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingBottom: 16, borderBottom: '1px solid var(--outline-variant)' }}>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.01em' }}>
                        {activeComp.name}
                      </h3>
                      {activeComp.tier && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                          {activeComp.tier} Tier  ·  Win Rate {((activeComp.dynamic_win_rate || 0) * 100).toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {!isLocked ? (
                      <button
                        className="btn-neo"
                        onClick={() => setIsLocked(true)}
                        style={{ color: 'var(--primary)', fontSize: 10 }}
                      >
                        🔒 Lock Target
                      </button>
                    ) : (
                      <span className="tag" style={{ color: 'var(--primary)', borderColor: 'rgba(70,72,212,0.2)', background: 'var(--primary-container)' }}>
                        <PulseDot size={5} />
                        Focused
                      </span>
                    )}
                  </div>

                  {/* Roster Grid */}
                  <div>
                    <div className="section-label" style={{ color: 'var(--primary)' }}>Target Composition Roster</div>
                    <div className="comp-detail-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
                      {(activeComp.core_units || []).map((unit) => {
                        const { owned, location, star } = getUnitFromPayload(unit);
                        return (
                          <div key={unit} className={`roster-card${owned ? ' owned' : ' missing'}`}>
                            <div style={{
                              fontWeight: 700,
                              fontSize: 11,
                              color: owned ? 'var(--on-surface)' : 'var(--secondary)',
                              marginBottom: 8,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formatUnitName(unit)}</span>
                              {owned && <StarBadge level={star} />}
                            </div>
                            <div style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '3px 8px',
                              border: '1px solid',
                              borderRadius: 'var(--radius-full)',
                              fontSize: 9,
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              background: location === 'BOARD'
                                ? 'var(--primary-container)'
                                : location === 'BENCH'
                                ? 'var(--tertiary-container)'
                                : 'var(--surface-highest)',
                              color: location === 'BOARD'
                                ? 'var(--primary)'
                                : location === 'BENCH'
                                ? 'var(--tertiary)'
                                : 'var(--secondary)',
                              borderColor: location === 'BOARD'
                                ? 'rgba(70,72,212,0.2)'
                                : location === 'BENCH'
                                ? 'rgba(113,42,226,0.2)'
                                : 'var(--outline-variant)',
                            }}>
                              {owned && <PulseDot color={location === 'BOARD' ? 'var(--primary)' : 'var(--tertiary)'} size={5} />}
                              {location || 'Missing'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Immediate Adjustments */}
                  <div>
                    <div className="section-label" style={{ color: 'var(--tertiary)' }}>Immediate Board Adjustments</div>
                    {!activeComp.bench_to_board || activeComp.bench_to_board.length === 0 ? (
                      <div className="silk-inset" style={{ padding: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic' }}>
                        No immediate bench adjustments. Deployed state matches targeted strategy.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {activeComp.bench_to_board.map((item, i) => {
                          if (!item) return null;
                          const isHold = item.action === 'HOLD_BENCH';
                          return (
                            <div key={i} className={`adjustment-row ${isHold ? 'hold' : 'action'}`}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{
                                  fontSize: 14,
                                  color: isHold ? 'var(--secondary)' : 'var(--primary)',
                                  animation: isHold ? 'none' : 'pulseDot 1.5s ease-in-out infinite',
                                }}>
                                  {isHold ? '⏸' : '➔'}
                                </span>
                                <span style={{ fontWeight: 600, fontSize: 12, color: isHold ? 'var(--secondary)' : 'var(--on-surface)' }}>
                                  {formatUnitName(item.unit)}
                                </span>
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--on-surface-variant)', maxWidth: '55%', textAlign: 'right', lineHeight: 1.4 }}>
                                {item.reason}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Item Allocations */}
                  <div>
                    <div className="section-label" style={{ color: 'var(--on-surface-variant)' }}>Optimal Item Allocation</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      {/* Carries */}
                      <div className="carry-block">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tertiary)', paddingBottom: 10, borderBottom: '1px solid var(--outline-variant)', marginBottom: 12 }}>
                          Carries
                        </div>
                        {(activeComp.carries || []).length === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic' }}>—</span>
                        ) : (activeComp.carries || []).map((carry) => (
                          <div key={carry} style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--on-surface)', marginBottom: 7 }}>{formatUnitName(carry)}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {(activeComp.items?.[carry] || []).map((item) => (
                                <span key={item} className="item-chip">{item}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Tanks */}
                      <div className="carry-block">
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--primary)', paddingBottom: 10, borderBottom: '1px solid var(--outline-variant)', marginBottom: 12 }}>
                          Frontline
                        </div>
                        {(activeComp.tanks || []).length === 0 ? (
                          <span style={{ fontSize: 11, color: 'var(--secondary)', fontStyle: 'italic' }}>—</span>
                        ) : (activeComp.tanks || []).map((tank) => (
                          <div key={tank} style={{ marginBottom: 12 }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--on-surface)', marginBottom: 7 }}>{formatUnitName(tank)}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              {(activeComp.items?.[tank] || []).map((item) => (
                                <span key={item} className="item-chip">{item}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                <EmptyDetail />
              )}
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}