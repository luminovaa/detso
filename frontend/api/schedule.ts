import services from "@/services/services";
import { CreateWorkSchedule } from "@/types/schedule.types";

interface GetSchedulesParams {
  month?: number;
  year?: number;
  status?: string;
  technician_id?: string;
}

export function getSchedules(params?: GetSchedulesParams) {
  return services({
    url: '/schedule',
    method: 'get',
    params,
  });
}

export function createSchedule(data: CreateWorkSchedule) {
    return services({
        url: '/schedule',
        method: 'post',
        data,
    });
}

// export function updateSchedule(id: string, data: CreateScheduleFormData) {
//   return services({
//     url: `/package/${id}`,
//     method: 'put',
//     data,
//   });
// }