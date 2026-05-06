import useStore from '../../core/store';

export default function NumberInput({ label, value, onChange }) {
  const { theme } = useStore();
  const isDark = theme === 'dark';

  return (
    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{label}</span>
      <input 
        type="number" step="0.01" value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '60px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`, backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)', color: isDark ? '#ffffff' : '#111111', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none', fontSize: '0.8rem' }} 
      />
    </div>
  );
}