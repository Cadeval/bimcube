import useStore from '../../core/store';
import Viewport3D from './Viewport3D';
import MapArea from './MapArea';

export default function MainArea() {
  const { mainViewMode, setMainViewMode, active2DView, setActive2DView, theme, pluginOutputs, setCameraView } = useStore();
  const isDark = theme === 'dark';

  const viewOptions = [];
  if (pluginOutputs?.meta?.levels) {
    pluginOutputs.meta.levels.forEach(lvl => viewOptions.push({ id: `Floorplan-${lvl}`, label: `📐 Floorplan L0${lvl}` }));
  }
  
  if (pluginOutputs?.coordinates) {
    const xGrids = new Set();
    const zGrids = new Set();
    pluginOutputs.coordinates.forEach(c => {
      if (c.name) { xGrids.add(c.name.charAt(0)); zGrids.add(c.name.charAt(1)); }
    });
    Array.from(xGrids).sort().forEach(g => viewOptions.push({ id: `Section-X-${g}`, label: `✂️ Section Grid ${g}` }));
    Array.from(zGrids).sort().forEach(g => viewOptions.push({ id: `Section-Z-${g}`, label: `✂️ Section Grid ${g}` }));
  }

  const generateQTO = () => {
    if (!pluginOutputs || pluginOutputs.renderType !== 'floorplan-grid') {
        return <div style={{ padding: '4rem', color: isDark ? '#fff' : '#000', fontFamily: 'monospace' }}>// Generate layout to view data...</div>;
    }
    const qto = {};
    
    if (pluginOutputs.slabs) pluginOutputs.slabs.forEach(slab => {
        const type = slab.typeId || 'Unknown Slab';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isRoom: false };
        qto[type].count += 1; qto[type].area += (slab.width * slab.depth); qto[type].volume += (slab.width * slab.depth * slab.height);
    });
    
    if (pluginOutputs.walls) pluginOutputs.walls.forEach(wall => {
        const type = wall.typeId || 'Unknown Wall';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isRoom: false };
        qto[type].count += 1; qto[type].length += wall.length; qto[type].area += (wall.length * wall.height); qto[type].volume += (wall.length * wall.height * wall.thickness);
    });

    if (pluginOutputs.rooms) pluginOutputs.rooms.forEach(room => {
        const type = room.typeId || 'Unknown Space';
        if (!qto[type]) qto[type] = { count: 0, length: 0, area: 0, volume: 0, isRoom: true };
        qto[type].count += 1; 
        qto[type].area += room.area; 
        qto[type].volume += room.volume;
    });

    const typeColors = pluginOutputs?.meta?.colors || {};
    const borderCol = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.1)';
    const txtCol = isDark ? '#ffffff' : '#111111';
    const dimCol = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const cellStyle = { padding: '12px', borderBottom: `1px solid ${borderCol}`, textAlign: 'right', color: txtCol };
    const headerStyle = { ...cellStyle, color: dimCol, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' };

    return (
      <div style={{ padding: '5rem 2rem 2rem 2rem', color: txtCol, height: '100%', overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ marginBottom: '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Quantity Takeoff (CSV)</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', backgroundColor: isDark ? 'rgba(24,24,24,0.6)' : 'rgba(255,255,255,0.6)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <thead><tr><th style={{ ...headerStyle, textAlign: 'left' }}>Element Type</th><th style={{ ...headerStyle }}>Count</th><th style={{ ...headerStyle }}>Total Length (m)</th><th style={{ ...headerStyle }}>Total Area (m²)</th><th style={{ ...headerStyle }}>Total Volume (m³)</th></tr></thead>
          <tbody>
            {Object.keys(qto).sort().map(type => (
              <tr key={type}>
                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: typeColors[type] || '#ccc', marginRight: '10px' }}></span>{type}</td>
                <td style={{ ...cellStyle }}>{qto[type].count}</td>
                <td style={{ ...cellStyle }}>{qto[type].isRoom ? '-' : qto[type].length.toFixed(2)}</td>
                <td style={{ ...cellStyle }}>{qto[type].area.toFixed(2)}</td>
                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{qto[type].volume.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const selectStyle = {
    background: isDark ? 'rgba(24,24,24,0.8)' : 'rgba(255,255,255,0.8)',
    color: isDark ? '#fff' : '#000', border: `1px solid ${isDark ? '#333' : '#ccc'}`,
    padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', outline: 'none',
    backdropFilter: 'blur(8px)', fontWeight: 'bold', fontSize: '0.85rem'
  };

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
      
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '8px' }}>
        
        {mainViewMode === '3D' && (
           <select onChange={(e) => { setCameraView(e.target.value); e.target.value = 'default'; }} defaultValue="default" style={selectStyle}>
             <option value="default" disabled hidden>🎥 Set Camera...</option>
             <option value="top">Top</option><option value="bottom">Bottom</option>
             <option value="front">Front</option><option value="back">Back</option>
             <option value="left">Left</option><option value="right">Right</option>
             <option value="iso">Isometric</option>
           </select>
        )}

        {mainViewMode === '2D' && (
           <select value={active2DView} onChange={(e) => setActive2DView(e.target.value)} style={{...selectStyle, color: '#00d1b2', borderColor: '#00d1b2'}}>
              {viewOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
           </select>
        )}

        <select value={mainViewMode} onChange={(e) => setMainViewMode(e.target.value)} style={selectStyle}>
          <option value="3D">🧊 3D View</option>
          <option value="2D">📐 2D Plan</option>
          <option value="Map">🗺️ Map Mode</option> 
          <option value="AR">👓 AR Mode</option> 
          <option value="CSV">📊 CSV Data</option>
        </select>
      </div>

      {(mainViewMode === '3D' || mainViewMode === '2D') && <Viewport3D />}
      {mainViewMode === 'CSV' && generateQTO()}
      {mainViewMode === 'Map' && <MapArea />} 
      
      {mainViewMode === 'AR' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: isDark ? '#fff' : '#111', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
            <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>👓</h1>
            <h2 style={{ fontWeight: '900', marginBottom: '0.5rem' }}>WebXR / AR Mode</h2>
            <p style={{ color: isDark ? '#aaa' : '#666', maxWidth: '400px', textAlign: 'center', lineHeight: '1.6' }}>
              We are currently optimizing the 1:1 scale building projection for mobile devices and Apple Vision Pro. Check back in the next update!
            </p>
        </div>
      )}
    </div>
  );
}