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
  const { activePluginId, pluginInputs, setInputValue, setPluginOutputs, clearActivePlugin, selectedObject, setSelectedObject, theme } = useStore();
  const activeTool = toolRegistry[activePluginId];
  const isDark = theme === 'dark';

  useEffect(() => {
    if (activeTool && pluginInputs[Object.keys(activeTool.manifest.inputs)[0]] !== undefined) {
      const result = activeTool.compute(pluginInputs);
      setPluginOutputs(result);
    }
  }, [pluginInputs, activeTool, setPluginOutputs]);

  if (!activeTool) return null;

  const txtCol = isDark ? '#ffffff' : '#111111';
  const dimCol = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)';
  const borderCol = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <div style={{ position: 'absolute', top: 0, left: '60px', bottom: 0, width: '240px', backgroundColor: isDark ? 'rgba(24, 24, 24, 0.65)' : 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRight: `1px solid ${borderCol}`, padding: '1.2rem', display: 'flex', flexDirection: 'column', zIndex: 40, overflowY: 'auto', boxShadow: isDark ? '4px 0 24px rgba(0,0,0,0.3)' : '4px 0 24px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: `1px solid ${borderCol}`, paddingBottom: '0.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>{activeTool.manifest.name}</h3>
      </div>

      {Object.entries(activeTool.manifest.inputs).map(([key, config]) => {
        if (config.type === 'color') return <ColorInput key={key} label={config.label} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        if (config.type === 'number') return <NumberInput key={key} label={config.label} value={pluginInputs[key] ?? config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        return <Slider key={key} label={config.label} min={config.min} max={config.max} step={config.step} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
      })}

      {selectedObject && (
        <div style={{ marginTop: '0.5rem', paddingTop: '1rem', borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: selectedObject.color }}></span>
              <h3 style={{ margin: 0, fontSize: '0.85rem', color: txtCol }}>{selectedObject.category}</h3>
            </div>
            <button onClick={() => setSelectedObject(null)} style={{ background: 'transparent', border: 'none', color: dimCol, cursor: 'pointer', fontSize: '1rem', padding: 0 }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Type:</span> <strong style={{ color: txtCol }}>{selectedObject.typeId}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Level:</span> <strong style={{ color: txtCol }}>0{selectedObject.level}</strong></div>
            
            {selectedObject.category === 'Wall' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Nodes:</span> <strong style={{ color: txtCol }}>{selectedObject.p1Id} ➔ {selectedObject.p2Id}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Length:</span> <strong style={{ color: txtCol }}>{selectedObject.length.toFixed(2)} m</strong></div>
              </>
            ) : selectedObject.category === 'Slab' ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Width:</span> <strong style={{ color: txtCol }}>{selectedObject.width.toFixed(2)} m</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Depth:</span> <strong style={{ color: txtCol }}>{selectedObject.depth.toFixed(2)} m</strong></div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Width:</span> <strong style={{ color: txtCol }}>{selectedObject.width.toFixed(2)} m</strong></div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Height:</span> <strong style={{ color: txtCol }}>{selectedObject.height.toFixed(2)} m</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: dimCol }}>Thick/Depth:</span> <strong style={{ color: txtCol }}>{((selectedObject.depth || selectedObject.thickness) * 1000).toFixed(0)} mm</strong></div>
            
            {/* 🪄 DISPLAY THE MATHEMATICAL TANGENT VECTOR! */}
            {selectedObject.dirX !== undefined && (
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: `1px solid ${borderCol}` }}>
                 <span style={{ color: dimCol }}>Vector (XZ):</span> 
                 <strong style={{ color: txtCol }}>[{selectedObject.dirX.toFixed(2)}, {selectedObject.dirZ.toFixed(2)}]</strong>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}