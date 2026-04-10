import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App.jsx'
import './index.css'
import { GroupsProvider } from "./shared/modules/groups/state/index.js";
import { AuthProvider } from "./shared/modules/auth/context/AuthContext.jsx";
import { ToastProvider } from "./shared/components/ui/Toast.jsx";

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <GroupsProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </GroupsProvider>
    </AuthProvider>
  </StrictMode>,
)
