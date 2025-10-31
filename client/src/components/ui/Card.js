import React from 'react';
import { Box } from '@mui/material';
import { useThemeMode } from '../../context/ThemeModeContext';

const Card = ({ 
  children, 
  hover = true,
  glow = false,
  gradient = false,
  onClick,
  sx = {},
  ...props 
}) => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  return (
    <Box
      onClick={onClick}
      sx={{
        background: gradient 
          ? (dark 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(51, 65, 85, 0.8) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)')
          : (dark 
              ? 'rgba(30, 41, 59, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)'),
        borderRadius: 3,
        border: dark 
          ? '1px solid rgba(148, 163, 184, 0.1)' 
          : '1px solid rgba(148, 163, 184, 0.2)',
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: dark 
              ? '0 20px 40px rgba(0, 0, 0, 0.4)' 
              : '0 20px 40px rgba(0, 0, 0, 0.1)',
            borderColor: dark 
              ? 'rgba(59, 130, 246, 0.3)' 
              : 'rgba(59, 130, 246, 0.4)',
          }
        }),
        ...(glow && {
          animation: 'pulse 2s ease-in-out infinite',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: dark
              ? 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))'
              : 'linear-gradient(45deg, rgba(59, 130, 246, 0.05), rgba(147, 51, 234, 0.05), rgba(236, 72, 153, 0.05))',
            opacity: 0.7,
            animation: 'glow-inner 2s ease-in-out infinite alternate',
            zIndex: 0
          }
        }),
        ...sx
      }}
      {...props}
    >
      {/* 内容 */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Card;
