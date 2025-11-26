"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import type { User, Holiday, Attendance } from "../types";

interface CalendarDay {
  date: string;
  isHoliday: boolean;
  isWeekend: boolean;
  description?: string;
  status: "present" | "absent" | "non-working" | null;
}

interface EmployeeCalendarModalProps {
  user: User;
  month: number;
  year: number;
  onClose: () => void;
}

export default function EmployeeCalendarModal({
  user,
  month,
  year,
  onClose,
}: EmployeeCalendarModalProps) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      const holidaysRes = await api.get(`/calendar/holidays?year=${year}`);
      const currentYearHolidays: Holiday[] = holidaysRes.success
        ? (holidaysRes as { holidays: Holiday[] }).holidays
        : [];

      const daysInMonth = new Date(year, month, 0).getDate();
      const calendarDays: CalendarDay[] = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month - 1, day));
        const dateStr = date.toISOString().split("T")[0]!;

        const holidayInfo = currentYearHolidays.find((h: Holiday) => {
          const holidayDate = new Date(h.date);
          return holidayDate.toISOString().split("T")[0] === dateStr;
        });

        const isHoliday = !!holidayInfo;
        const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

        const attendance = user.attendances.find((att: Attendance) => {
          const attDate = new Date(att.date);
          return attDate.toISOString().split("T")[0] === dateStr;
        });

        let status: CalendarDay["status"] = null;
        if (attendance) {
          status = "present";
        } else if (!isHoliday && !isWeekend && date <= today) {
          status = "absent";
        } else if (isHoliday || isWeekend) {
          status = "non-working";
        }

        calendarDays.push({
          date: dateStr,
          isHoliday,
          isWeekend,
          description: holidayInfo?.description,
          status,
        });
      }

      setCalendarData(calendarDays);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year, user]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const getDayClass = (day: CalendarDay) => {
    let classes = "h-20 border-r-2 border-b-2 border-black p-2 flex flex-col justify-between transition-colors";

    if (day.status === "present") classes += " bg-green-200";
    else if (day.status === "absent") classes += " bg-red-200";
    else if (day.isHoliday) classes += " bg-red-50";
    else if (day.isWeekend) classes += " bg-gray-100";
    else classes += " bg-white";

    return classes;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
      onClose();
    }
  };

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="modal-container neo-card w-full max-w-7xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="modal-header bg-white p-4 border-b-2 border-black flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-extrabold uppercase">{user.username}</h2>
            <p className="text-sm font-mono text-gray-500">
              {new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </div>
          <button className="neo-btn px-3 py-1 text-xl leading-none" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mb-4"></div>
              <p className="font-bold">Loading Calendar...</p>
            </div>
          ) : (
            <div className="border-2 border-black">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 bg-gray-200 border-b-2 border-black">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="p-2 text-center font-bold uppercase text-xs border-r-2 border-black last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 bg-black gap-[2px] border-black">
                {/* Gap trick for borders if needed, but here we use explicit borders on cells */}

                {Array.from({ length: firstDayOfMonth }, (_, i) => (
                  <div key={`empty-start-${i}`} className="bg-gray-50 border-r-2 border-b-2 border-black h-20 opacity-50" />
                ))}

                {calendarData.map((day) => {
                  const dateObj = new Date(day.date);
                  const dayOfMonth = dateObj.getUTCDate();
                  return (
                    <div key={day.date} className={getDayClass(day)}>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm">{dayOfMonth}</span>
                        {day.description && (
                          <span className="text-[10px] text-red-600 font-extrabold uppercase text-right leading-tight max-w-[60px]">
                            {day.description}
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold uppercase text-center mt-1">
                        {day.status === "present" && <span className="text-green-900">Present</span>}
                        {day.status === "absent" && <span className="text-red-900">Absent</span>}
                      </div>
                    </div>
                  );
                })}

                {/* Fill remaining cells to complete the grid row */}
                {Array.from({ length: (7 - ((firstDayOfMonth + calendarData.length) % 7)) % 7 }, (_, i) => (
                  <div key={`empty-end-${i}`} className="bg-gray-50 border-r-2 border-b-2 border-black h-20 opacity-50" />
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-xs font-bold uppercase justify-center flex-wrap">
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-200 border border-black"></div> Present</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-200 border border-black"></div> Absent</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-50 border border-black"></div> Holiday</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-100 border border-black"></div> Weekend</div>
          </div>
        </div>
      </div>
    </div>
  );
}