import { useEffect } from 'react';
import useStore from '../../core/store';
import floorplanManifest from '../../plugins/FloorplanGrid/manifest.json';

const tools = [floorplanManifest];

export default function LeftPane() {
  const { activePluginId, setActivePlugin, clearActivePlugin } = useStore();

  useEffect(() => {
    if (!activePluginId) setActivePlugin(floorplanManifest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ 
      width: '60px', 
      backgroundColor: 'rgba(24, 24, 24, 0.65)', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)', 
      borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      padding: '1.5rem 0', zIndex: 20 
    }}>
      
      <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', marginBottom: '2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>BC</div>

      {tools.map((manifest) => {
        const isActive = activePluginId === manifest.id;
        const icon = '🏢';

        return (
          <button 
            key={manifest.id}
            onClick={() => isActive ? clearActivePlugin() : setActivePlugin(manifest)}
            title={manifest.name}
            style={{ 
              width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', marginBottom: '10px',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.4)',
              boxShadow: isActive ? 'inset 2px 0 0 0 #ffffff' : 'none'
            }}
          >
            {icon}
          </button>
        )
      })}
    </div>
  );
}