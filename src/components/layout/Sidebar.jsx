import useStore from '../../core/store';

export default function Sidebar() {
  const { activeTab, setActiveTab, theme, isLeftPanelOpen, toggleLeftPanel } = useStore();
  const isDark = theme === 'dark';

  const icons = [
    { id: 'inputs', icon: '🏢', title: 'Floorplan Grid' },
    { id: 'layers', icon: '👁️', title: 'Layers & Visibility' },
    { id: 'section', icon: '✂️', title: 'Sectioning' },
    { id: 'view', icon: '🎥', title: 'View Controls' },
    { id: 'log', icon: '📝', title: 'Log File' },
    { id: 'output', icon: '📤', title: 'Outputs' },
  ];

  return (
    <div style={{
      width: '60px', height: '100%', zIndex: 50, position: 'relative',
      backgroundColor: isDark ? 'rgba(24, 24, 24, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(12px)', borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      paddingTop: '12px' 
    }}>
      
      {/* 🪄 GENIUS DETAIL: Logo is now a master toggle button with hover effects! */}
      <button 
        onClick={toggleLeftPanel}
        title={isLeftPanelOpen ? "Close Panel" : "Open Panel"}
        style={{ 
          height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '900', fontSize: '1.2rem', marginBottom: '16px', letterSpacing: '-1px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: isDark ? '#ffffff' : '#111111', // White in Dark Mode, Black in Light Mode!
          transition: 'color 0.2s, transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        BC
      </button>
      
      {icons.map(item => {
        const isActive = activeTab === item.id && isLeftPanelOpen; 
        
        return (
          <button 
            key={item.id} title={item.title} 
            onClick={() => {
              if (activeTab === item.id && isLeftPanelOpen) {
                toggleLeftPanel();
              } else {
                setActiveTab(item.id);
              }
            }}
            style={{
              width: '44px', height: '44px', marginBottom: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1.2rem', transition: 'all 0.2s',
              backgroundColor: isActive ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)') : 'transparent',
              boxShadow: isActive ? `inset 3px 0 0 0 ${isDark ? '#fff' : '#111'}` : 'none'
            }}
          >
            {item.icon}
          </button>
        )
      })}
    </div>
  );
}