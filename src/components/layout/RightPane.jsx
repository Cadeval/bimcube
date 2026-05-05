import { useState } from 'react';
import useStore from '../../core/store';
import Viewport3D from './Viewport3D';

export default function RightPane() {
  const { pluginOutputs, theme, toggleTheme, visibility, toggleLevel, toggleType } = useStore(); 
  const [activeTab, setActiveTab] = useState('3d');

  const tabStyle = (isActive) => ({
    padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s',
    backgroundColor: isActive ? '#333' : 'transparent', color: isActive ? '#fff' : '#888'
  });

  const btnStyle = (isVisible) => ({
    display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: isVisible ? '#fff' : '#555', cursor: 'pointer', padding: '6px 4px', width: '100%', textAlign: 'left', fontWeight: 'bold', fontSize: '0.8rem', transition: 'all 0.2s'
  });

  // Color mappings for the badges!
  const typeColors = { Grid: '#00d1b2', WE01: '#d32f2f', WE02: '#f57c00', WI01: '#795548', WI02: '#9e9e9e', WI03: '#00acc1', SL01: '#8d6e63', SL02: '#bdbdbd' };

  return (
    <div style={{ flex: 1, position: 'relative', backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f0', overflow: 'hidden', transition: 'background 0.3s' }}>
      
      {/* HEADER TABS */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '4px', backgroundColor: 'rgba(24, 24, 24, 0.8)', padding: '4px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid #333' }}>
        <button onClick={() => setActiveTab('3d')} style={tabStyle(activeTab === '3d')}>🧊 3D View</button>
        <button onClick={() => setActiveTab('data')} style={tabStyle(activeTab === 'data')}>📊 Data View</button>
        <button onClick={toggleTheme} style={{ ...tabStyle(false), marginLeft: '10px', fontSize: '1rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>

      {/* MULTI-DIMENSIONAL FILTER PANEL */}
      {activeTab === '3d' && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, backgroundColor: 'rgba(20, 20, 20, 0.9)', padding: '16px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid #333', display: 'flex', flexDirection: 'column', width: '180px', maxHeight: '80vh', overflowY: 'auto' }}>
          
          <h4 style={{ margin: '0 0 12px 0', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>Project Levels</h4>
          {[0, 1, 2, 3].map(lvl => (
            <button key={`lvl-${lvl}`} onClick={() => toggleLevel(lvl)} style={btnStyle(visibility.levels[lvl])}>
              <span style={{ marginRight: '8px', opacity: visibility.levels[lvl] ? 1 : 0.3 }}>👁️</span> Level 0{lvl}
            </button>
          ))}

          <h4 style={{ margin: '20px 0 12px 0', color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', borderBottom: '1px solid #333', paddingBottom: '4px' }}>Element Types</h4>
          {Object.keys(visibility.types).map(type => (
            <button key={`type-${type}`} onClick={() => toggleType(type)} style={btnStyle(visibility.types[type])}>
              {/* Color Badge! */}
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type], marginRight: '10px', opacity: visibility.types[type] ? 1 : 0.2 }}></span>
              {type}
            </button>
          ))}

        </div>
      )}

      {/* CANVAS CONTENT */}
      <div style={{ width: '100%', height: '100%' }}>
        {activeTab === 'data' ? (
          <pre style={{ margin: 0, width: '100%', height: '100%', backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f0', color: theme === 'dark' ? '#4af626' : '#008800', padding: '4.5rem 1.5rem 1.5rem', overflowY: 'auto', boxSizing: 'border-box', fontSize: '0.9rem' }}>
            {Object.keys(pluginOutputs).length === 0 ? "// Select a tool..." : JSON.stringify(pluginOutputs, null, 2)}
          </pre>
        ) : (
          <Viewport3D />
        )}
      </div>
    </div>
  );
}