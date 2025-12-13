import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from 'react-query';
import { useRouteChange } from '../hooks/useRouteChange';
import Layout from './Layout';
import OfflineIndicator from './OfflineIndicator';
import LoginForm from './LoginForm';
import UserRegistrationForm from './UserRegistrationForm';
import LandingPage from '../pages/UnauthenticatedPages/LandingPage';
import HomePage from '../pages/HomePage';
import VendorDashboard from '../pages/VendorDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import OrderTracking from '../pages/OrderTracking';
import PaymentPage from '../pages/PaymentPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import Services from '../pages/UnauthenticatedPages/Services';
import About from '../pages/UnauthenticatedPages/About';
import Contact from '../pages/UnauthenticatedPages/Contact';
import OAuthCallback from '../pages/OAuthCallback';
import { AppState } from '../types/index';

interface RouterWrapperProps {
  appState: AppState;
}

const RouterWrapper: React.FC<RouterWrapperProps> = ({ appState }) => {
  // Handle route changes and cache invalidation
  useRouteChange();
  const queryClient = useQueryClient();
  
  // Check both appState and queryClient for authentication status
  // This ensures we have the latest auth state even if appState hasn't updated yet
  const cachedUser = queryClient.getQueryData(['user', 'current']);
  const isAuthenticated = appState.isAuthenticated || (cachedUser !== null && cachedUser !== undefined);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={
        <Layout appState={appState}>
          <LandingPage />
        </Layout>
      } />
      <Route path="/login" element={
        <Layout appState={appState}>
          <LoginForm />
        </Layout>
      } />
      <Route path="/register" element={
        <Layout appState={appState}>
          <UserRegistrationForm />
        </Layout>
      } />
      <Route path="/services" element={
        <Layout appState={appState}>
          <Services />
        </Layout>
      } />
      <Route path="/about" element={
        <Layout appState={appState}>
          <About />
        </Layout>
      } />
      <Route path="/contact" element={
        <Layout appState={appState}>
          <Contact />
        </Layout>
      } />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      
      {/* Protected routes */}
      <Route 
        path="/home" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <HomePage appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/vendor" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <VendorDashboard appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/customer" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <CustomerDashboard appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/track/:orderId" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <OrderTracking appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/payment/:orderId" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <PaymentPage appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/profile" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <ProfilePage appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      <Route 
        path="/settings" 
        element={
          isAuthenticated ? (
            <Layout appState={appState}>
              <OfflineIndicator isOnline={appState.isOnline} />
              <SettingsPage appState={appState} />
            </Layout>
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
};

export default RouterWrapper;
