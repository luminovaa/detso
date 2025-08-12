import { AuthProvider } from "@/components/admin/context/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import React, { Suspense } from "react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <main>
          {children}
          <Toaster />
        </main>
      </Suspense>
    </AuthProvider>
  );
};

export default Layout;
