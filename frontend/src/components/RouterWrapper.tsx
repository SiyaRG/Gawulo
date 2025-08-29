import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useRouteChange } from '../hooks/useRouteChange';
import Layout from './Layout';
import OfflineIndicator from './OfflineIndicator';
import LoginForm from './LoginForm';
import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import VendorDashboard from '../pages/VendorDashboard';
import CustomerDashboard from '../pages/CustomerDashboard';
import OrderTracking from '../pages/OrderTracking';
import PaymentPage from '../pages/PaymentPage';
import ProfilePage from '../pages/ProfilePage';
import SettingsPage from '../pages/SettingsPage';
import { AppState } from '../types/index';

interface RouterWrapperProps {
  appState: AppState;
}

const RouterWrapper: React.FC<RouterWrapperProps> = ({ appState }) => {
  // Handle route changes and cache invalidation
  useRouteChange();

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
      
      {/* Protected routes */}
      <Route 
        path="/home" 
        element={
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
          appState.isAuthenticated ? (
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
