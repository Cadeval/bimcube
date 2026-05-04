import useStore from '../../core/store';

// 1. Import your tool contracts
import gridManifest from '../../plugins/GridGenerator/manifest.json';
import boxManifest from '../../plugins/BoxGenerator/manifest.json';

// 2. The Tool Registry Array
const tools = [gridManifest, boxManifest];

export default function LeftPane() {
  const { activePluginId, setActivePlugin, clearActivePlugin } = useStore();

  return (
    <div style={{ width: '60px', backgroundColor: '#181818', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', zIndex: 20 }}>
      
      <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', marginBottom: '2rem' }}>BC</div>

      {/* 3. Loop through the tools and auto-generate the buttons! */}
      {tools.map((manifest, index) => {
        const isActive = activePluginId === manifest.id;
        
        // Let's fake some different icons based on the index for now
        const icon = index === 0 ? '🎛️' : '📦'; 

        return (
          <button 
            key={manifest.id}
            onClick={() => isActive ? clearActivePlugin() : setActivePlugin(manifest)}
            title={manifest.name}
            style={{ 
              width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s', marginBottom: '10px',
              backgroundColor: isActive ? '#2a2a2a' : 'transparent',
              color: isActive ? '#4af626' : '#666',
              boxShadow: isActive ? 'inset 2px 0 0 0 #4af626' : 'none'
            }}
          >
            {icon}
          </button>
        )
      })}
    </div>
  );
}