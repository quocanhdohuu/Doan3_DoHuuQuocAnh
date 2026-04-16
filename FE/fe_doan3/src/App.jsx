import "./App.css";
import { useState } from "react";
import Login from "./Components/Login";
import Register from "./Components/Register";
import QLKhachSan from "./Components/QLKhachSan";
import Customer_main from "./Components/Customer_Role/Customer_main";
import { AuthProvider, useAuth } from "./Components/AuthContext";

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [authView, setAuthView] = useState("login");

  if (isAuthenticated) {
    if (user.role === "CUSTOMER") {
      return <Customer_main />;
    } else if (user.role === "ADMIN" || user.role === "RECEPTIONIST") {
      return <QLKhachSan />;
    }
  }

  if (authView === "register") {
    return (
      <Register
        onBackToLogin={() => setAuthView("login")}
        onRegisterSuccess={() => setAuthView("login")}
      />
    );
  }

  return <Login onOpenRegister={() => setAuthView("register")} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
export default App;
