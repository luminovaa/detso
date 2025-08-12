// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Shield, Edit, Lock, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { User as UserType } from "@/types/user.types";
import AdminPanelLayout from "@/components/admin/admin-layout";
import { getUserById } from "@/api/user.api";
import Loading from "./loading";
import { RoleBadge } from "@/components/admin/role-badge";
import { authService } from "@/api/auth.api";
import { ChangePasswordDialog } from "./_components/change-password";
import { getInitials } from "@/utils/get-initial";
import { ToggleTheme } from "@/components/layout/toogle-theme";
import { ThemeSettingsCard } from "./_components/settings";

function ProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("ProfilePage: Getting current user...");
        const authMe = await authService.getCurrentUser();

        if (!authMe || !authMe.id) {
          throw new Error("No user data received");
        }

        console.log("ProfilePage: Getting user details...");
        const userData = await getUserById(authMe.id);

        if (userData?.data?.data) {
          setUserProfile(userData.data.data);
        } else {
          throw new Error("Failed to fetch user details");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to fetch user profile"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error || !userProfile) {
    return (
      <AdminPanelLayout showSearch={false} title="Profile">
        <div className="container mx-auto p-6 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-red-500 mb-4">
                <Shield className="w-12 h-12 mx-auto mb-2" />
                <p className="text-lg font-semibold">Error Loading Profile</p>
                <p className="text-sm text-gray-600">{error}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminPanelLayout>
    );
  }

  return (
    <AdminPanelLayout showSearch={false} title="Profile">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage
                    src={userProfile.profile?.avatar}
                    alt={userProfile.profile?.full_name || userProfile.username}
                  />
                  <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                    {getInitials(
                      userProfile.profile?.full_name || userProfile.username
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold">
                    {userProfile.profile?.full_name || userProfile.username}
                  </h2>
                  <RoleBadge role={userProfile.role} />
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(`/admin/profile/edit/${userProfile.id}`)
                  }
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
                <ChangePasswordDialog />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informasi Akun
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nama
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">
                      {userProfile.profile?.full_name || "-"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{userProfile.username}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{userProfile.email}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  No Hp
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <PhoneCall className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{userProfile.phone}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <RoleBadge role={userProfile.role} />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-3">
            <ThemeSettingsCard />
          </div>
        </div>
      </div>
    </AdminPanelLayout>
  );
}

export default ProfilePage;
