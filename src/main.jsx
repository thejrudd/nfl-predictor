import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './index.css'
import App from './App.jsx'
import { PredictionProvider } from './context/PredictionContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <PredictionProvider>
        <App />
      </PredictionProvider>
    </ThemeProvider>
  </StrictMode>,
)
