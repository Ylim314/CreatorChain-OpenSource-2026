import React from 'react';
import { Box, Typography, Container, Link, IconButton } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { GitHub, Twitter, Telegram } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        background: 'linear-gradient(180deg, rgba(10,12,20,0.95) 0%, rgba(20,14,34,0.95) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        backdropFilter: 'blur(8px)',
        color: '#E5E7EB',
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 500,
              color: 'rgba(255,255,255,0.92)'
            }}
          >
            © {new Date().getFullYear()} CreatorChain. All rights reserved.
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Link 
              component={RouterLink}
              to="/privacy"
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                '&:hover': { 
                  color: '#93c5fd',
                  textShadow: '0 0 10px rgba(147, 197, 253, 0.35)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              隐私政策
            </Link>
            <Typography 
              variant="body2" 
              sx={{ 
                mx: 1,
                color: 'rgba(255,255,255,0.45)'
              }}
            >
              |
            </Typography>
            <Link 
              component={RouterLink}
              to="/terms"
              sx={{ 
                color: 'rgba(255,255,255,0.9)',
                textDecoration: 'none',
                '&:hover': { 
                  color: '#93c5fd',
                  textShadow: '0 0 10px rgba(147, 197, 253, 0.35)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              服务条款
            </Link>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton 
              href="https://github.com/Ylim314" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                '&:hover': {
                  color: '#93c5fd',
                  transform: 'scale(1.1)',
                  backgroundColor: 'rgba(147, 197, 253, 0.12)',
                  boxShadow: '0 0 12px rgba(147, 197, 253, 0.28)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <GitHub />
            </IconButton>
            <IconButton 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                '&:hover': {
                  color: '#93c5fd',
                  transform: 'scale(1.1)',
                  backgroundColor: 'rgba(147, 197, 253, 0.12)',
                  boxShadow: '0 0 12px rgba(147, 197, 253, 0.28)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Twitter />
            </IconButton>
            <IconButton 
              href="https://telegram.org" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{
                color: 'rgba(255,255,255,0.92)',
                '&:hover': {
                  color: '#93c5fd',
                  transform: 'scale(1.1)',
                  backgroundColor: 'rgba(147, 197, 253, 0.12)',
                  boxShadow: '0 0 12px rgba(147, 197, 253, 0.28)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Telegram />
            </IconButton>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
