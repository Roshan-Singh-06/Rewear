
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import Authentication from './pages/Authentication';
import Home from './pages/Home';
import Browse from './pages/Browse';
import About from './pages/About';
import Messages from './pages/MessagesNew';
import AddItemForm from './pages/AddItemForm';
import ReWearUserDashboard from './pages/ReWearUserDashboard';
import ProductDetail from './pages/ProductDetail';
import Notifications from './pages/Notifications';
import NotificationDetail from './pages/NotificationDetail';
import NotificationTest from './pages/NotificationTest';
import SwapDetail from './pages/SwapDetail';
import Transactions from './pages/Transactions';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route 
              path='/auth' 
              element={<Authentication />} 
            />
            <Route 
              path='/home' 
              element={<Home />} 
            />
            <Route 
              path='/browse' 
              element={<Browse />} 
            />
            <Route 
              path='/product/:id' 
              element={<ProductDetail />} 
            />
            <Route 
              path='/about' 
              element={<About />} 
            />
            <Route 
              path='/messages' 
              element={<Messages />} 
            />
            <Route 
              path='/notifications' 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path='/notifications/:id' 
              element={
                <ProtectedRoute>
                  <NotificationDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path='/swap/:id' 
              element={
                <ProtectedRoute>
                  <SwapDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path='/transactions' 
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path='/transactions/:id' 
              element={
                <ProtectedRoute>
                  <Transactions />
                </ProtectedRoute>
              } 
            />
            <Route 
              path='/test-notifications' 
              element={
                <ProtectedRoute>
                  <NotificationTest />
                </ProtectedRoute>
              } 
            />
          <Route 
              path='/' 
              element={<Navigate to='/home' replace />}
            />
            <Route 
              path='/addItem'
              element={
                <ProtectedRoute requireProfileComplete={true}>
                  <AddItemForm />
                </ProtectedRoute>
              }
            />
            <Route 
              path='/dashboard'
              element={
                <ProtectedRoute>
                  <ReWearUserDashboard /> 
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </>
  );
}

export default App;