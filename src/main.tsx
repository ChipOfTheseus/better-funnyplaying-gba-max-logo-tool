import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "react-toastify/dist/ReactToastify.css";
import './assets/styles/app.scss'
import App from './App.tsx'
import { renderToString } from "react-dom/server";

export function MyApp() {
  return <StrictMode>
    <App />
  </StrictMode>
}

if (typeof window !== 'undefined') {
  createRoot(document.getElementById('root')!).render(MyApp())
}

// eslint-disable-next-line react-refresh/only-export-components
export async function prerender(data: any) {
  const html = renderToString(<App {...data} />);

  return { html };
}