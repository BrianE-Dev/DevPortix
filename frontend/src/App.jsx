// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Features from './components/Features';
import Projects from './components/Projects';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import ProjectDetail from './pages/ProjectDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import PricingPage from './pages/PricingPage';
import CommunityPage from './pages/CommunityPage';
import { ROLES } from './utils/constants';
import StudentDashboard from './pages/dashboards/StudentDashboard';
import InstructorDashboard from './pages/dashboards/InstructorDashboard';
import ProfessionalDashboard from './pages/dashboards/ProfessionalDashboard';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import RoleSelectionPage from './pages/auth/RoleSelectionPage';
import PortfolioPage from './pages/PortfolioPage';
import { useTheme } from './hooks/useTheme';

const DashboardRedirect = () => {
  const { getDashboardPath } = useAuth();
  return <Navigate to={getDashboardPath()} replace />;
};

const AppContent = () => {
  const { theme } = useTheme();
  const appThemeClass =
    theme === 'dark'
      ? 'min-h-screen bg-gray-950 text-gray-100 transition-colors duration-300'
      : 'min-h-screen bg-blue-100 text-gray-900 transition-colors duration-300';

  return (
    <>
      <Navbar />
    
    <div className={appThemeClass}>
      
      <main>
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <Features />
              <Projects />
              <Testimonials />
              <Pricing />
            </>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />
          <Route path="/role-select" element={
            <ProtectedRoute>
              <RoleSelectionPage />
            </ProtectedRoute>
          } />
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={[ROLES.STUDENT]}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/instructor" element={
            <ProtectedRoute allowedRoles={[ROLES.INSTRUCTOR]}>
              <InstructorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/professional" element={
            <ProtectedRoute allowedRoles={[ROLES.PROFESSIONAL, ROLES.ORGANIZATION]}>
              <ProfessionalDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/community" element={
            <ProtectedRoute>
              <CommunityPage />
            </ProtectedRoute>
          } />
          <Route path="/portfolio/:username" element={<PortfolioPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
    </>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

