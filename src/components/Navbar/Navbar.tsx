
import './Navbar.css';

interface NavbarProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ theme, toggleTheme }) => {
  return (
    <header className="navbar">
      <div className="container nav-container">
        <div className="logo">
          <h1>Reserva Praia</h1>
        </div>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label="Alternar tema"
          title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};
