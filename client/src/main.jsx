/**
 * @AUTHOR: Garima Mittal
 * @FILE: main.jsx
 * @RESPONSIBILITY: Client application root mounting React virtual DOM, AuthProvider, and Tailwind theme styles.
 * @DEPENDENCIES: react, react-dom/client, AuthContext.jsx, theme.css, App.jsx
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
