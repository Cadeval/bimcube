import { useEffect } from 'react';
import useStore from './core/store';

import floorplanManifest from './plugins/FloorplanGrid/manifest.json';
import { compute as floorplanCompute } from './plugins/FloorplanGrid/compute';

import Sidebar from './components/layout/Sidebar';
import LeftPanel from './components/layout/LeftPanel';
import MainArea from './components/layout/MainArea';

const toolRegistry = {
  [floorplanManifest.id]: { manifest: floorplanManifest, compute: floorplanCompute }
};

function App() {
  const { activePluginId, pluginInputs, setActivePlugin, setPluginOutputs, theme } = useStore();

  useEffect(() => {
    if (!activePluginId) {
      setActivePlugin(floorplanManifest);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🪄 THE ENGINE LOOP (With Error Catching)
  useEffect(() => {
    const activeTool = toolRegistry[activePluginId];
    
    if (activeTool && pluginInputs && Object.keys(pluginInputs).length > 0) {
      const firstInputKey = Object.keys(activeTool.manifest.inputs)[0];
      
      if (pluginInputs[firstInputKey] !== undefined) {
         try {
             // Tell the Chef to cook!
             const result = activeTool.compute(pluginInputs);
             setPluginOutputs(result);
         } catch (error) {
             console.error("🚨 Math Engine Crashed:", error);
         }
      }
    }
  }, [activePluginId, pluginInputs, setPluginOutputs]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: theme === 'dark' ? '#121212' : '#f5f5f5', 
      color: theme === 'dark' ? '#e0e0e0' : '#111111', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
      display: 'flex'
    }}>
      <Sidebar />
      <LeftPanel />
      <MainArea />
    </div>
  );
}

export default App;