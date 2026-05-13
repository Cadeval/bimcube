import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import useStore from '../../core/store';

const parseCoords = (str) => {
  if (!str) return [48.225023, 16.330946, 0];
  const parts = str.split(',').map(n => parseFloat(n.trim()));
  return [
      isNaN(parts[0]) ? 48.225023 : parts[0],
      isNaN(parts[1]) ? 16.330946 : parts[1],
      isNaN(parts[2]) ? 0 : parts[2],
  ];
};

const MapEvents = ({ rotation, setInputValue }) => {
  useMapEvents({
    click(e) {
      setInputValue('siteCoords', `${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)}, ${rotation}`);
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
  const { pluginInputs, setInputValue, pluginOutputs, theme } = useStore();
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');

  const [lat, lng, rotation] = parseCoords(pluginInputs.siteCoords);

  const widthX = pluginOutputs?.dimensions?.widthX || 22;
  const depthY = pluginOutputs?.dimensions?.depthY || 16;

  const mToLat = 1 / 111111; 
  const mToLng = 1 / (111111 * Math.cos(lat * (Math.PI / 180)));

  const calculateFootprint = () => {
    const hw = widthX / 2;
    const hd = depthY / 2;
    const rad = rotation * (Math.PI / 180);

    const corners = [
      { x: -hw, y: -hd },
      { x: hw, y: -hd },
      { x: hw, y: hd },
      { x: -hw, y: hd }
    ];

    return corners.map(c => {
      const rotX = c.x * Math.cos(rad) - c.y * Math.sin(rad);
      const rotY = c.x * Math.sin(rad) + c.y * Math.cos(rad);
      return [ lat + (rotY * mToLat), lng + (rotX * mToLng) ];
    });
  };

  const calculateFrontIndicator = () => {
    const hd = depthY / 2;
    const rad = rotation * (Math.PI / 180);
    
    const arrowWidth = Math.min(widthX * 0.2, 4); 
    const arrowHeight = Math.min(depthY * 0.15, 3); 

    const points = [
      { x: -arrowWidth/2, y: hd }, 
      { x: arrowWidth/2, y: hd },  
      { x: 0, y: hd + arrowHeight } 
    ];

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
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if(data && data.length > 0) {
            const newLat = parseFloat(data[0].lat);
            const newLng = parseFloat(data[0].lon);
            setInputValue('siteCoords', `${newLat.toFixed(6)}, ${newLng.toFixed(6)}, ${rotation}`);
            setSearchQuery(''); 
        } else {
            alert("Location not found. Try a broader search.");
        }
    } catch(err) { console.error(err); }
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}>
      
      {/* 🪄 MOBILE OPTIMIZED SEARCH BAR: Dropped to 75px to clear dropdowns */}
      <div style={{
          position: 'absolute', top: '75px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          backgroundColor: isDark ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)', padding: '6px', borderRadius: '8px',
          border: `1px solid ${isDark ? '#444' : '#ccc'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
          width: 'max-content', maxWidth: '90vw'
      }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '6px' }}>
              <input 
                 type="text" placeholder="Search address..." 
                 value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ padding: '6px 8px', borderRadius: '4px', border: `1px solid ${isDark ? '#444' : '#ccc'}`, background: isDark ? 'rgba(0,0,0,0.5)' : '#fff', color: isDark ? '#fff' : '#000', outline: 'none', width: '160px', fontSize: '0.8rem' }}
              />
              <button type="submit" style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', background: '#00d1b2', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                 🔍
              </button>
          </form>
      </div>

      <MapContainer center={[lat, lng]} zoom={19} maxZoom={20} style={{ width: '100%', height: '100%', background: '#f0f0f0' }} zoomControl={false}>
        <MapController lat={lat} lng={lng} />
        <TileLayer maxZoom={20} attribution='&copy; OpenStreetMap' url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' />
        <MapEvents rotation={rotation} setInputValue={setInputValue} />
        <Polygon positions={calculateFootprint()} pathOptions={{ color: '#00d1b2', fillColor: '#00d1b2', fillOpacity: 0.5, weight: 2 }} />
        <Polygon positions={calculateFrontIndicator()} pathOptions={{ color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.9, weight: 1 }} />
      </MapContainer>

      {/* 🪄 MOBILE OPTIMIZED CONTROL PANEL: Stacked layout! */}
      <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          backgroundColor: isDark ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)', padding: '12px 16px', borderRadius: '8px',
          border: `1px solid ${isDark ? '#444' : '#ccc'}`, color: isDark ? '#fff' : '#000',
          display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', 
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', width: 'max-content', maxWidth: '90vw'
      }}>
        
        <div style={{ color: '#00d1b2', fontWeight: '900', fontSize: '0.85rem', textAlign: 'center', marginBottom: '4px' }}>
          📍 Click on Map to place Building
        </div>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: isDark ? '#aaa' : '#666', textTransform: 'uppercase' }}>Latitude</span>
              <strong style={{ fontSize: '0.85rem' }}>{lat.toFixed(6)}</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: isDark ? '#aaa' : '#666', textTransform: 'uppercase' }}>Longitude</span>
              <strong style={{ fontSize: '0.85rem' }}>{lng.toFixed(6)}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Rotate</span>
            <input 
                type="range" min="0" max="360" step="1" 
                value={rotation} 
                onChange={(e) => setInputValue('siteCoords', `${lat}, ${lng}, ${e.target.value}`)}
                style={{ width: '120px', accentColor: '#00d1b2', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.75rem', width: '32px', textAlign: 'right' }}>{rotation}°</span>
        </div>
      </div>
    </div>
  );
}