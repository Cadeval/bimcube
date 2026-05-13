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
         // 🪄 Smoother, closer zoom!
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

  // 🪄 CALCULATE FRONT INDICATOR (Triangle pointing out from +Z edge)
  const calculateFrontIndicator = () => {
    const hd = depthY / 2;
    const rad = rotation * (Math.PI / 180);
    
    const arrowWidth = Math.min(widthX * 0.2, 4); 
    const arrowHeight = Math.min(depthY * 0.15, 3); 

    const points = [
      { x: -arrowWidth/2, y: hd }, // Base left
      { x: arrowWidth/2, y: hd },  // Base right
      { x: 0, y: hd + arrowHeight } // Tip pointing forward
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
      
      <div style={{
          position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          backgroundColor: isDark ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)', padding: '8px 12px', borderRadius: '8px',
          border: `1px solid ${isDark ? '#444' : '#ccc'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
              <input 
                 type="text" placeholder="Search city or address..." 
                 value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                 style={{ padding: '6px', borderRadius: '4px', border: `1px solid ${isDark ? '#444' : '#ccc'}`, background: isDark ? 'rgba(0,0,0,0.5)' : '#fff', color: isDark ? '#fff' : '#000', outline: 'none', width: '250px' }}
              />
              <button type="submit" style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#00d1b2', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                 🔍 Search
              </button>
          </form>
      </div>

      <MapContainer 
        center={[lat, lng]} 
        zoom={19} 
        maxZoom={20} // 🪄 MAX ZOOM INCREASED FOR PRECISION!
        style={{ width: '100%', height: '100%', background: '#f0f0f0' }}
        zoomControl={false}
      >
        <MapController lat={lat} lng={lng} />
        
        <TileLayer
          maxZoom={20}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        />
        
        <MapEvents rotation={rotation} setInputValue={setInputValue} />

        {/* Main Footprint */}
        <Polygon 
            positions={calculateFootprint()} 
            pathOptions={{ color: '#00d1b2', fillColor: '#00d1b2', fillOpacity: 0.5, weight: 2 }} 
        />

        {/* 🪄 Front Facing Triangle Indicator */}
        <Polygon 
            positions={calculateFrontIndicator()} 
            pathOptions={{ color: '#ff3366', fillColor: '#ff3366', fillOpacity: 0.9, weight: 1 }} 
        />
      </MapContainer>

      {/* ROTATION OVERLAY */}
      <div style={{
          position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          backgroundColor: isDark ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)', padding: '12px 24px', borderRadius: '8px',
          border: `1px solid ${isDark ? '#444' : '#ccc'}`, color: isDark ? '#fff' : '#000',
          display: 'flex', gap: '16px', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: isDark ? '#aaa' : '#666', textTransform: 'uppercase' }}>Latitude</span>
            <strong>{lat.toFixed(6)}</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.7rem', color: isDark ? '#aaa' : '#666', textTransform: 'uppercase' }}>Longitude</span>
            <strong>{lng.toFixed(6)}</strong>
        </div>
        <div style={{ width: '1px', height: '24px', background: isDark ? '#444' : '#ccc' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Rotation</span>
            <input 
                type="range" min="0" max="360" step="1" 
                value={rotation} 
                onChange={(e) => setInputValue('siteCoords', `${lat}, ${lng}, ${e.target.value}`)}
                style={{ width: '100px', accentColor: '#00d1b2', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.8rem', width: '30px' }}>{rotation}°</span>
        </div>
        <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: isDark ? '#888' : '#888', marginLeft: '8px' }}>
            (Click map to move)
        </div>
      </div>
    </div>
  );
}