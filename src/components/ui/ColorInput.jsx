import useStore from '../../core/store';

export default function ColorInput({ label, value, onChange }) {
  const { theme } = useStore();
  return (
    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.75rem', color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>{label}</span>
      <input 
        type="color" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ cursor: 'pointer', border: 'none', width: '32px', height: '32px', padding: 0, borderRadius: '4px', backgroundColor: 'transparent' }} 
      />
    </div>
  );
}