import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Box } from '@mui/material';
import { useThemeMode } from '../../context/ThemeModeContext';

const GlassCard = ({ children, hover = true, glow = false, ...props }) => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  return (
    <Card
      {...props}
      sx={{
        background: dark
          ? 'rgba(30, 41, 59, 0.7)'
          : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${dark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.3)'}`,
        borderRadius: 3,
        boxShadow: dark
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden',
        ...(hover && {
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: dark
              ? '0 16px 48px rgba(0, 0, 0, 0.4)'
              : '0 16px 48px rgba(0, 0, 0, 0.15)',
            borderColor: 'primary.main',
            ...(glow && {
              '&::before': {
                opacity: 1
              }
            })
          }
        }),
        ...(glow && {
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(45deg, 
              ${dark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)'} 0%, 
              ${dark ? 'rgba(147,51,234,0.1)' : 'rgba(147,51,234,0.05)'} 50%, 
              ${dark ? 'rgba(236,72,153,0.1)' : 'rgba(236,72,153,0.05)'} 100%)`,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: -1
          }
        }),
        ...props.sx
      }}
    >
      {children}
    </Card>
  );
};

const AnimatedCard = ({ children, delay = 0, ...props }) => {
  return (
    <Box
      sx={{
        animation: `slideInUp 0.6s ease-out ${delay}s both`,
        '@keyframes slideInUp': {
          from: {
            transform: 'translateY(30px)',
            opacity: 0
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1
          }
        }
      }}
    >
      <GlassCard {...props}>
        {children}
      </GlassCard>
    </Box>
  );
};

const FeatureCard = ({ icon, title, description, delay = 0, glow = false }) => {
  const { mode } = useThemeMode();
  const dark = mode === 'dark';

  return (
    <AnimatedCard delay={delay} glow={glow}>
      <CardContent sx={{ p: 4, textAlign: 'center' }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: `linear-gradient(135deg, 
              ${dark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.1)'}, 
              ${dark ? 'rgba(147,51,234,0.2)' : 'rgba(147,51,234,0.1)'})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: 'primary.main',
            fontSize: 32,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1) rotate(5deg)',
              background: `linear-gradient(135deg, 
                ${dark ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.15)'}, 
                ${dark ? 'rgba(147,51,234,0.3)' : 'rgba(147,51,234,0.15)'})`,
            }
          }}
        >
          {icon}
        </Box>
        <Box sx={{ color: 'text.primary', fontSize: '1.25rem', fontWeight: 600, mb: 2 }}>
          {title}
        </Box>
        <Box sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
          {description}
        </Box>
      </CardContent>
    </AnimatedCard>
  );
};

GlassCard.propTypes = {
  children: PropTypes.node.isRequired,
  hover: PropTypes.bool,
  glow: PropTypes.bool
};

AnimatedCard.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf(['fadeIn', 'slideUp', 'scale']),
  delay: PropTypes.number
};

FeatureCard.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

export { GlassCard, AnimatedCard, FeatureCard };
