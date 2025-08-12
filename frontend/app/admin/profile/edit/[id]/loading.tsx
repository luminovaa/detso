import AdminPanelLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <AdminPanelLayout title="Edit Pengguna" showSearch={false}>
      <div className="max-w-4xl mx-auto">
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Avatar Loading Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Skeleton className="w-32 h-32 rounded-full" />
                <div className="w-full space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Loading Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Name and Username Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Phone and Role Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  <Skeleton className="h-10 w-20 rounded-3xl" />
                  <Skeleton className="h-10 w-32 rounded-3xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminPanelLayout>
  );
}