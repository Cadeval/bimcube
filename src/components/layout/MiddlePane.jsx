import { useEffect } from 'react';
import useStore from '../../core/store';
import Slider from '../ui/Slider';
import ColorInput from '../ui/ColorInput';
import NumberInput from '../ui/NumberInput'; 

// Only import the Floorplan tool logic!
import floorplanManifest from '../../plugins/FloorplanGrid/manifest.json';
import { compute as floorplanCompute } from '../../plugins/FloorplanGrid/compute';

const toolRegistry = {
  [floorplanManifest.id]: { manifest: floorplanManifest, compute: floorplanCompute }
};

export default function MiddlePane() {
  const { activePluginId, pluginInputs, setInputValue, setPluginOutputs, clearActivePlugin } = useStore();
  const activeTool = toolRegistry[activePluginId];

  useEffect(() => {
    if (activeTool && pluginInputs[Object.keys(activeTool.manifest.inputs)[0]] !== undefined) {
      const result = activeTool.compute(pluginInputs);
      setPluginOutputs(result);
    }
  }, [pluginInputs, activeTool, setPluginOutputs]);

  if (!activeTool) return null;

  return (
    <div style={{ width: '280px', backgroundColor: '#202020', borderRight: '1px solid #2a2a2a', padding: '1.5rem', display: 'flex', flexDirection: 'column', zIndex: 10, overflowY: 'auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>{activeTool.manifest.name}</h3>
        <button onClick={clearActivePlugin} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {Object.entries(activeTool.manifest.inputs).map(([key, config]) => {
        if (config.type === 'color') {
          return <ColorInput key={key} label={config.label} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        }
        if (config.type === 'number') { 
          return <NumberInput key={key} label={config.label} value={pluginInputs[key] ?? config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
        }
        return <Slider key={key} label={config.label} min={config.min} max={config.max} step={config.step} value={pluginInputs[key] || config.defaultValue} onChange={(val) => setInputValue(key, val)} />;
      })}
    </div>
  );
}