export default function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>
        <span>{label}</span>
        <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{value}</span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '100%', cursor: 'pointer', accentColor: '#ffffff', height: '4px' }} 
      />
    </div>
  );
}