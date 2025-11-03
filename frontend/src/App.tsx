import { AuthProvider } from "./context/AuthContext";
import AppRoute from "./routes/AppRoute";
// import { Toaster } from "react-hot-toast";

function App() {
  return (
    <AuthProvider>
      <AppRoute />
      {/* <Toaster position="top-center" reverseOrder={false} /> */}

    </AuthProvider>
  );
}

export default App;
