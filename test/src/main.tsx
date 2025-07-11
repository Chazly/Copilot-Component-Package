console.log('🚀 Starting React app...')
import React from 'react'
console.log('✅ React imported')
import ReactDOM from 'react-dom/client'
console.log('✅ ReactDOM imported')
import App from './App'
console.log('✅ App component imported')
import './index.css'
console.log('✅ CSS imported')

console.log('🎯 Attempting to mount React app...')
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
console.log('✅ React app mounted successfully') 