import React from 'react';
import { Box } from '@mui/material';
import { useThemeMode } from '../../context/ThemeModeContext';

const PageLayout = ({ children, background = 'particles' }) => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  const renderBackground = () => {
    switch (background) {
      case 'particles':
        return (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              background: dark
                ? 'linear-gradient(135deg, #0B1220 0%, #1E293B 50%, #0F172A 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: dark
                  ? `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.1) 0%, transparent 50%),
                     radial-gradient(circle at 80% 20%, rgba(147,51,234,0.1) 0%, transparent 50%),
                     radial-gradient(circle at 40% 80%, rgba(236,72,153,0.1) 0%, transparent 50%)`
                  : `radial-gradient(circle at 20% 50%, rgba(59,130,246,0.05) 0%, transparent 50%),
                     radial-gradient(circle at 80% 20%, rgba(147,51,234,0.05) 0%, transparent 50%),
                     radial-gradient(circle at 40% 80%, rgba(236,72,153,0.05) 0%, transparent 50%)`,
                animation: 'float 6s ease-in-out infinite alternate'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                backgroundImage: dark
                  ? `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`
                  : `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }
            }}
          />
        );
      case 'gradient':
        return (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              background: dark
                ? 'linear-gradient(45deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)'
                : 'linear-gradient(45deg, #EFF6FF 0%, #DBEAFE 50%, #BFDBFE 100%)'
            }}
          />
        );
      case 'aurora':
        return (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              background: dark
                ? 'linear-gradient(135deg, #0B1220 0%, #1E293B 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: dark
                  ? `conic-gradient(from 0deg at 50% 50%, 
                     rgba(59,130,246,0.2) 0deg, 
                     rgba(147,51,234,0.2) 60deg, 
                     rgba(236,72,153,0.2) 120deg, 
                     rgba(59,130,246,0.2) 180deg, 
                     rgba(16,185,129,0.2) 240deg, 
                     rgba(236,72,153,0.2) 300deg, 
                     rgba(59,130,246,0.2) 360deg)`
                  : `conic-gradient(from 0deg at 50% 50%, 
                     rgba(59,130,246,0.1) 0deg, 
                     rgba(147,51,234,0.1) 60deg, 
                     rgba(236,72,153,0.1) 120deg, 
                     rgba(59,130,246,0.1) 180deg, 
                     rgba(16,185,129,0.1) 240deg, 
                     rgba(236,72,153,0.1) 300deg, 
                     rgba(59,130,246,0.1) 360deg)`,
                animation: 'spin 20s linear infinite',
                filter: 'blur(100px)',
                opacity: 0.6
              }
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {renderBackground()}
      
      {/* 浮动粒子效果 */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: -1,
          pointerEvents: 'none',
          '& .particle': {
            position: 'absolute',
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: dark
              ? 'linear-gradient(45deg, rgba(59,130,246,0.4), rgba(147,51,234,0.4))'
              : 'linear-gradient(45deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3))',
            animation: 'float 8s ease-in-out infinite'
          }
        }}
      >
        {[...Array(12)].map((_, i) => (
          <Box
            key={i}
            className="particle"
            sx={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          />
        ))}
      </Box>
      
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          minHeight: '100vh',
          py: 3
        }}
      >
        {children}
      </Box>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          25% { transform: translateY(-20px) translateX(10px) scale(1.1); }
          50% { transform: translateY(-10px) translateX(-10px) scale(0.9); }
          75% { transform: translateY(-30px) translateX(5px) scale(1.05); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
};

export default PageLayout;
