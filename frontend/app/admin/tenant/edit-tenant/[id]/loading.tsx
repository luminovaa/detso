import AdminPanelLayout from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTenantSkeleton() {
  return (
    <AdminPanelLayout title="Memuat Data..." showSearch={false}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="pb-4">
            {/* Title Skeleton */}
            <Skeleton className="h-8 w-1/3 rounded-md" />
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* --- Logo Upload Section Skeleton --- */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32 rounded" /> {/* Label: Logo Perusahaan */}
              
              {/* Dropzone Placeholder */}
              <Skeleton className="h-48 w-full rounded-xl" /> 
            </div>

            {/* --- Form Inputs Skeleton --- */}
            <div className="space-y-6">
              {/* Nama Perusahaan */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-10 w-full rounded-3xl" />
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 rounded" />
                <Skeleton className="h-10 w-full rounded-3xl" />
              </div>

              {/* Alamat (Textarea - lebih tinggi) */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-24 w-full rounded-3xl" />
              </div>

              {/* Status Switch (Optional rendering, tapi kita kasih space aja) */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-10 w-full rounded-3xl" />
              </div>
            </div>

            {/* --- Action Buttons --- */}
            <div className="flex justify-end gap-4 pt-6 border-t">
              <Skeleton className="h-10 w-24 rounded-3xl" /> {/* Tombol Batal */}
              <Skeleton className="h-10 w-36 rounded-3xl" /> {/* Tombol Simpan */}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminPanelLayout>
  );
}