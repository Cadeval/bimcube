import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../../core/store';

// 🪄 SMART PARSER
const parseCoords = (str) => {
  if (!str) return { lat: 48.225023, lng: 16.330946, rot: 0, boundary: [] };
  const parts = str.split(',').map(n => parseFloat(n.trim()));
  
  const lat = isNaN(parts[0]) ? 48.225023 : parts[0];
  const lng = isNaN(parts[1]) ? 16.330946 : parts[1];
  const rot = isNaN(parts[2]) ? 0 : parts[2];
  
  const boundary = [];
  for (let i = 3; i < parts.length; i += 2) {
      if (!isNaN(parts[i]) && !isNaN(parts[i+1])) {
          boundary.push([parts[i], parts[i+1]]);
      }
  }
  return { lat, lng, rot, boundary };
};

const serializeCoords = (lat, lng, rot, boundary) => {
  let str = `${lat.toFixed(6)}, ${lng.toFixed(6)}, ${rot}`;
  boundary.forEach(pt => {
      str += `, ${pt[0].toFixed(6)}, ${pt[1].toFixed(6)}`;
  });
  return str;
};

// 🪄 EVENT LISTENER: Now allows continuous clicking until user saves!
const MapEvents = ({ mapAction, lat, lng, rot, boundary, setInputValue }) => {
  useMapEvents({
    click(e) {
      if (mapAction === 'place') {
          // Updates position but stays in 'place' mode!
          setInputValue('siteCoords', serializeCoords(e.latlng.lat, e.latlng.lng, rot, boundary));
      } else if (mapAction === 'draw') {
          const newBoundary = [...boundary, [e.latlng.lat, e.latlng.lng]];
          setInputValue('siteCoords', serializeCoords(lat, lng, rot, newBoundary));
      }
    },
  });
  return null;
};

const MapController = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
     const currentCenter = map.getCenter();
     if (map.distance(currentCenter, [lat, lng]) > 50) { 
         map.flyTo([lat, lng], map.getZoom() < 18 ? 19 : map.getZoom(), { animate: true, duration: 1.5 });
     }
  }, [lat, lng, map]);
  return null;
};

