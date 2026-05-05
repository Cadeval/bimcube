export default function NumberInput({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{label}</span>
      <input 
        type="number" 
        step="0.01"
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))} 
        style={{ width: '80px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#111', color: '#4af626', fontWeight: 'bold', fontFamily: 'monospace', outline: 'none' }} 
      />
    </div>
  );
}