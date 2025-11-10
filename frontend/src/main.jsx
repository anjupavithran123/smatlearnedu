import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { setAuthToken } from './lib/api'

// ✅ Check for saved JWT and set default Authorization header
const token = localStorage.getItem('token')
if (token) {
  setAuthToken(token)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
