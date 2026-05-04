export default function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#ccc' }}>
        <span>{label}</span>
        <span style={{ color: '#4af626', fontWeight: 'bold' }}>{value}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '100%', cursor: 'pointer', accentColor: '#4af626' }} 
      />
    </div>
  );
}