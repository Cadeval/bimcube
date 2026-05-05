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

  const typeColors = { Grid: '#00d1b2', WE01: '#d32f2f', WE02: '#f57c00', WI01: '#795548', WI02: '#9e9e9e', WI03: '#00acc1', SL01: '#8d6e63', SL02: '#bdbdbd' };

  // --- 🪄 QUANTITY TAKEOFF (QTO) ENGINE 🪄 ---
  const generateQTO = () => {
    if (!pluginOutputs || pluginOutputs.renderType !== 'floorplan-grid') {
      return (
        <div style={{ padding: '2rem', color: theme === 'dark' ? '#888' : '#666', fontFamily: 'monospace' }}>
          // Generate a floorplan grid to view quantities...
        </div>
      );
    }

    const qto = {};

    // 1. Process Slabs
    if (pluginOutputs.slabs) {
      pluginOutputs.slabs.forEach(slab => {
        const type = slab.typeId || 'Unknown Slab';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isSlab: true };
        
        qto[type].count += 1;
        qto[type].area += (slab.width * slab.depth);
        qto[type].volume += (slab.width * slab.depth * slab.height);
      });
    }

    // 2. Process Walls
    if (pluginOutputs.walls) {
      pluginOutputs.walls.forEach(wall => {
        const type = wall.typeId || 'Unknown Wall';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isSlab: false };
        
        qto[type].count += 1;
        qto[type].length += wall.length;
        qto[type].area += (wall.length * wall.height);
        qto[type].volume += (wall.length * wall.height * wall.thickness);
      });
    }

    // UI Formatting Styles
    const cellStyle = { padding: '12px', borderBottom: `1px solid ${theme === 'dark' ? '#333' : '#ddd'}`, textAlign: 'right' };
    const headerStyle = { ...cellStyle, color: theme === 'dark' ? '#888' : '#666', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' };

    return (
      <div style={{ padding: '4.5rem 2rem 2rem', color: theme === 'dark' ? '#e0e0e0' : '#111', height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Quantity Takeoff (QTO)</h2>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', backgroundColor: theme === 'dark' ? '#181818' : '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: 'left' }}>Element Type</th>
              <th style={{ ...headerStyle }}>Count</th>
              <th style={{ ...headerStyle }}>Total Length (m)</th>
              <th style={{ ...headerStyle }}>Total Area (m²)</th>
              <th style={{ ...headerStyle }}>Total Volume (m³)</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(qto).sort().map(type => (
              <tr key={type} style={{ transition: 'background 0.2s', ':hover': { backgroundColor: theme === 'dark' ? '#222' : '#f9f9f9' } }}>
                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type] || '#ccc', marginRight: '10px' }}></span>
                  {type}
                </td>
                <td style={{ ...cellStyle }}>{qto[type].count}</td>
                <td style={{ ...cellStyle, color: theme === 'dark' ? '#4af626' : '#008800' }}>
                  {qto[type].isSlab ? '-' : qto[type].length.toFixed(2)}
                </td>
                <td style={{ ...cellStyle }}>{qto[type].area.toFixed(2)}</td>
                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{qto[type].volume.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, position: 'relative', backgroundColor: theme === 'dark' ? '#121212' : '#f0f0f0', overflow: 'hidden', transition: 'background 0.3s' }}>
      
      {/* HEADER TABS */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '4px', backgroundColor: 'rgba(24, 24, 24, 0.8)', padding: '4px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid #333' }}>
        <button onClick={() => setActiveTab('3d')} style={tabStyle(activeTab === '3d')}>🧊 3D View</button>
        <button onClick={() => setActiveTab('data')} style={tabStyle(activeTab === 'data')}>📊 Data View</button>
        <button onClick={toggleTheme} style={{ ...tabStyle(false), marginLeft: '10px', fontSize: '1rem' }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      </div>

      {/* MULTI-DIMENSIONAL FILTER PANEL (Only show in 3D View) */}
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
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type], marginRight: '10px', opacity: visibility.types[type] ? 1 : 0.2 }}></span>
              {type}
            </button>
          ))}

        </div>
      )}

      {/* CANVAS CONTENT */}
      <div style={{ width: '100%', height: '100%' }}>
        {activeTab === 'data' ? generateQTO() : <Viewport3D />}
      </div>
    </div>
  );
}