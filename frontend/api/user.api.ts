import service from "@/services/services";
import { CreateUserFormData, UpdateUserFormData, User } from "@/types/user.types";

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export function getUsers(params?: GetUsersParams) {
  return service({
    url: '/user',
    method: 'get',
    params,
  });
}

export function getUserById(id: string) {
    return service({
        url: `/user/${id}`,
        method: 'get'
    })
}

export function createUser(user: CreateUserFormData) {
    return service({
        url: '/auth/register',
        method: 'post',
        data: user
    })
}

export function editUser(formData: FormData, id: string) {
  return service({
    url: `/user/${id}`,
    method: 'put',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}