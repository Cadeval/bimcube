import { useEffect } from 'react';
import useStore from '../../core/store';
import Slider from '../ui/Slider';
import gridManifest from '../../plugins/GridGenerator/manifest.json';
import { compute as gridCompute } from '../../plugins/GridGenerator/compute';

export default function MiddlePane() {
  const { activePluginId, pluginInputs, setInputValue, setPluginOutputs, clearActivePlugin } = useStore();

  useEffect(() => {
    if (activePluginId === 'grid-generator') {
      const result = gridCompute(pluginInputs);
      setPluginOutputs(result);
    }
  }, [pluginInputs, activePluginId, setPluginOutputs]);

  // THE MAGIC: If no tool is active, completely collapse this pane!
  if (!activePluginId) return null;

  return (
    <div style={{ width: '280px', backgroundColor: '#202020', borderRight: '1px solid #2a2a2a', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888' }}>
          {gridManifest.name}
        </h3>
        <button onClick={clearActivePlugin} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
      </div>

      {Object.entries(gridManifest.inputs).map(([key, config]) => (
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