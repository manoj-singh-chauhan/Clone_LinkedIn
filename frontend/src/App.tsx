// import { AuthProvider } from "./context/AuthContext";
// import AppRoute from "./routes/AppRoute";
// // import { Toaster } from "react-hot-toast";

// function App() {
//   return (
//     <AuthProvider>
//       <AppRoute />
//       {/* <Toaster position="top-center" reverseOrder={false} /> */}

//     </AuthProvider>
//   );
// }

// export default App;


import { AuthProvider, useAuth } from "./context/AuthContext";
import AppRoute from "./routes/AppRoute";
import { ProfileContext } from "./context/ProfileContext";
import { getFullProfile } from "./api/profile";
import { useQuery } from "@tanstack/react-query";
import React from "react";

function ProfileProviderWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getFullProfile(Number(user?.id)),
    enabled: !!user?.id,
  });

  // You can handle loading/error UI here if needed
  if (isLoading) return <div>Loading...</div>;

  return (
    <ProfileContext.Provider value={data || null}>
      {children}
    </ProfileContext.Provider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProfileProviderWrapper>
        <AppRoute />
      </ProfileProviderWrapper>
    </AuthProvider>
  );
}

export default App;
