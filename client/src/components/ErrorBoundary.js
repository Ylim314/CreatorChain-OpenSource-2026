import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              p: 4,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}
          >
            <ErrorOutline 
              sx={{ 
                fontSize: 64, 
                color: '#ef4444', 
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(239, 68, 68, 0.3))'
              }} 
            />
            
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 2, 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ef4444, #f87171)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              哎呀！出现了错误
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                color: 'text.secondary',
                lineHeight: 1.6
              }}
            >
              应用程序遇到了一个意外错误。这可能是由于网络问题、浏览器兼容性或代码问题导致的。
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReload}
                sx={{
                  background: 'linear-gradient(45deg, #3b82f6, #60a5fa)',
                  borderRadius: '20px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                    background: 'linear-gradient(45deg, #2563eb, #3b82f6)'
                  }
                }}
              >
                重新加载页面
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                sx={{
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '20px',
                  px: 3,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                重试
              </Button>
            </Box>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box 
                sx={{ 
                  mt: 4, 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '8px',
                  textAlign: 'left'
                }}
              >
                <Typography variant="h6" sx={{ mb: 1, color: '#ef4444' }}>
                  错误详情 (开发模式):
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace', 
                      fontSize: '0.75rem',
                      color: '#fca5a5',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      mt: 1
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
