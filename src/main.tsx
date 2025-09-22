import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import "./custom.css";
import App from "./App.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { Toaster } from "react-hot-toast";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Suppress source map errors in development
if (import.meta.env.VITE_APP_DEVELOPMENT) {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.('Source map error') || args[0]?.includes?.('installHook')) {
      return; // Suppress source map errors
    }
    originalError.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
      <ThemeProvider>
        <App />
        <Toaster
          position="bottom-right"
          reverseOrder={false}
        />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
