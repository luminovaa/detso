"use client";

import AdminPanelLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User } from "lucide-react";

export default function Loading() {
  return (
    <AdminPanelLayout showSearch={false} title="Profile">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Kolom Kiri: Avatar & Aksi - Mirror struktur asli */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Avatar Skeleton */}
                <Skeleton className="w-24 h-24 rounded-full" />
                
                {/* Name & Role Skeleton */}
                <div className="text-center space-y-2">
                  <Skeleton className="h-6 w-32 mx-auto" />
                  <Skeleton className="h-5 w-20 mx-auto rounded-full" />
                </div>

                {/* Button Skeletons */}
                <div className="w-full space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kolom Kanan: Informasi Akun - Mirror struktur asli */}
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
                  <Skeleton className="h-4 w-12" /> 
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 bg-gray-300 rounded opacity-50" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="w-4 h-4 bg-gray-300 rounded opacity-50" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-10" /> 
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 bg-gray-300 rounded opacity-50" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-8" />
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-4 h-4 bg-gray-300 rounded opacity-50" /> 
                  <Skeleton className="h-5 w-20 rounded-full" /> 
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPanelLayout>
  );
}