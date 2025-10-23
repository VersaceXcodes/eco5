import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Import views
import GV_TopNav from '@/components/views/GV_TopNav';
import GV_Footer from '@/components/views/GV_Footer';
import UV_Landing from '@/components/views/UV_Landing';
import UV_UserDashboard from '@/components/views/UV_UserDashboard';
import UV_ImpactCalculator from '@/components/views/UV_ImpactCalculator';
import UV_CommunityForum from '@/components/views/UV_CommunityForum';
import UV_ResourceLibrary from '@/components/views/UV_ResourceLibrary';
import UV_Auth from '@/components/views/UV_Auth';
import UV_UserAccountSettings from '@/components/views/UV_UserAccountSettings';
import UV_About from '@/components/views/UV_About';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth?action=login" replace />;
  }
  
  return <>{children}</>;
};

// Main App component
const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeAuth = useAppStore(state => state.initialize_auth);
  
  useEffect(() => {
    // Initialize auth state when the app loads
    initializeAuth();
  }, [initializeAuth]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App min-h-screen flex flex-col">
          <GV_TopNav />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<UV_Landing />} />
              <Route path="/auth" element={<UV_Auth />} />
              <Route path="/about" element={<UV_About />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><UV_UserDashboard /></ProtectedRoute>} />
              <Route path="/impact-calculator" element={<ProtectedRoute><UV_ImpactCalculator /></ProtectedRoute>} />
              <Route path="/community-forum" element={<ProtectedRoute><UV_CommunityForum /></ProtectedRoute>} />
              <Route path="/resource-library" element={<ProtectedRoute><UV_ResourceLibrary /></ProtectedRoute>} />
              <Route path="/account-settings" element={<ProtectedRoute><UV_UserAccountSettings /></ProtectedRoute>} />
              
              {/* Catch-all route will redirect based on auth status */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <GV_Footer />
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;