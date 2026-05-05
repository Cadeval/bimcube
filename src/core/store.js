import { create } from 'zustand';

const useStore = create((set) => ({
  activePluginId: null,
  pluginInputs: {},   
  pluginOutputs: {},  
  theme: 'dark', 
  
  // --- MULTI-DIMENSIONAL VISIBILITY MATRIX ---
  visibility: {
    levels: { 0: true, 1: true, 2: true, 3: true },
    types: {
      Grid: true, WE01: true, WE02: true, WI01: true, WI02: true, WI03: true, SL01: true, SL02: true
    }
  },

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
  setPluginOutputs: (data) => set(() => ({ pluginOutputs: data })),
  clearActivePlugin: () => set(() => ({ activePluginId: null }))
}));

export default useStore;