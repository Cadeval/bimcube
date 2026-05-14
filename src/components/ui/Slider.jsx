import useStore from '../../core/store';

export default function Slider({ label, min, max, step, value, onChange }) {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
        <span>{label}</span>
      </div>
      
      {/* 🪄 NEW: Slider + Number Input Layout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input 
          type="range" min={min} max={max} step={step} value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          style={{ flex: 1, cursor: 'pointer', accentColor: isDark ? '#ffffff' : '#111111', height: '4px' }} 
        />
        <input 
          type="number" min={min} max={max} step={step} value={value} 
          onChange={(e) => onChange(Number(e.target.value))} 
          style={{ 
            width: '50px', padding: '2px 4px', borderRadius: '4px', 
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, 
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', 
            color: isDark ? '#ffffff' : '#111111', fontWeight: 'bold', 
            fontFamily: 'monospace', outline: 'none', fontSize: '0.75rem', textAlign: 'center' 
          }} 
        />
      </div>
    </div>
  );
}