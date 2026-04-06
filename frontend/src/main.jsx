import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { registerServiceWorker } from './services/notificationService'
import './index.css'
import App from './App.jsx'

const clientId = "264469705993-qicv70lhvd3jq0v8cjgqnkabavr3pctk.apps.googleusercontent.com";

// Register Service Worker globally for PWA installability
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
