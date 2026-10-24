import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

import { OverviewPage } from './pages/OverviewPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { NewReviewPage } from './pages/NewReviewPage';
import { ReviewDetailPage } from './pages/ReviewDetailPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { SourcesPage } from './pages/SourcesPage';
import { AssetsPage } from './pages/AssetsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#080B14]">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewPage />} />
            <Route path="reviews" element={<ReviewsPage />} />
            <Route path="reviews/new" element={<NewReviewPage />} />
            <Route path="reviews/:id" element={<ReviewDetailPage />} />
            <Route path="guidelines" element={<GuidelinesPage />} />
            <Route path="sources" element={<SourcesPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="approvals" element={<ApprovalsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
