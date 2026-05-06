import useStore from '../../core/store';

export default function Slider({ label, min, max, step, value, onChange }) {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
        <span>{label}</span>
        <span style={{ color: isDark ? '#ffffff' : '#111111', fontWeight: 'bold' }}>{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '100%', cursor: 'pointer', accentColor: isDark ? '#ffffff' : '#111111', height: '4px' }} 
      />
    </div>
  );
}