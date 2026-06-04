import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ThemeProvider } from "./lib/theme";
import { AuthProvider } from "./lib/auth";
import { Toaster } from "./components/ui/sonner";
import { store, persistor } from "./store";
import App from "./App";
import "./styles.css";

// Sync persisted tokens back to localStorage on startup
store.subscribe(() => {
  const auth = store.getState().auth as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (auth.accessToken)
    localStorage.setItem("sv.access_token", auth.accessToken);
  if (auth.refreshToken)
    localStorage.setItem("sv.refresh_token", auth.refreshToken);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <App />
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </StrictMode>
);
