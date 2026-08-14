import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import './index.css'
import App from './App.jsx'
import "./features/auth/shared/global.scss";
// smooth scroll
import SmoothScroll from "./components/SmoothScroll.jsx";

createRoot(document.getElementById('root')).render(
  <SmoothScroll>
  <StrictMode>
    <App />
  </StrictMode>,
  </SmoothScroll>
)
