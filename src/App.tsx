import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Quotes } from './pages/Quotes';
import { Policies } from './pages/Policies';
import { useStore } from './store/useStore';
import './App.css';

function App() {
  const isAuthenticated = useStore((state) => state.isAuthenticated);

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/quotes"
            element={isAuthenticated ? <Quotes /> : <Navigate to="/login" />}
          />
          <Route
            path="/policies"
            element={isAuthenticated ? <Policies /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

