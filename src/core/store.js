import { create } from 'zustand';

const getTime = () => new Date().toLocaleTimeString([], { hour12: false });

const useStore = create((set) => ({
  // UI Layout State
  activeTab: 'inputs', 
  isLeftPanelOpen: true,
  mainViewMode: '3D', 
  
  active2DView: 'Floorplan-0', 
  setActive2DView: (view) => set({ active2DView: view }),
  
  cameraViewTrigger: null,
  setCameraView: (view) => set({ cameraViewTrigger: { view, id: Math.random() } }),

  exportTrigger: null,
  triggerExport: (format) => set({ exportTrigger: { format, id: Math.random() } }),
  
  setActiveTab: (tab) => set({ activeTab: tab, isLeftPanelOpen: true, selectedObject: null }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  setMainViewMode: (mode) => set({ mainViewMode: mode }),

  // Plugin & Generation State
  activePluginId: null,
  pluginInputs: {},   
  pluginOutputs: {},  
  theme: 'light', 

  pastInputs: [],
  futureInputs: [],
  log: [`[${getTime()}] System initialized.`],

  undo: () => set((state) => {
    if (state.pastInputs.length === 0) return state;
    const previous = state.pastInputs[state.pastInputs.length - 1];
    const newPast = state.pastInputs.slice(0, -1);
    return {
      pastInputs: newPast,
      futureInputs: [state.pluginInputs, ...state.futureInputs],
      pluginInputs: previous,
      log: [`[${getTime()}] UNDO triggered.`, ...state.log].slice(0, 100)
    };
  }),

  redo: () => set((state) => {
    if (state.futureInputs.length === 0) return state;
    const next = state.futureInputs[0];
    const newFuture = state.futureInputs.slice(1);
    return {
      pastInputs: [...state.pastInputs, state.pluginInputs],
      futureInputs: newFuture,
      pluginInputs: next,
      log: [`[${getTime()}] REDO triggered.`, ...state.log].slice(0, 100)
    };
  }),

  loadSession: (loadedInputs) => set((state) => {
    return {
      pastInputs: [...state.pastInputs, state.pluginInputs].slice(-50), 
      futureInputs: [],
      pluginInputs: { ...state.pluginInputs, ...loadedInputs },
      log: [`[${getTime()}] Session loaded from file.`, ...state.log].slice(0, 100)
    };
  }),
  
  visibility: { levels: {}, types: {} },
  selectedObject: null,
  setSelectedObject: (objData) => set({ selectedObject: objData, isLeftPanelOpen: true }),

  clipping: { enabled: false, axis: 'y', distance: 1.5 },
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
    // 🪄 ALWAYS ENSURE SITE VARIABLES EXIST
    if (updatedInputs.siteLat === undefined) updatedInputs.siteLat = 48.225023;
    if (updatedInputs.siteLng === undefined) updatedInputs.siteLng = 16.330946;
    if (updatedInputs.siteRotation === undefined) updatedInputs.siteRotation = 0;

    return { 
      activePluginId: manifest.id, 
      pluginInputs: updatedInputs,
      pastInputs: [], futureInputs: [], 
      log: [`[${getTime()}] Loaded ${manifest.name}.`, ...state.log].slice(0, 100)
    };
  }),

  setInputValue: (key, value) => set((state) => {
    let safeValue = value;
    if (typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))) {
        safeValue = Number(value);
    }
    if (state.pluginInputs[key] === safeValue) return state; 
    
    const newPast = [...state.pastInputs, state.pluginInputs].slice(-50); 
    const newLog = [`[${getTime()}] Changed ${key} to ${safeValue}`, ...state.log].slice(0, 100);

    return { 
      pastInputs: newPast,
      futureInputs: [], 
      pluginInputs: { ...state.pluginInputs, [key]: safeValue },
      log: newLog
    };
  }),
  
  setPluginOutputs: (data) => set((state) => {
    const newLevels = { ...state.visibility.levels };
    const newTypes = { ...state.visibility.types };

    if (data.meta) {
       data.meta.levels.forEach(lvl => { if (newLevels[lvl] === undefined) newLevels[lvl] = true; });
       data.meta.types.forEach(type => { if (newTypes[type] === undefined) newTypes[type] = type === 'Grid' ? false : true; });
    }

    return { pluginOutputs: data, visibility: { levels: newLevels, types: newTypes } };
  }),
  
  clearActivePlugin: () => set({ activePluginId: null, selectedObject: null })
}));

export default useStore;