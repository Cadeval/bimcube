import { useEffect } from 'react';
import useStore from '../../core/store';
import floorplanManifest from '../../plugins/FloorplanGrid/manifest.json';

const tools = [floorplanManifest];

export default function LeftPane() {
  const { activePluginId, setActivePlugin, clearActivePlugin, theme } = useStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!activePluginId) setActivePlugin(floorplanManifest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ 
      position: 'absolute', top: 0, left: 0, bottom: 0, 
      width: '60px', 
      backgroundColor: isDark ? 'rgba(24, 24, 24, 0.65)' : 'rgba(255, 255, 255, 0.75)', 
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', 
      borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)'}`, 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      padding: '1.5rem 0', zIndex: 50 
    }}>
      <div style={{ color: isDark ? '#fff' : '#111', fontWeight: '900', fontSize: '1.2rem', marginBottom: '2rem', textShadow: isDark ? '0 2px 4px rgba(0,0,0,0.5)' : 'none' }}>BC</div>

      {tools.map((manifest) => {
        const isActive = activePluginId === manifest.id;
        return (
          <button 
            key={manifest.id}
            onClick={() => isActive ? clearActivePlugin() : setActivePlugin(manifest)}
            title={manifest.name}
            style={{ 
              width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', marginBottom: '10px',
              backgroundColor: isActive ? (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') : 'transparent',
              color: isActive ? (isDark ? '#ffffff' : '#111111') : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'),
              boxShadow: isActive ? `inset 2px 0 0 0 ${isDark ? '#ffffff' : '#111111'}` : 'none'
            }}
          >
            🏢
          </button>
        )
      })}
    </div>
  );
}