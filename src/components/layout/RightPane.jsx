import { useState } from 'react';
import useStore from '../../core/store';
import Viewport3D from './Viewport3D';

export default function RightPane() {
  const pluginOutputs = useStore((state) => state.pluginOutputs);
  const [activeTab, setActiveTab] = useState('3d');

  const tabStyle = (isActive) => ({
    padding: '0.5rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold', transition: 'all 0.2s',
    backgroundColor: isActive ? '#333' : 'transparent',
    color: isActive ? '#fff' : '#888'
  });

  return (
    <div style={{ flex: 1, position: 'relative', backgroundColor: '#121212', overflow: 'hidden' }}>
      
      {/* --- FLOATING TABS HEADER --- */}
      <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, display: 'flex', gap: '4px', backgroundColor: 'rgba(24, 24, 24, 0.8)', padding: '4px', borderRadius: '8px', backdropFilter: 'blur(10px)', border: '1px solid #333' }}>
        <button onClick={() => setActiveTab('3d')} style={tabStyle(activeTab === '3d')}>🧊 3D View</button>
        <button onClick={() => setActiveTab('data')} style={tabStyle(activeTab === 'data')}>📊 Data View</button>
      </div>

      {/* --- CANVAS CONTENT --- */}
      <div style={{ width: '100%', height: '100%' }}>
        {activeTab === 'data' ? (
          <pre style={{ margin: 0, width: '100%', height: '100%', backgroundColor: '#121212', color: '#4af626', padding: '4.5rem 1.5rem 1.5rem', overflowY: 'auto', boxSizing: 'border-box', fontSize: '0.9rem' }}>
            {Object.keys(pluginOutputs).length === 0 
              ? "// Select a tool and generate data..." 
              : JSON.stringify(pluginOutputs, null, 2)}
          </pre>
        ) : (
          <Viewport3D />
        )}
      </div>

    </div>
  );
}