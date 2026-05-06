import { useEffect } from 'react';
import useStore from '../../core/store';
import Slider from '../ui/Slider';
import ColorInput from '../ui/ColorInput';
import NumberInput from '../ui/NumberInput'; 

import floorplanManifest from '../../plugins/FloorplanGrid/manifest.json';
import { compute as floorplanCompute } from '../../plugins/FloorplanGrid/compute';

const toolRegistry = {
  [floorplanManifest.id]: { manifest: floorplanManifest, compute: floorplanCompute }
};

export default function MiddlePane() {
  const { activePluginId, pluginInputs, setInputValue, setPluginOutputs, clearActivePlugin, selectedObject, setSelectedObject } = useStore();
  const activeTool = toolRegistry[activePluginId];

  useEffect(() => {
    if (activeTool && pluginInputs[Object.keys(activeTool.manifest.inputs)[0]] !== undefined) {
      const result = activeTool.compute(pluginInputs);
      setPluginOutputs(result);
    }
  }, [pluginInputs, activeTool, setPluginOutputs]);

  if (!activeTool) return null;

  return (
    <div style={{ 
      width: '240px', 
      backgroundColor: 'rgba(24, 24, 24, 0.65)', 
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)', 
      padding: '1.2rem', display: 'flex', flexDirection: 'column', zIndex: 10, overflowY: 'auto' 
    }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255,255,255,0.8)' }}>{activeTool.manifest.name}</h3>
      </div>

      {Object.entries(activeTool.manifest.inputs).map(([key, config]) => {
        if (config.type === 'color') return <ColorInput key={key} label={config.label} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        if (config.type === 'number') return <NumberInput key={key} label={config.label} value={pluginInputs[key] ?? config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        return <Slider key={key} label={config.label} min={config.min} max={config.max} step={config.step} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
      })}

      {/* PROPERTIES PANEL - Clean White Styling */}
      {selectedObject && (
        <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255, 255, 255, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: selectedObject.color }}></span>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff' }}>{selectedObject.category}</h3>
            </div>
            <button onClick={() => setSelectedObject(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '1rem', padding: 0 }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Type:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.typeId}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Level:</span> <strong style={{ color: '#ffffff' }}>0{selectedObject.level}</strong></div>
            
            {selectedObject.category === 'Wall' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Nodes:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.p1Id} ➔ {selectedObject.p2Id}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Length:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.length.toFixed(2)} m</strong></div>
              </>
            ) : selectedObject.category === 'Slab' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Width:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.width.toFixed(2)} m</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Depth:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.depth.toFixed(2)} m</strong></div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Width:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.width.toFixed(2)} m</strong></div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Height:</span> <strong style={{ color: '#ffffff' }}>{selectedObject.height.toFixed(2)} m</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Thick/Depth:</span> <strong style={{ color: '#ffffff' }}>{((selectedObject.depth || selectedObject.thickness) * 1000).toFixed(0)} mm</strong></div>
          </div>
        </div>
      )}

    </div>
  );
}