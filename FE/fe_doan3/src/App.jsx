import "./App.css";
import Login from "./Components/Login";
import QLKhachSan from "./Components/QLKhachSan";
import { AuthProvider, useAuth } from "./Components/AuthContext";

function AppContent() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <QLKhachSan /> : <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
export default App;
