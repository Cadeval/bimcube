export default function ColorInput({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: '#ccc' }}>{label}</span>
      <input 
        type="color" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ cursor: 'pointer', border: 'none', width: '32px', height: '32px', padding: 0, borderRadius: '4px', backgroundColor: 'transparent' }} 
      />
    </div>
  );
}