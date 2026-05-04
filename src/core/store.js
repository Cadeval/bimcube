import { create } from 'zustand';

const useStore = create((set) => ({
  // --- 1. Current Active Context ---
  activePluginId: null,
  
  // --- 2. The Data Bus ---
  pluginInputs: {},   
  pluginOutputs: {},  
  
  // --- 3. Actions (Mutators) ---
  
  setActivePlugin: (manifest) => set((state) => {
    // Make a copy of our current inputs
    const updatedInputs = { ...state.pluginInputs };
    
    // Smart Initialization: Only apply defaults if the user hasn't set a value yet!
    for (const [key, config] of Object.entries(manifest.inputs)) {
      if (updatedInputs[key] === undefined) {
        updatedInputs[key] = config.defaultValue;
      }
    }

    return {
      activePluginId: manifest.id,
      pluginInputs: updatedInputs
      // Note: We are NO LONGER resetting pluginOutputs to {} here!
    };
  }),

  setInputValue: (key, value) => set((state) => ({
    pluginInputs: {
      ...state.pluginInputs,
      [key]: value
    }
  })),

  setPluginOutputs: (data) => set(() => ({
    pluginOutputs: data
  })),

  // Just hide the UI, don't destroy the data!
  clearActivePlugin: () => set(() => ({
    activePluginId: null
    // Note: We are NO LONGER resetting pluginOutputs to {} here either!
  }))
}));

export default useStore;