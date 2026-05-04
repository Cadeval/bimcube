import { useEffect } from 'react';
import useStore from '../../core/store';
import Slider from '../ui/Slider';

// 1. Import all plugins
import gridManifest from '../../plugins/GridGenerator/manifest.json';
import { compute as gridCompute } from '../../plugins/GridGenerator/compute';

import boxManifest from '../../plugins/BoxGenerator/manifest.json';
import { compute as boxCompute } from '../../plugins/BoxGenerator/compute';

// 2. Create the "Router" to connect an ID to its Math/Manifest
const toolRegistry = {
  [gridManifest.id]: { manifest: gridManifest, compute: gridCompute },
  [boxManifest.id]: { manifest: boxManifest, compute: boxCompute }
};

export default function MiddlePane() {
  const { activePluginId, pluginInputs, setInputValue, setPluginOutputs, clearActivePlugin } = useStore();

  // 3. Look up the currently active tool
  const activeTool = toolRegistry[activePluginId];

  // The Reactive Engine
  useEffect(() => {
    // Make sure we have an active tool, AND that the inputs match the current tool's manifest before running the math
    if (activeTool && pluginInputs[Object.keys(activeTool.manifest.inputs)[0]] !== undefined) {
      const result = activeTool.compute(pluginInputs);
      setPluginOutputs(result);
    }
  }, [pluginInputs, activeTool, setPluginOutputs]);

  // Collapse if no tool is selected
  if (!activeTool) return null;

  return (
    <div style={{ width: '280px', backgroundColor: '#202020', borderRight: '1px solid #2a2a2a', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
          {activeTool.manifest.name}
        </h3>
        <button onClick={clearActivePlugin} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {/* Auto-generate sliders based on WHICH tool is active */}
      {Object.entries(activeTool.manifest.inputs).map(([key, config]) => (
        <Slider
          key={key}
          label={config.label}
          min={config.min}
          max={config.max}
          step={config.step}
          value={pluginInputs[key] || config.defaultValue}
          onChange={(val) => setInputValue(key, val)}
        />
      ))}
    </div>
  );
}