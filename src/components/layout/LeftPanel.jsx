import { useRef } from 'react'; 
import useStore from '../../core/store';
import Slider from '../ui/Slider';
import ColorInput from '../ui/ColorInput';
import NumberInput from '../ui/NumberInput';
import floorplanManifest from '../../plugins/FloorplanGrid/manifest.json';

const PanelLeftCloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <path d="M15 15l-3-3 3-3"></path>
  </svg>
);

export default function LeftPanel() {
  const { 
    isLeftPanelOpen, toggleLeftPanel, activeTab, theme, toggleTheme,
    selectedObject, setSelectedObject, pluginInputs, setInputValue,
    visibility, toggleLevel, toggleType, pluginOutputs,
    clipping, setClipping,
    undo, redo, pastInputs, futureInputs, log, loadSession
  } = useStore();
  
  const fileInputRef = useRef(null); 

  const isDark = theme === 'dark';
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const txtCol = isDark ? '#fff' : '#111';
  const dimCol = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';

  if (!isLeftPanelOpen) return null;

  const getTitle = () => {
    if (selectedObject) return `Selected: ${selectedObject.category}`;
    const titles = { inputs: 'Parameters', layers: 'Layers', section: 'Sectioning', view: 'View Settings', log: 'Event Log', output: 'Export Output' };
    return titles[activeTab] || 'Settings';
  };

  const btnStyle = (isVisible) => ({
    display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', 
    color: isVisible ? txtCol : dimCol, cursor: 'pointer', padding: '8px 6px', width: '100%', 
    textAlign: 'left', fontWeight: 'bold', fontSize: '0.85rem', transition: 'all 0.2s', borderRadius: '4px'
  });

  const availableLevels = pluginOutputs?.meta?.levels || [];
  const typeColors = pluginOutputs?.meta?.colors || {};

  const exportSession = () => {
    const data = "--- BIMCUBE SESSION PARAMS ---\n" + JSON.stringify(pluginInputs, null, 2) + "\n\n--- EVENT LOG ---\n" + log.join("\n");
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `bimcube_session_${new Date().getTime()}.txt`; a.click(); URL.revokeObjectURL(url);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target.result.split('--- BIMCUBE SESSION PARAMS ---')[1].split('--- EVENT LOG ---')[0].trim();
        loadSession(JSON.parse(jsonString));
      } catch (err) { alert("Could not load file."); }
    };
    reader.readAsText(file);
    event.target.value = ''; 
  };

  return (
    <div style={{
      // 🪄 THE FLOATING GLASS ENGINE
      position: 'absolute',    // Takes it out of the layout flow!
      left: '60px',            // Snaps it exactly next to the Sidebar
      top: 0, bottom: 0, 
      width: '280px', 
      zIndex: 40, 
      display: 'flex', flexDirection: 'column',
      backgroundColor: isDark ? 'rgba(24, 24, 24, 0.65)' : 'rgba(255, 255, 255, 0.65)', // Highly transparent!
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', // Heavy frost blur
      borderRight: `1px solid ${borderCol}`,
      boxShadow: '4px 0 24px rgba(0,0,0,0.15)'
    }}>
      
      <div style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        padding: '12px 16px', height: '56px', boxSizing: 'border-box', 
        borderBottom: `1px solid ${borderCol}` 
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button onClick={undo} disabled={pastInputs.length === 0} style={{ background: 'transparent', border: 'none', color: pastInputs.length > 0 ? txtCol : dimCol, cursor: pastInputs.length > 0 ? 'pointer' : 'not-allowed' }}>◀</button>
          <button onClick={redo} disabled={futureInputs.length === 0} style={{ background: 'transparent', border: 'none', color: futureInputs.length > 0 ? txtCol : dimCol, cursor: futureInputs.length > 0 ? 'pointer' : 'not-allowed' }}>▶</button>
          
          <div style={{ width: '1px', height: '16px', backgroundColor: borderCol, margin: '0 4px' }} />
          
          <input type="file" accept=".txt" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
          
          <button onClick={() => fileInputRef.current?.click()} title="Open Session" style={{ background: 'transparent', border: 'none', color: txtCol, cursor: 'pointer' }}>📂</button>
          <button onClick={exportSession} title="Save Session" style={{ background: 'transparent', border: 'none', color: txtCol, cursor: 'pointer' }}>💾</button>
          <button onClick={toggleTheme} title="Toggle Theme" style={{ background: 'transparent', border: 'none', color: txtCol, cursor: 'pointer', fontSize: '1.1rem', marginLeft: '4px' }}>
             {isDark ? '☀️' : '🌙'}
          </button>
        </div>

        <button onClick={toggleLeftPanel} title="Close Panel" style={{ background: 'transparent', border: 'none', color: dimCol, cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
          <PanelLeftCloseIcon />
        </button>
      </div>

      <div style={{ padding: '16px 16px 8px 16px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px', color: dimCol }}>
        {getTitle()}
      </div>

      <div style={{ padding: '0 16px 16px 16px', overflowY: 'auto', flex: 1 }}>
        {selectedObject ? (
          <div>
            <button onClick={() => setSelectedObject(null)} style={{ width: '100%', padding: '8px', marginBottom: '16px', background: isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.05)', border: 'none', color: txtCol, cursor: 'pointer', borderRadius: '4px' }}>
              ✕ Deselect
            </button>
            <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Type:</span> <strong>{selectedObject.typeId}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Level:</span> <strong>0{selectedObject.level}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Height:</span> <strong>{selectedObject.height?.toFixed(2)} m</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Thickness:</span> <strong>{((selectedObject.depth || selectedObject.thickness) * 1000)?.toFixed(0)} mm</strong></div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'inputs' && (
              Object.entries(floorplanManifest.inputs).map(([key, config]) => {
                const val = pluginInputs[key] ?? config.defaultValue;
                if (config.type === 'color') return <ColorInput key={key} label={config.label} value={val} onChange={(v) => setInputValue(key, v)} />;
                if (config.type === 'number') return <NumberInput key={key} label={config.label} value={val} onChange={(v) => setInputValue(key, v)} />;
                if (config.type === 'select') return (
                    <div key={key} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: dimCol }}>{config.label}</span>
                      <select value={val} onChange={(e) => setInputValue(key, e.target.value)} style={{ background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', color: txtCol, border: `1px solid ${borderCol}`, borderRadius: '4px', padding: '4px 6px', fontSize: '0.75rem', outline: 'none' }}>
                        {config.options.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                      </select>
                    </div>
                );
                return <Slider key={key} label={config.label} min={config.min} max={config.max} step={config.step} value={val} onChange={(v) => setInputValue(key, v)} />;
              })
            )}

            {activeTab === 'layers' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: dimCol, fontSize: '0.7rem', textTransform: 'uppercase' }}>Storeys</h4>
                {availableLevels.map(lvl => (
                  <button key={`lvl-${lvl}`} onClick={() => toggleLevel(lvl)} style={btnStyle(visibility.levels[lvl])} onMouseOver={e=>e.currentTarget.style.background=hoverBg} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ marginRight: '8px', opacity: visibility.levels[lvl] ? 1 : 0.3 }}>👁️</span> Level 0{lvl}
                  </button>
                ))}
                <h4 style={{ margin: '16px 0 8px 0', color: dimCol, fontSize: '0.7rem', textTransform: 'uppercase' }}>Elements</h4>
                {Object.keys(visibility.types).sort().map(type => (
                  <button key={`type-${type}`} onClick={() => toggleType(type)} style={btnStyle(visibility.types[type])} onMouseOver={e=>e.currentTarget.style.background=hoverBg} onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type] || '#ccc', marginRight: '10px', opacity: visibility.types[type] ? 1 : 0.2 }}></span>
                    {type}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'section' && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.85rem', color: txtCol, fontWeight: 'bold' }}>Enable Cut</span>
                  <input type="checkbox" checked={clipping.enabled} onChange={(e) => setClipping({ enabled: e.target.checked })} style={{ cursor: 'pointer', accentColor: '#4af626', width: '18px', height: '18px' }} />
                </div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                  {['y', 'x', 'z'].map(axis => (
                    <button key={axis} onClick={() => setClipping({ axis })} 
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: `1px solid ${borderCol}`, cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', backgroundColor: clipping.axis === axis ? (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') : 'transparent', color: clipping.axis === axis ? txtCol : dimCol }}
                    >
                      {axis.toUpperCase()}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: dimCol }}>
                  <span>Cut Distance</span><span style={{ color: txtCol, fontWeight: 'bold' }}>{clipping.distance.toFixed(1)}m</span>
                </div>
                <input type="range" min={clipping.axis === 'y' ? -5 : -25} max={clipping.axis === 'y' ? 15 : 25} step="0.1" value={clipping.distance} onChange={(e) => setClipping({ distance: Number(e.target.value) })} style={{ width: '100%', cursor: 'pointer', accentColor: '#4af626', height: '4px', opacity: clipping.enabled ? 1 : 0.3 }} disabled={!clipping.enabled} />
              </div>
            )}
            
            {activeTab === 'view' && <div style={{ color: dimCol, fontSize: '0.8rem' }}>Camera settings...</div>}
            {activeTab === 'output' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: dimCol, fontSize: '0.7rem', textTransform: 'uppercase' }}>3D Model Export</h4>
                
                <button 
                  onClick={() => useStore.getState().triggerExport('gltf')}
                  style={{ padding: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: txtCol, border: `1px solid ${borderCol}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseOver={e=>e.currentTarget.style.backgroundColor=hoverBg} onMouseOut={e=>e.currentTarget.style.backgroundColor=isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>📦</span> Export GLB (Recommended)
                </button>
                
                <button 
                  onClick={() => useStore.getState().triggerExport('obj')}
                  style={{ padding: '10px', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: txtCol, border: `1px solid ${borderCol}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onMouseOver={e=>e.currentTarget.style.backgroundColor=hoverBg} onMouseOut={e=>e.currentTarget.style.backgroundColor=isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                >
                  <span style={{ fontSize: '1.2rem' }}>🧊</span> Export OBJ (Raw Geometry)
                </button>

                <p style={{ fontSize: '0.75rem', color: dimCol, marginTop: '8px', lineHeight: '1.5' }}>
                  <strong>GLB</strong> preserves colors, metallic materials, and glass transparency perfectly.<br/><br/>
                  <strong>OBJ</strong> only exports the raw gray geometry meshes.
                </p>
              </div>
            )}
            {activeTab === 'log' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <button onClick={exportSession} style={{ width: '100%', padding: '10px', marginBottom: '16px', backgroundColor: '#3366ff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(51, 102, 255, 0.3)' }}>
                  📥 Download Session Log
                </button>
                <div style={{ flex: 1, color: dimCol, fontSize: '0.75rem', fontFamily: 'monospace', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {log.map((entry, i) => (
                    <div key={i} style={{ paddingBottom: '4px', borderBottom: `1px solid ${borderCol}` }}>{entry}</div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}