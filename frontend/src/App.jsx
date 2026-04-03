import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { getCsrfToken } from "./api/axios";

function App() {

  // Fetch CSRF cookie when app loads
  useEffect(() => {
    getCsrfToken();
  }, []);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;