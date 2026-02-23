
import { Navbar } from './components/Navbar/Navbar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useTheme } from './hooks/useTheme';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="container" style={{ padding: '2rem 0' }}>
        <Dashboard />
      </main>
    </>
  );
}

export default App;
