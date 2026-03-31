import React from 'react';
import ReactDOM from 'react-dom/client';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={4000}
      hideProgressBar={false}
      theme="dark"
      toastStyle={{
        background: 'rgba(15,15,35,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(168,85,247,.3)',
        color: '#e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 0 30px rgba(168,85,247,.2)',
      }}
    />
  </React.StrictMode>
);
