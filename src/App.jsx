import LeftPane from './components/layout/LeftPane';
import MiddlePane from './components/layout/MiddlePane';
import RightPane from './components/layout/RightPane';

function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', margin: 0, padding: 0, backgroundColor: '#121212', color: '#e0e0e0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <LeftPane />
      <MiddlePane />
      <RightPane />
    </div>
  );
}

export default App;