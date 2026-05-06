import { create } from 'zustand';

const useStore = create((set) => ({
  activePluginId: null,
  pluginInputs: {},   
  pluginOutputs: {},  
  theme: 'dark', 
  
  // 🪄 Now completely dynamic! Starts empty.
  visibility: {
    levels: {},
    types: {}
  },

  selectedObject: null,
  setSelectedObject: (objData) => set(() => ({ selectedObject: objData })),

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
    // 🪄 AUTO-DISCOVERY: Find all new layers and levels from the JSON!
    const newLevels = { ...state.visibility.levels };
    const newTypes = { ...state.visibility.types };

    if (data.meta) {
       data.meta.levels.forEach(lvl => {
         if (newLevels[lvl] === undefined) newLevels[lvl] = true;
       });
       data.meta.types.forEach(type => {
         if (newTypes[type] === undefined) {
             // Default 'Grid' to false, everything else to true
             newTypes[type] = type === 'Grid' ? false : true;
         }
       });
    }

    return { 
      pluginOutputs: data,
      visibility: { levels: newLevels, types: newTypes },
      selectedObject: null 
    };
  }),
  
  clearActivePlugin: () => set(() => ({ activePluginId: null, selectedObject: null }))
}));

export default useStore;