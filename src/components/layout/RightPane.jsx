import { useState } from 'react';
import useStore from '../../core/store';
import Viewport3D from './Viewport3D';

export default function RightPane() {
  const { pluginOutputs, theme, toggleTheme, visibility, toggleLevel, toggleType, activePluginId, clipping, setClipping } = useStore(); 
  const [activeTab, setActiveTab] = useState('3d');
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isSectionOpen, setIsSectionOpen] = useState(false); // 🪄 New state for Section tool

  const isDark = theme === 'dark';
  const isMenuOpen = !!activePluginId;
  const leftOffset = isMenuOpen ? 300 : 60; 

  const bgGlass = isDark ? 'rgba(24, 24, 24, 0.65)' : 'rgba(255, 255, 255, 0.75)';
  const bgSolid = isDark ? 'rgba(24, 24, 24, 0.9)' : 'rgba(255, 255, 255, 0.9)';
  const borderCol = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
  const txtCol = isDark ? '#ffffff' : '#111111';
  const dimCol = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  const typeColors = pluginOutputs?.meta?.colors || { Grid: '#00d1b2' };
  const availableLevels = pluginOutputs?.meta?.levels || [0, 1, 2, 3];

  const tabStyle = (isActive) => ({
    padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s',
    backgroundColor: isActive ? hoverBg : 'transparent', color: isActive ? txtCol : dimCol
  });

  const btnStyle = (isVisible) => ({
    display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', 
    color: isVisible ? txtCol : dimCol, cursor: 'pointer', padding: '6px 4px', width: '100%', textAlign: 'left', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s'
  });

  const generateQTO = () => {
    if (!pluginOutputs || pluginOutputs.renderType !== 'floorplan-grid') return <div style={{ padding: '2rem', color: dimCol, fontFamily: 'monospace' }}>// Generate layout...</div>;
    const qto = {};
    if (pluginOutputs.slabs) pluginOutputs.slabs.forEach(slab => {
        const type = slab.typeId || 'Unknown Slab';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isSlab: true };
        qto[type].count += 1; qto[type].area += (slab.width * slab.depth); qto[type].volume += (slab.width * slab.depth * slab.height);
    });
    if (pluginOutputs.walls) pluginOutputs.walls.forEach(wall => {
        const type = wall.typeId || 'Unknown Wall';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isSlab: false };
        qto[type].count += 1; qto[type].length += wall.length; qto[type].area += (wall.length * wall.height); qto[type].volume += (wall.length * wall.height * wall.thickness);
    });

    const cellStyle = { padding: '12px', borderBottom: `1px solid ${borderCol}`, textAlign: 'right', color: txtCol };
    const headerStyle = { ...cellStyle, color: dimCol, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' };

    return (
      <div style={{ padding: `4.5rem 2rem 2rem ${leftOffset + 48}px`, transition: 'padding-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', color: txtCol, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Quantity Takeoff (CSV)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', backgroundColor: isDark ? 'rgba(24,24,24,0.6)' : 'rgba(255,255,255,0.6)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <thead><tr><th style={{ ...headerStyle, textAlign: 'left' }}>Element Type</th><th style={{ ...headerStyle }}>Count</th><th style={{ ...headerStyle }}>Total Length (m)</th><th style={{ ...headerStyle }}>Total Area (m²)</th><th style={{ ...headerStyle }}>Total Volume (m³)</th></tr></thead>
          <tbody>
            {Object.keys(qto).sort().map(type => (
              <tr key={type} style={{ transition: 'background 0.2s', ':hover': { backgroundColor: hoverBg } }}>
                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type] || '#ccc', marginRight: '10px' }}></span>{type}</td>
                <td style={{ ...cellStyle }}>{qto[type].count}</td><td style={{ ...cellStyle }}>{qto[type].isSlab ? '-' : qto[type].length.toFixed(2)}</td><td style={{ ...cellStyle }}>{qto[type].area.toFixed(2)}</td><td style={{ ...cellStyle, fontWeight: 'bold' }}>{qto[type].volume.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: isDark ? '#121212' : '#f5f5f5', overflow: 'hidden', transition: 'background 0.3s' }}>
      
      {/* 🪄 TABS & ICONS HEADER */}
      <div style={{ position: 'absolute', top: '1rem', left: `${leftOffset + 32}px`, transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 30, display: 'flex', flexWrap: 'wrap', gap: '4px', backgroundColor: bgGlass, padding: '4px', borderRadius: '8px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${borderCol}` }}>
        <button onClick={() => setActiveTab('3d')} style={tabStyle(activeTab === '3d')}>🧊 3D</button>
        <button onClick={() => setActiveTab('data')} style={tabStyle(activeTab === 'data')}>📊 CSV</button>
        <button onClick={toggleTheme} style={{ ...tabStyle(false), marginLeft: '4px', fontSize: '1rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
        
        {activeTab === '3d' && (
          <>
            <button onClick={() => { setIsVisibilityOpen(!isVisibilityOpen); setIsSectionOpen(false); }} style={{ ...tabStyle(isVisibilityOpen), marginLeft: '4px', borderLeft: `1px solid ${borderCol}`, paddingLeft: '1rem', borderRadius: '0' }}>
              👁️ Layers
            </button>
            <button onClick={() => { setIsSectionOpen(!isSectionOpen); setIsVisibilityOpen(false); }} style={{ ...tabStyle(isSectionOpen), borderRadius: '0 6px 6px 0', color: clipping.enabled ? '#4af626' : dimCol }}>
              ✂️ Section
            </button>
          </>
        )}
      </div>

      {/* VISIBILITY PANEL */}
      {activeTab === '3d' && isVisibilityOpen && (
        <div style={{ position: 'absolute', top: '4.5rem', left: `${leftOffset + 32}px`, zIndex: 20, backgroundColor: bgSolid, padding: '16px', borderRadius: '8px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', width: '200px', maxHeight: 'calc(100vh - 6rem)', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: `1px solid ${borderCol}`, paddingBottom: '8px' }}>
            <h4 style={{ margin: 0, color: dimCol, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Visibility</h4>
            <button onClick={() => setIsVisibilityOpen(false)} style={{ background: 'transparent', border: 'none', color: dimCol, cursor: 'pointer', padding: 0 }}>✕</button>
          </div>
          <h4 style={{ margin: '0 0 8px 0', color: dimCol, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Project Levels</h4>
          {[...availableLevels].map(lvl => (
            <button key={`lvl-${lvl}`} onClick={() => toggleLevel(lvl)} style={btnStyle(visibility.levels[lvl])}><span style={{ marginRight: '8px', opacity: visibility.levels[lvl] ? 1 : 0.3 }}>👁️</span> Level 0{lvl}</button>
          ))}
          <h4 style={{ margin: '16px 0 8px 0', color: dimCol, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Element Types</h4>
          {Object.keys(visibility.types).sort().map(type => (
            <button key={`type-${type}`} onClick={() => toggleType(type)} style={btnStyle(visibility.types[type])}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type] || '#ccc', marginRight: '10px', opacity: visibility.types[type] ? 1 : 0.2 }}></span>{type}</button>
          ))}
        </div>
      )}

      {/* 🪄 SECTIONING PANEL */}
      {activeTab === '3d' && isSectionOpen && (
        <div style={{ position: 'absolute', top: '4.5rem', left: `${leftOffset + 32}px`, zIndex: 20, backgroundColor: bgSolid, padding: '16px', borderRadius: '8px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: `1px solid ${borderCol}`, display: 'flex', flexDirection: 'column', width: '240px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: `1px solid ${borderCol}`, paddingBottom: '8px' }}>
            <h4 style={{ margin: 0, color: dimCol, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Sectioning</h4>
            <button onClick={() => setIsSectionOpen(false)} style={{ background: 'transparent', border: 'none', color: dimCol, cursor: 'pointer', padding: 0 }}>✕</button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.8rem', color: txtCol, fontWeight: 'bold' }}>Enable Cut</span>
            <input type="checkbox" checked={clipping.enabled} onChange={(e) => setClipping({ enabled: e.target.checked })} style={{ cursor: 'pointer', accentColor: '#4af626' }} />
          </div>

          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
            {['y', 'x', 'z'].map(axis => (
              <button 
                key={axis} onClick={() => setClipping({ axis })} 
                style={{ flex: 1, padding: '6px', borderRadius: '4px', border: `1px solid ${borderCol}`, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: clipping.axis === axis ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 'transparent', color: clipping.axis === axis ? txtCol : dimCol }}
              >
                {axis.toUpperCase()} Cut
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: dimCol }}>
            <span>Distance</span><span style={{ color: txtCol, fontWeight: 'bold' }}>{clipping.distance.toFixed(1)}m</span>
          </div>
          {/* Dynamic slider based on axis. Y cuts vertically, X/Z cut horizontally */}
          <input 
            type="range" min={clipping.axis === 'y' ? -5 : -25} max={clipping.axis === 'y' ? 15 : 25} step="0.1" value={clipping.distance} 
            onChange={(e) => setClipping({ distance: Number(e.target.value) })} 
            style={{ width: '100%', cursor: 'pointer', accentColor: '#4af626', height: '4px', opacity: clipping.enabled ? 1 : 0.3 }} 
            disabled={!clipping.enabled}
          />
        </div>
      )}

      <div style={{ width: '100%', height: '100%' }}>{activeTab === 'data' ? generateQTO() : <Viewport3D />}</div>
    </div>
  );
}