import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Web3Provider } from './context/Web3ContextFixed';
import { ThemeModeProvider } from './context/ThemeModeContext';
import { setupErrorHandling } from './utils/errorHandler';

// 设置错误处理 - 在导入之后立即执行
setupErrorHandling();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Web3Provider>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </Web3Provider>
  </BrowserRouter>
);