export default function MapArea() {
  const { pluginInputs, setInputValue, pluginOutputs, theme, isLeftPanelOpen } = useStore();
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapAction, setMapAction] = useState('idle');

  const { lat, lng, rot, boundary } = parseCoords(pluginInputs.siteCoords);

  const widthX = pluginOutputs?.dimensions?.widthX || 22;
  const depthY = pluginOutputs?.dimensions?.depthY || 16;
  const mToLat = 1 / 111111; 
  const mToLng = 1 / (111111 * Math.cos(lat * (Math.PI / 180)));

  const calculateFootprint = () => {
    const hw = widthX / 2; const hd = depthY / 2; const rad = rot * (Math.PI / 180);
    const corners = [{ x: -hw, y: -hd }, { x: hw, y: -hd }, { x: hw, y: hd }, { x: -hw, y: hd }];
    return corners.map(c => {
      const rotX = c.x * Math.cos(rad) - c.y * Math.sin(rad);
      const rotY = c.x * Math.sin(rad) + c.y * Math.cos(rad);
      return [ lat + (rotY * mToLat), lng + (rotX * mToLng) ];
    });
  };

  const calculateFrontIndicator = () => {
    const hd = depthY / 2; const rad = rot * (Math.PI / 180);
    const arrowWidth = Math.min(widthX * 0.2, 4); 
    const arrowHeight = Math.min(depthY * 0.15, 3); 
    const points = [{ x: -arrowWidth/2, y: hd }, { x: arrowWidth/2, y: hd }, { x: 0, y: hd + arrowHeight }];
    return points.map(c => {
      const rotX = c.x * Math.cos(rad) - c.y * Math.sin(rad);
      const rotY = c.x * Math.sin(rad) + c.y * Math.cos(rad);
      return [ lat + (rotY * mToLat), lng + (rotX * mToLng) ];
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if(!searchQuery) return;
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&accept-language=en&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if(data && data.length > 0) {
            const newLat = parseFloat(data[0].lat);
            const newLng = parseFloat(data[0].lon);
            setInputValue('siteCoords', serializeCoords(newLat, newLng, rot, boundary));
            setSearchQuery(''); 
            setMapAction('place'); // Auto-activate place mode after search
        } else {
            alert("Location not found. Try a broader search.");
        }
    } catch(err) { console.error(err); }
  };

  const handleNudge = (dLat, dLng) => {
      setInputValue('siteCoords', serializeCoords(lat + dLat, lng + dLng, rot, boundary));
  };

  const bgGlass = isDark ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)';
  const borderCol = isDark ? '#444' : '#ccc';
  const txtCol = isDark ? '#fff' : '#111';
  const dimCol = isDark ? '#aaa' : '#666';
  const activeCol = '#00d1b2';
  const activeBg = isDark ? 'rgba(0, 209, 178, 0.2)' : 'rgba(0, 209, 178, 0.1)';

  // 🪄 THE FIX: Left Panel is 280px + 60px Sidebar = 340px total. We use 350px for a tight 10px gap!
  const hudLeft = isLeftPanelOpen ? '300px' : '20px';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
      
      <MapContainer center={[lat, lng]} zoom={19} maxZoom={20} style={{ width: '100%', height: '100%', background: '#f0f0f0' }} zoomControl={false}>
        <MapController lat={lat} lng={lng} />
        <TileLayer maxZoom={20} attribution='&copy; OpenStreetMap' url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' />
        <MapEvents mapAction={mapAction} setMapAction={setMapAction} lat={lat} lng={lng} rot={rot} boundary={boundary} setInputValue={setInputValue} />
        
        <Polygon positions={calculateFootprint()} pathOptions={{ color: activeCol, fillColor: activeCol, fillOpacity: 0.5, weight: 2 }} />
        <Polygon positions={calculateFrontIndicator()} pathOptions={{ color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.9, weight: 1 }} />

        {boundary.length > 0 && mapAction === 'draw' && (
           <Polyline positions={boundary} pathOptions={{ color: '#ff9f43', weight: 3, dashArray: '5, 5' }} />
        )}
        {boundary.length > 2 && mapAction !== 'draw' && (
           <Polygon positions={boundary} pathOptions={{ color: '#ff9f43', fillColor: '#ff9f43', fillOpacity: 0.2, weight: 2 }} />
        )}
      </MapContainer>

      {/* 🪄 Top-Left Compact HUD with tighter spacing */}
      <div style={{
          position: 'absolute', top: '55px', left: hudLeft, zIndex: 1000,
          backgroundColor: bgGlass, backdropFilter: 'blur(10px)', padding: '10px', borderRadius: '10px',
          border: `1px solid ${borderCol}`, color: txtCol, display: 'flex', flexDirection: 'column', gap: '8px', 
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', width: '90vw', maxWidth: '300px', fontSize: '0.8rem',
          transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        
        {/* ROW 1: Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '4px' }}>
            <input 
               type="text" placeholder="Search address..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
               style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${borderCol}`, background: isDark ? 'rgba(0,0,0,0.5)' : '#fff', color: txtCol, outline: 'none' }}
            />
            <button type="submit" style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: activeCol, color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>🔍</button>
        </form>

        {/* ROW 2: Building Location & Nudge Tool */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '0.65rem', color: dimCol, textTransform: 'uppercase', fontWeight: 'bold' }}>Location</span>
                <span style={{ fontFamily: 'monospace', color: txtCol, fontSize: '0.75rem' }}>{lat.toFixed(5)}, {lng.toFixed(5)}</span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 16px)', gap: '2px', marginRight: '8px' }}>
                <div/>
                <button onClick={()=>handleNudge(0.00002, 0)} style={{ border: 'none', background: borderCol, color: txtCol, borderRadius: '2px', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }}>▲</button>
                <div/>
                <button onClick={()=>handleNudge(0, -0.00002)} style={{ border: 'none', background: borderCol, color: txtCol, borderRadius: '2px', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }}>◀</button>
                <button onClick={()=>handleNudge(-0.00002, 0)} style={{ border: 'none', background: borderCol, color: txtCol, borderRadius: '2px', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }}>▼</button>
                <button onClick={()=>handleNudge(0, 0.00002)} style={{ border: 'none', background: borderCol, color: txtCol, borderRadius: '2px', cursor: 'pointer', fontSize: '0.6rem', padding: 0 }}>▶</button>
            </div>

            <button 
                onClick={() => setMapAction(mapAction === 'place' ? 'idle' : 'place')}
                style={{ padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: `1px solid ${mapAction === 'place' ? activeCol : borderCol}`, background: mapAction === 'place' ? activeBg : 'transparent', color: mapAction === 'place' ? activeCol : txtCol }}
            >
                {mapAction === 'place' ? '💾 Save' : '📍 Place'}
            </button>
        </div>

        {/* ROW 3: Rotation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 6px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: dimCol, textTransform: 'uppercase' }}>Rotation</span>
            <input 
                type="range" min="0" max="360" step="1" value={rot} 
                onChange={(e) => setInputValue('siteCoords', serializeCoords(lat, lng, parseInt(e.target.value), boundary))}
                style={{ flex: 1, accentColor: activeCol, cursor: 'pointer' }}
            />
            <input 
                type="number" min="0" max="360" value={rot} 
                onChange={(e) => setInputValue('siteCoords', serializeCoords(lat, lng, parseInt(e.target.value), boundary))}
                style={{ width: '40px', padding: '2px', borderRadius: '4px', border: `1px solid ${borderCol}`, background: 'transparent', color: txtCol, textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem' }}
            />
        </div>

        {/* ROW 4: Boundary Tool */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px', background: isDark?'rgba(255,255,255,0.05)':'rgba(0,0,0,0.02)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '0.65rem', color: dimCol, textTransform: 'uppercase', fontWeight: 'bold' }}>Boundary</span>
                <span style={{ fontSize: '0.7rem', color: boundary.length > 0 ? '#ff9f43' : dimCol }}>
                    {boundary.length === 0 ? 'No boundary' : `${boundary.length} points`}
                </span>
            </div>
            
            <div style={{ display: 'flex', gap: '4px' }}>
                {boundary.length > 0 && mapAction !== 'draw' && (
                    <button 
                        onClick={() => setInputValue('siteCoords', serializeCoords(lat, lng, rot, []))}
                        style={{ padding: '6px', borderRadius: '6px', cursor: 'pointer', border: `1px solid ${borderCol}`, background: 'transparent', color: '#ff3366', fontSize: '0.7rem' }}
                    >✕ Clear</button>
                )}
                
                <button 
                    onClick={() => setMapAction(mapAction === 'draw' ? 'idle' : 'draw')}
                    style={{ padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', border: `1px solid ${mapAction === 'draw' ? '#ff9f43' : borderCol}`, background: mapAction === 'draw' ? 'rgba(255, 159, 67, 0.2)' : 'transparent', color: mapAction === 'draw' ? '#ff9f43' : txtCol }}
                >
                    {mapAction === 'draw' ? '✅ Save' : '✎ Draw'}
                </button>
            </div>
        </div>

        {/* Info Banner */}
        {mapAction !== 'idle' && (
            <div style={{ textAlign: 'center', padding: '6px', background: mapAction === 'draw' ? '#ff9f43' : activeCol, color: '#fff', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.75rem', animation: 'pulse 2s infinite' }}>
                {mapAction === 'place' ? 'Click map to place, then Save!' : 'Click map to add points, then Save!'}
            </div>
        )}

      </div>
    </div>
  );
}