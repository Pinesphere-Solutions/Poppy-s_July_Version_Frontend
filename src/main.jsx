import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SidebarProvider } from "./context/SidebarContext.jsx";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <SidebarProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </SidebarProvider>
  </ThemeProvider>
);
