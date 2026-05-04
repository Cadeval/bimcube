import useStore from '../../core/store';
import gridManifest from '../../plugins/GridGenerator/manifest.json';

export default function LeftPane() {
  const { activePluginId, setActivePlugin, clearActivePlugin } = useStore();

  const isGridActive = activePluginId === gridManifest.id;

  const toggleTool = () => {
    if (isGridActive) clearActivePlugin();
    else setActivePlugin(gridManifest);
  };

  return (
    <div style={{ width: '60px', backgroundColor: '#181818', borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.5rem 0', zIndex: 20 }}>
      
      {/* App Logo Placeholder */}
      <div style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', marginBottom: '2rem' }}>BC</div>

      {/* Grid Generator Tool Icon */}
      <button 
        onClick={toggleTool}
        title={gridManifest.name}
        style={{ 
          width: '44px', height: '44px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: 'all 0.2s',
          backgroundColor: isGridActive ? '#2a2a2a' : 'transparent',
          color: isGridActive ? '#4af626' : '#666',
          boxShadow: isGridActive ? 'inset 2px 0 0 0 #4af626' : 'none'
        }}
      >
        🎛️
      </button>
      
    </div>
  );
}