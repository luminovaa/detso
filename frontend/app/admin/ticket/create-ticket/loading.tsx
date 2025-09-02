import AdminPanelLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreateTickerSkeleton() {
  return (
    <AdminPanelLayout title="Tambah Ticket Baru" showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-48" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-32" /> {/* CardTitle placeholder */}
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" /> {/* Label */}
                  <Skeleton className="h-10 w-full" /> {/* Select input */}
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-20 w-full" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Skeleton className="h-10 w-20" /> {/* Cancel button */}
                  <Skeleton className="h-10 w-32" /> {/* Submit button */}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}
