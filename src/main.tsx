import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './kid-ui.css';
import './art-ui.css';
import { initEducationalFont } from './utils/fontSettings';

initEducationalFont();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
