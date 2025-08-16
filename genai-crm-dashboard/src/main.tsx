import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DebugApp from './DebugApp'
import './index.css'

// Use DebugApp to test basic React functionality
const useDebugMode = false // Set to true to enable debug mode

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useDebugMode ? <DebugApp /> : <App />}
  </React.StrictMode>,
)