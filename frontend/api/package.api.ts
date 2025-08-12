import services from "@/services/services";
import { CreatePackageFormData } from "@/types/package.types";

interface GetPackagesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export function getPackages(params?: GetPackagesParams) {
  return services({
    url: '/package',
    method: 'get',
    params,
  });
}

export function createPackage(data: CreatePackageFormData) {
    return services({
        url: '/package',
        method: 'post',
        data,
    });
}

export function getPackageById(id: string) {
  return services({
    url: `/package/${id}`,
    method: 'get',
  })
}

export function updatePackage(id: string, data: CreatePackageFormData) {
  return services({
    url: `/package/${id}`,
    method: 'put',
    data,
  });
}


export function deletePackage(id: string) {
  return services({
    url: `/package/${id}`,
    method: 'delete',
  });
}