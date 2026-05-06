import LeftPane from './components/layout/LeftPane';
import MiddlePane from './components/layout/MiddlePane';
import RightPane from './components/layout/RightPane';

function App() {
  return (
    <div style={{ 
      position: 'relative', // 🪄 NEW: Allows elements to float inside
      width: '100vw', 
      height: '100vh', 
      backgroundColor: '#121212', 
      color: '#e0e0e0', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden' // Prevents scrollbars from floating panels
    }}>
      {/* 🪄 RightPane is rendered FIRST so it stays in the background */}
      <RightPane />
      <LeftPane />
      <MiddlePane />
    </div>
  );
}

export default App;