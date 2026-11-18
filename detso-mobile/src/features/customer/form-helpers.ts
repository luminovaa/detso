import { Package, ServiceConnection } from "@/src/lib/types";
import { appendFormDataFile } from "@/src/lib/form-data";
import { SelectOption } from "@/src/components/global/select-searchable";
import { packageService } from "@/src/features/package/service";
import { CreateCustomerInput } from "./schema";

export interface CustomerPhotoState {
  uri: string;
  base64?: string;
}

export interface PackageSelectOption extends SelectOption {
  name: string;
  speed: string;
  price: number;
}

export interface CustomerEditDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nik: string | null;
  birth_place: string | null;
  birth_date: string | null;
  services?: Pick<ServiceConnection, "id" | "address" | "lat" | "long">[];
}

export interface CustomerCreatePhotosPayload {
  ktpPhoto: CustomerPhotoState | null;
  photoFront: CustomerPhotoState | null;
  photoSide: CustomerPhotoState | null;
  photoFar: CustomerPhotoState | null;
  photoCustomer: CustomerPhotoState | null;
  photoDevice: CustomerPhotoState | null;
}

export async function fetchPackageSelectOptions(
  search: string,
  page: number,
): Promise<{ data: PackageSelectOption[]; hasNextPage: boolean }> {
  const res = await packageService.getAll({ search, page, limit: 20 });
  const packages: Package[] = res?.data?.packages || [];
  return {
    data: packages.map((pkg) => ({
      label: `${pkg.name} - ${pkg.speed}`,
      value: pkg.id,
      price: pkg.price,
      speed: pkg.speed,
      name: pkg.name,
    })),
    hasNextPage: Boolean(res?.data?.pagination?.hasNextPage),
  };
}

export function buildCreateCustomerFormData(
  data: CreateCustomerInput,
  photos: CustomerCreatePhotosPayload,
): FormData {
  const formData = new FormData();

  // Customer fields
  formData.append("name", data.name.trim());
  if (data.phone) formData.append("phone", data.phone);
  if (data.email) formData.append("email", data.email);
  if (data.nik) formData.append("nik", data.nik);
  if (data.address) formData.append("address", data.address);
  if (data.birth_place) formData.append("birth_place", data.birth_place);
  if (data.birth_date) formData.append("birth_date", new Date(data.birth_date).toISOString());

  // Documents (KTP — persists even when package_id is omitted)
  if (photos.ktpPhoto) {
    formData.append("documents", JSON.stringify([{ type: "ktp" }]));
    appendFormDataFile(formData, "documents", photos.ktpPhoto.uri, "ktp");
  }

  // Service connection & installation photos require a package_id
  if (data.package_id) {
    formData.append("package_id", data.package_id);
    if (data.address_service) formData.append("address_service", data.address_service);
    if (data.lat) formData.append("lat", data.lat);
    if (data.long) formData.append("long", data.long);
    if (data.ip_address) formData.append("ip_address", data.ip_address);
    if (data.mac_address) formData.append("mac_address", data.mac_address);
    if (data.notes) formData.append("notes", data.notes);
    if (data.odp_id) formData.append("odp_id", data.odp_id);

    const installationPhotos: { type: string; photo: CustomerPhotoState | null }[] = [
      { type: "rumah_depan", photo: photos.photoFront },
      { type: "rumah_sisi_kanan", photo: photos.photoSide },
      { type: "rumah_sisi_kiri", photo: photos.photoFar },
      { type: "denganpelanggan", photo: photos.photoCustomer },
      { type: "alat", photo: photos.photoDevice },
    ];

    const validPhotos = installationPhotos.filter((item) => item.photo !== null);
    if (validPhotos.length > 0) {
      formData.append("photos", JSON.stringify(validPhotos.map((item) => ({ type: item.type }))));
      validPhotos.forEach((item, idx) => {
        appendFormDataFile(formData, "photos", item.photo!.uri, `${item.type}-${idx}`);
      });
    }
  }

  return formData;
}
