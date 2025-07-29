import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Tables from './components/Pages.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Tables />
  </StrictMode>,
)
