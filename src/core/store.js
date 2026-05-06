import { create } from 'zustand';

const useStore = create((set) => ({
  activePluginId: null,
  pluginInputs: {},   
  pluginOutputs: {},  
  theme: 'dark', 
  
  visibility: {
    levels: {},
    types: {}
  },

  selectedObject: null,
  setSelectedObject: (objData) => set(() => ({ selectedObject: objData })),

  // 🪄 NEW: LIVE GPU SECTIONING STATE
  clipping: { enabled: false, axis: 'y', distance: 1.5 }, // 1.5m is a standard architectural floorplan cut height
  setClipping: (updates) => set((state) => ({ clipping: { ...state.clipping, ...updates } })),

  toggleLevel: (levelStr) => set((state) => ({
    visibility: { ...state.visibility, levels: { ...state.visibility.levels, [levelStr]: !state.visibility.levels[levelStr] } }
  })),

  toggleType: (typeStr) => set((state) => ({
    visibility: { ...state.visibility, types: { ...state.visibility.types, [typeStr]: !state.visibility.types[typeStr] } }
  })),

  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  
  setActivePlugin: (manifest) => set((state) => {
    const updatedInputs = { ...state.pluginInputs };
    for (const [key, config] of Object.entries(manifest.inputs)) {
      if (updatedInputs[key] === undefined) updatedInputs[key] = config.defaultValue;
    }
    return { activePluginId: manifest.id, pluginInputs: updatedInputs };
  }),

  setInputValue: (key, value) => set((state) => ({ pluginInputs: { ...state.pluginInputs, [key]: value } })),
  
  setPluginOutputs: (data) => set((state) => {
    const newLevels = { ...state.visibility.levels };
    const newTypes = { ...state.visibility.types };

    if (data.meta) {
       data.meta.levels.forEach(lvl => { if (newLevels[lvl] === undefined) newLevels[lvl] = true; });
       data.meta.types.forEach(type => { if (newTypes[type] === undefined) newTypes[type] = type === 'Grid' ? false : true; });
    }

    return { pluginOutputs: data, visibility: { levels: newLevels, types: newTypes }, selectedObject: null };
  }),
  
  clearActivePlugin: () => set(() => ({ activePluginId: null, selectedObject: null }))
}));

export default useStore;