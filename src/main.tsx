import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#13131f',
            color: '#F0EAD6',
            border: '1px solid rgba(201, 168, 76, 0.3)',
          },
          success: { iconTheme: { primary: '#c9a84c', secondary: '#13131f' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)
