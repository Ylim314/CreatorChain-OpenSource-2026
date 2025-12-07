import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import AwesomeHome from './pages/AwesomeHome';
import Create from './pages/Create';
import Explore from './pages/Explore';
import CreationDetails from './pages/CreationDetails';
import Profile from './pages/Profile';
import Marketplace from './pages/Marketplace';
import Governance from './pages/Governance';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import GettingStarted from './pages/GettingStarted';
import BlockchainVerification from './pages/BlockchainVerification';
import AICreationStudio from './pages/AICreationStudio';
import CommunityEcosystem from './pages/CommunityEcosystem';
import SmartContracts from './pages/SmartContracts';
import DataAnalytics from './pages/DataAnalytics';
import GovernanceVoting from './pages/GovernanceVoting';
import MyFavorites from './pages/MyFavorites';
import MyCreations from './pages/MyCreations';
import MyLicenses from './pages/MyLicenses';
import AIModelConfig from './pages/AIModelConfig';
import ManualCreation from './pages/ManualCreation';
import AIChat from './pages/AIChat';
import ErrorInfo from './pages/ErrorInfo';
import './App.css';

// 加载中组件
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}
  >
    <CircularProgress size={60} sx={{ color: 'white' }} />
  </Box>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <div className="App">
        {/* 使用炫酷的粒子主页 */}
        <Routes>
        <Route path="/" element={<AwesomeHome />} />
        <Route path="/blockchain-verification" element={<BlockchainVerification />} />
        <Route path="/ai-creation-studio" element={<AICreationStudio />} />
        <Route path="/ai-creation" element={<AICreationStudio />} />
        <Route path="/manual-creation" element={<ManualCreation />} />
        <Route path="/community-ecosystem" element={<CommunityEcosystem />} />
        <Route path="/smart-contracts" element={<SmartContracts />} />
        <Route path="/data-analytics" element={<DataAnalytics />} />
        <Route path="/governance-voting" element={<GovernanceVoting />} />
        <Route path="/my-favorites" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <MyFavorites />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/my-creations" element={<MyCreations />} />
        <Route path="/my-licenses" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <MyLicenses />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/ai-model-config" element={<AIModelConfig />} />
        <Route path="/ai-chat" element={
          <>
            <Navbar />
            <AIChat />
            <Footer />
          </>
        } />
        <Route path="/error-info" element={<ErrorInfo />} />
        <Route path="/create" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Create />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/getting-started" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <GettingStarted />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/explore" element={<Navigate to="/marketplace" replace />} />
        <Route path="/creation/:id" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <CreationDetails />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/profile/:address" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Profile />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/marketplace" element={
          <>
            <Navbar />
            <Container maxWidth="xl" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Marketplace />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/governance" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Governance />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/privacy" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Privacy />
            </Container>
            <Footer />
          </>
        } />
        <Route path="/terms" element={
          <>
            <Navbar />
            <Container maxWidth="lg" sx={{ py: 4, minHeight: 'calc(100vh - 120px)' }}>
              <Terms />
            </Container>
            <Footer />
          </>
        } />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 3000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
