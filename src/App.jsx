import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModernNavbar from './components/ModernNavbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import FeatureCards from './components/FeatureCards';
import AboutSection from './components/AboutSection';
import AnimatedSection from './components/AnimatedSection';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupDetail from './pages/GroupDetail';
import Sessions from './pages/Sessions';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import CreateSession from './pages/CreateSession';
import EditGroup from './pages/EditGroup';
import EditSession from './pages/EditSession';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <ModernNavbar />
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <AnimatedSection>
                <FeatureCards />
              </AnimatedSection>
              <AboutSection />
            </>
          } />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/groups" element={<Groups />} />
              <Route path="/create-group" element={<CreateGroup />} />
              <Route path="/group/:id" element={<GroupDetail />} />
              <Route path="/group/:id/edit" element={<EditGroup />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/create-session" element={<CreateSession />} />
              <Route path="/session/:id/edit" element={<EditSession />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;

