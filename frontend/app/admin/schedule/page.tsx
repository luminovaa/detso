// components/IndonesianCalendar.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminPanelLayout from "@/components/admin/admin-layout";
import CreateScheduleDialog from "./_components/crate-dialog-schedule";
import { getSchedules } from "@/api/schedule";
import { Button } from "@/components/ui/button";
import { formatDate, formatIndonesiaTime } from "@/utils/date-format";
import ScheduleDetailDialog from "./_components/detail-schedule";
import { useAuth } from "@/components/admin/context/auth-provider";

interface Holiday {
  holiday_date: string;
  holiday_name: string;
  is_national_holiday: boolean;
}
interface Schedule {
  id: string;
  title: string;
  start: string;
  end: string | null;
  status: string;
  notes: string | null;
  technician: {
    id: string;
    username: string;
    full_name: string;
  };
  ticket: any | null;
  allDay: boolean;
}

const IndonesianCalendar: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState<boolean>(false);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { user } = useAuth();

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  // Get parameters from URL
  const monthParam = searchParams.get("month");
  const yearParam = searchParams.get("year");
  const technicianId = searchParams.get("technician_id");
  const status = searchParams.get("status");

  // Fetch holidays from API
  const fetchHolidays = async (year: number) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api-harilibur.vercel.app/api?year=${year}&country=ID`
      );
      if (!res.ok) throw new Error("Failed to fetch holidays");
      const data: Holiday[] = await res.json();

      // Filter to only include national holidays
      const nationalHolidays = data.filter(
        (holiday) => holiday.is_national_holiday
      );
      setHolidays(nationalHolidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch schedules based on URL parameters
  const fetchSchedules = async () => {
    try {
      const params: any = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
      };

      if (technicianId) params.technician_id = technicianId;
      if (status) params.status = status;

      const response = await getSchedules(params);
      setSchedules(response.data.data.schedules || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]);
    }
  };
  const handleScheduleClick = (
    scheduleId: string,
    isExpanded: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    // Only allow detail view when date is expanded
    if (isExpanded) {
      setSelectedScheduleId(scheduleId);
      setIsDetailDialogOpen(true);
    }
  };
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedScheduleId(null);
  };

  useEffect(() => {
    const initialDate = new Date();
    if (monthParam && yearParam) {
      initialDate.setMonth(parseInt(monthParam) - 1);
      initialDate.setFullYear(parseInt(yearParam));
    }
    setCurrentDate(initialDate);
  }, [monthParam, yearParam]);

  useEffect(() => {
    if (currentDate) {
      fetchHolidays(currentDate.getFullYear());
      fetchSchedules();
    }
  }, [currentDate, technicianId, status]);

  // Update URL parameters when date changes
  const updateUrlParams = (newDate: Date) => {
    const params = new URLSearchParams();
    params.set("month", (newDate.getMonth() + 1).toString());
    params.set("year", newDate.getFullYear().toString());

    if (technicianId) params.set("technician_id", technicianId);
    if (status) params.set("status", status);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isHoliday = (date: Date): Holiday | undefined => {
    const dateStr = formatDateLocal(date);
    return holidays.find((holiday) => {
      const apiDate = new Date(holiday.holiday_date);
      const apiDateStr = formatDateLocal(apiDate);
      return apiDateStr === dateStr;
    });
  };

  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getSchedulesForDate = (date: Date): Schedule[] => {
    const dateStr = formatDateLocal(date);
    const filteredSchedules = schedules.filter((schedule) => {
      const scheduleDate = new Date(schedule.start);
      const scheduleDateStr = formatDateLocal(scheduleDate);
      return scheduleDateStr === dateStr;
    });

    return filteredSchedules.sort((a, b) => {
      const timeA = new Date(a.start).getTime();
      const timeB = new Date(b.start).getTime();
      return timeA - timeB;
    });
  };

  const getDaysInMonth = (): Date[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

    const days: Date[] = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }
    return days;
  };

  const goToMonth = (monthIndex: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
    setExpandedDate(null);
    updateUrlParams(newDate);
  };

  const goToYear = (yearOffset: number) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(newDate.getFullYear() + yearOffset);
    setCurrentDate(newDate);
    setExpandedDate(null);
    updateUrlParams(newDate);
  };

  // Handle date click - Modified to prevent when clicking on dialog content
  const handleDateClick = (date: Date, e: React.MouseEvent) => {
    // Prevent expansion/collapse if clicking on dialog trigger or its children
    if ((e.target as HTMLElement).closest("[data-dialog-trigger]")) {
      return;
    }

    const dateStr = formatDateLocal(date);
    setExpandedDate(expandedDate === dateStr ? null : dateStr);
  };

  const handleScheduleCreated = () => {
    fetchSchedules();
  };

  const days = getDaysInMonth();
  const today = new Date();

  return (
    <AdminPanelLayout title="Kalender Kerja Karyawan" showSearch={false}>
      <div className="border rounded-xl overflow-hidden">
        <div className="p-4 bg-muted/20 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToYear(-1)}
              className="p-2 rounded-lg bg-background hover:bg-muted transition-colors shadow-sm"
              title="Tahun sebelumnya"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span className="text-lg font-semibold px-2 min-w-[80px] text-center">
              {currentDate.getFullYear()}
            </span>

            <button
              onClick={() => goToYear(1)}
              className="p-2 rounded-lg bg-background hover:bg-muted transition-colors shadow-sm"
              title="Tahun berikutnya"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-1 rounded-lg">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            {user?.role !== "TEKNISI" && (
              <CreateScheduleDialog onScheduleCreated={handleScheduleCreated} />
            )}
          </div>
        </div>

        <div className="p-4 bg-muted/30">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            {months.map((month, index) => (
              <Button
                key={month}
                onClick={() => goToMonth(index)}
                className={`flex-shrink-0 px-4 py-2 text-sm rounded-3xl transition-all duration-200 whitespace-nowrap ${
                  index === currentDate.getMonth()
                    ? "bg-primary text-primary-foreground shadow-md scale-105"
                    : "bg-background hover:bg-muted text-foreground hover:scale-102 shadow-sm"
                }`}
              >
                {month} {currentDate.getFullYear().toString().slice(-2)}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-muted-foreground rounded-lg bg-muted/20"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((date, index) => {
              const holiday = isHoliday(date);
              const weekend = isWeekend(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === today.toDateString();
              const dateStr = formatDateLocal(date);
              const isExpanded = expandedDate === dateStr;
              const dateSchedules = getSchedulesForDate(date);

              return (
                <div
                  key={index}
                  onClick={(e) => handleDateClick(date, e)}
                  className={`relative cursor-pointer transition-all duration-300 border border-border/50 rounded-xl hover:shadow-md hover:scale-105 ${
                    !isCurrentMonth ? "opacity-40" : ""
                  } ${isToday ? "ring-2 ring-accent shadow-lg" : ""} ${
                    isExpanded
                      ? "bg-muted/50 shadow-lg scale-105 z-10"
                      : "hover:bg-muted/30"
                  } ${isExpanded ? "min-h-[160px] p-4" : "min-h-[80px] p-3"}`}
                >
                  {/* Date Number */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`text-sm font-medium ${
                        isToday
                          ? "bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center"
                          : holiday
                          ? "text-red-600 font-bold"
                          : weekend
                          ? "text-red-500"
                          : "text-foreground"
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {isExpanded && isCurrentMonth && user?.role !== "TEKNISI" && (
                      <div
                        data-dialog-trigger
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CreateScheduleDialog
                          selectedDate={dateStr}
                          onScheduleCreated={handleScheduleCreated}
                          trigger={
                            <button
                              className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors shadow-md"
                              title="Tambah jadwal"
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M12 5v14M5 12h14" />
                              </svg>
                            </button>
                          }
                        />
                      </div>
                    )}
                  </div>

                  {holiday && (
                    <div className="absolute inset-0 bg-red-500/10 rounded-xl pointer-events-none" />
                  )}
                  {weekend && !holiday && (
                    <div className="absolute inset-0 bg-red-500/5 rounded-xl pointer-events-none" />
                  )}

                  {holiday && isCurrentMonth && (
                    <div
                      className={`text-xs text-red-600 leading-tight mt-1 ${
                        isExpanded ? "" : "truncate"
                      }`}
                    >
                      {isExpanded
                        ? holiday.holiday_name
                        : holiday.holiday_name.length > 20
                        ? `${holiday.holiday_name.slice(0, 20)}...`
                        : holiday.holiday_name}
                    </div>
                  )}

                  {dateSchedules.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {dateSchedules
                        .slice(0, isExpanded ? 10 : 2)
                        .map((schedule) => (
                          <div
                            key={schedule.id}
                            onClick={
                              isExpanded
                                ? (e) =>
                                    handleScheduleClick(
                                      schedule.id,
                                      isExpanded,
                                      e
                                    )
                                : undefined
                            }
                            className={`text-xs p-2 rounded-xl bg-accent/15 text-accent-foreground transition-colors ${
                              isExpanded
                                ? "cursor-pointer hover:bg-accent/25"
                                : "cursor-default"
                            }`}
                            title={
                              isExpanded
                                ? "Klik untuk melihat detail"
                                : "Expand tanggal untuk melihat detail"
                            }
                          >
                            <div className="capitalize font-medium truncate">
                              {schedule.title}
                            </div>
                            {isExpanded && (
                              <>
                                <div className="text-[10px] opacity-75">
                                  {formatIndonesiaTime(schedule.start)}
                                  {" - "}
                                  {schedule.end &&
                                    formatIndonesiaTime(schedule.end)}
                                </div>
                                <p className="capitalize text-xs">
                                  {schedule.technician.full_name}
                                </p>
                              </>
                            )}
                          </div>
                        ))}
                      {!isExpanded && dateSchedules.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dateSchedules.length - 2} lainnya
                        </div>
                      )}
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {formatDate(date)}
                      </div>
                      {dateSchedules.length === 0 && (
                        <div className="text-xs text-muted-foreground opacity-60">
                          Klik + untuk menambah jadwal
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border p-4 bg-muted/20 rounded-b-xl">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent rounded-full shadow-sm"></div>
              <span>Hari Ini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/20 border border-red-500 rounded shadow-sm"></div>
              <span className="text-red-600 ">Hari Libur Nasional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500/10 border border-red-500/30 rounded shadow-sm"></div>
              <span className="text-red-500">Akhir Pekan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-accent/10 border border-accent rounded shadow-sm"></div>
              <span className="text-accent">Jadwal Dijadwalkan</span>
            </div>
          </div>
        </div>
        {/* Holidays Section */}
        {holidays.length > 0 && (
          <div className="border-t border-border p-4">
            <h3 className="font-semibold text-foreground mb-3 text-sm">
              Hari Libur Nasional {months[currentDate.getMonth()]}{" "}
              {currentDate.getFullYear()}
            </h3>
            <div className="space-y-2">
              {holidays
                .filter((holiday) => {
                  const holidayDate = new Date(holiday.holiday_date);
                  const localHolidayDate = new Date(
                    holidayDate.getFullYear(),
                    holidayDate.getMonth(),
                    holidayDate.getDate()
                  );
                  return (
                    localHolidayDate.getMonth() === currentDate.getMonth() &&
                    localHolidayDate.getFullYear() === currentDate.getFullYear()
                  );
                })
                .map((holiday, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-muted/30 rounded-lg shadow-sm"
                  >
                    <span className="font-medium text-foreground text-sm">
                      {holiday.holiday_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(holiday.holiday_date).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                ))}
              {holidays.filter((holiday) => {
                const holidayDate = new Date(holiday.holiday_date);
                const localHolidayDate = new Date(
                  holidayDate.getFullYear(),
                  holidayDate.getMonth(),
                  holidayDate.getDate()
                );
                return (
                  localHolidayDate.getMonth() === currentDate.getMonth() &&
                  localHolidayDate.getFullYear() === currentDate.getFullYear()
                );
              }).length === 0 && (
                <div className="text-center py-4 text-muted-foreground rounded-lg bg-muted/20">
                  Tidak ada hari libur nasional di bulan ini
                </div>
              )}
            </div>
          </div>
        )}
        <ScheduleDetailDialog
          scheduleId={selectedScheduleId}
          isOpen={isDetailDialogOpen}
          onClose={handleCloseDetailDialog}
        />
      </div>
    </AdminPanelLayout>
  );
};

export default IndonesianCalendar;
