🧊 BimCubeBimCube is an ultra-lightweight, browser-native, and modular parametric CAD/BIM platform. 
It enables real-time architectural design generation, 2D plan sectioning, quantitative takeaways, and GIS site anchoring directly within the browser.  
The platform is designed around DfMA (Design for Manufacture and Assembly) and OpenBIM principles, operating as a data-first architectural engine where 3D layouts react completely to a parametric JSON core.🏛️ 

Architectural OverviewBimCube relies on a strictly decoupled console-and-cartridge pipeline:        ┌───────────────────────────────────────────────────────────┐
  │                   UI & SHELL (The Console)                │
  │     React  ◄───►  Zustand Global Store  ◄───►  Three.js   │
  └─────────────────────────────▲─────────────────────────────┘
                                │ (Pure Parameter JSON)
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                MATHEMATICS ENGINE (The Cartridge)         │
  │             Isolated Functional Geometry Plugins          │
  └───────────────────────────────────────────────────────────┘

The Shell (React & Zustand): 
Handles layout state, visibility toggles, session history orchestration (Undo/Redo), and active toolbar configurations.  

The Graphics Engine (Three.js): Acts as an isolated renderer. It listens to the global store pipeline and compiles geometry meshes, orthographic sectioning planes, and UI labels on the fly.  

The Math Core (Plugins): Pure, state-free JavaScript modules. They absorb parameters from UI sliders and calculate trigonometric grid distributions, window punch-out offsets, and net internal area boundary computations.  

🚀 Core Features
🧊 1. Real-Time 3D ViewportProcedural assembly of slabs, load-bearing timber frame nodes, concrete core structural boundaries, and customized window openings.  Raycasting mesh selection linked to an inspectable BIM parameter property sub-panel.  Dynamic viewport camera orientation snapping (Top, Iso, Front).  

📐 2. Orthographic 2D Plan & SectioningGimbal-lock corrected $2D$ layout renderer configured for auto-fitted level analysis.  Grid-aware section clipping tracking customizable horizontal and vertical cutting planes ($X$, $Y$, $Z$) with adaptive geometry fills.  

🗺️ 3. GIS Map HUD & Context AnchoringEmbedded Leaflet instance mapping building footprint footprints to real-world coordinates.  Heads-Up Display (HUD) including continuous layout positioning tracking, input rotation controls, an algebraic micro-nudge D-Pad tool, and polygon site boundary drawings.  Reverse trigonometric calculation converting GPS coordinates back into local $3D$ space.  

📊 4. Automated Net Usable Area & QTO DashboardsMathematical separation of Gross Floor Area (Grid-to-Grid) from Net Usable Area (Inner Wall-to-Wall) using edge-overlap neighborhood recognition.  Live Quantity Takeoff (QTO) compiler calculating automated element tracking counts, cumulative length summaries ($m$), face calculations ($m^2$), and volume summaries ($m^3$).  

🛠️ Repository File TreePlaintextbimcube/
├── index.html                 # Main document root & translation overrides
├── vite.config.js             # Asset building configurations
├── package.json               # Package manifests and dependency declarations
└── src/
    ├── main.jsx               # React DOM rendering root
    ├── App.jsx                # Global lifecycle runner & main error layout loop
    ├── core/
    │   └── store.js           # Zustand store governing state timeline history (Undo/Redo)
    ├── components/
    │   ├── layout/
    │   │   ├── MainArea.jsx   # Top drop-down interface router & QTO generation layout
    │   │   ├── Sidebar.jsx    # Scroll-protected icon tab launcher sidebar
    │   │   ├── LeftPanel.jsx  # Parametric property sliders & toggle visibility lists
    │   │   ├── MapArea.jsx    # Geospatial navigation framework & site boundary polygon tool
    │   │   └── Viewport3D.jsx # WebGL canvas loop orchestrating shaders, groups, & buffers
    │   └── ui/
    │       ├── ColorInput.jsx # Hexadecimal vector color selector inputs
    │       ├── NumberInput.jsx# Precision algebraic parameters manual overwrite panels
    │       └── Slider.jsx     # Linear mechanical boundaries tracking unified inputs
    └── plugins/
        ├── BoxGenerator/      # Basic volumetric shape calculator sandbox
        └── FloorplanGrid/
            ├── manifest.json  # Schema definitions defining expected user input types
            ├── blueprint.json # System database storing multi-storey grid layer identities
            └── compute.js     # Master calculation factory translating sliders to coordinates


⚡ Setup & InstallationPrerequisitesMake sure you have Node.js (v18 or higher recommended) installed on your system.1. Clone the RepositoryClone the project repository to your local machine using terminal utilities:Bashgit clone https://github.com/Cadeval/bimcube.git
cd bimcube

2. Install Project DependenciesInstall the required node packages defined inside your manifest footprint:  Bashnpm install

3. Launch Local Development ServerBoot up the local Vite development pipeline server:  Bashnpm run dev
Open the provided terminal address (usually http://localhost:5173/bimcube/) in your browser to inspect the application.

4. Compiling a Production BuildCompile your production files to the standalone /dist folder target location:  Bashnpm run build

🤝 Core Contributor GuidelineTo keep the application modular, performant, and stable, adhere to these project guardrails:State Protection: Never mutate store variables directly outside of predefined execution pathways inside store.js.  No Three.js Logic in React: UI nodes should remain completely oblivious to rendering loops. React changes store params; the store triggers an App.jsx execution rerun; Viewport3D.jsx catches those outputs and re-renders the WebGL buffers.  Strict Pure Calculations: Keep your calculation functions inside compute.js completely stateless. They must behave purely as a mathematical transformer: Input (Sliders) -> Output (JSON JSON).  