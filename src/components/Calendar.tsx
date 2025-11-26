// src/components/Calendar.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import type {
  CalendarDay,
  User,
  Holiday,
  Attendance,
  CalendarAttendance,
} from "../types";

interface ExtendedAttendance extends Attendance {
  username: string;
}

interface CalendarProps {
  month: number;
  year: number;
  users: User[];
  onDateClick?: (date: string, attendances: ExtendedAttendance[]) => void;
}

export default function Calendar({
  month,
  year,
  users,
  onDateClick,
}: CalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);

      const holidaysRes = await api.get(`/calendar/holidays?year=${year}`);
      const currentYearHolidays: Holiday[] = holidaysRes.success
        ? (holidaysRes.holidays || [])
        : [];

      const daysInMonth = new Date(year, month, 0).getDate();
      const calendarDays: CalendarDay[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month - 1, day));
        const dateStr = date.toISOString().split("T")[0];

        const holidayInfo = currentYearHolidays.find((h: Holiday) => {
          const holidayDate = new Date(h.date);
          return (
            holidayDate.getUTCFullYear() === date.getUTCFullYear() &&
            holidayDate.getUTCMonth() === date.getUTCMonth() &&
            holidayDate.getUTCDate() === date.getUTCDate()
          );
        });

        const isHoliday = !!holidayInfo;
        const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;

        const attendances: { [key: string]: CalendarAttendance } = {};

        users.forEach((user) => {
          const dayAttendance = user.attendances.find((att) => {
            const attDate = new Date(att.date);
            return (
              attDate.getUTCFullYear() === date.getUTCFullYear() &&
              attDate.getUTCMonth() === date.getUTCMonth() &&
              attDate.getUTCDate() === date.getUTCDate()
            );
          });

          if (dayAttendance) {
            attendances[user.employeeNumber] = {
              present: true,
              type:
                dayAttendance.attendanceType === "FULL_DAY"
                  ? "FULL_DAY"
                  : dayAttendance.attendanceType === "HALF_DAY"
                    ? "HALF_DAY"
                    : "IN_PROGRESS",
              username: user.username,
            };
          } else if (!isHoliday && !isWeekend) {
            attendances[user.employeeNumber] = {
              present: false,
              type: "ABSENT",
              username: user.username,
            };
          }
        });

        calendarDays.push({
          date: dateStr,
          isHoliday,
          isWeekend,
          description: holidayInfo?.description,
          attendances,
        });
      }

      setCalendarData(calendarDays);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [month, year, users]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

  const handleDateClick = async (dateStr: string) => {
    try {
      const attendancesRes = await api.get(
        `/pi/users-attendance?month=${month}&year=${year}&date=${dateStr}`,
      );
      if (attendancesRes.success) {
        const dateAttendances = attendancesRes.data.flatMap((user: User) =>
          user.attendances
            .filter(
              (att: Attendance) =>
                new Date(att.date).toISOString().split("T")[0] === dateStr,
            )
            .map((att: Attendance) => ({ ...att, username: user.username })),
        );
        onDateClick?.(dateStr, dateAttendances);
      }
    } catch (error) {
      console.error("Error fetching date attendances:", error);
    }
  };

  const getDayClass = (day: CalendarDay) => {
    let classes = "calendar-day relative group flex flex-col justify-between";

    if (day.isHoliday) classes += " bg-red-50";
    else if (day.isWeekend) classes += " bg-gray-50";
    else classes += " hover:bg-blue-50";

    return classes;
  };

  if (loading) {
    return (
      <div className="neo-card p-8 text-center font-bold">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
        Loading Calendar...
      </div>
    );
  }

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  return (
    <div className="mb-8">
      <div className="neo-card p-0 overflow-hidden">
        {/* Calendar Header */}
        <div className="p-4 bg-white border-b-2 border-black flex flex-col sm:flex-row justify-between items-center gap-2">
          <h2 className="text-xl font-extrabold uppercase tracking-tight">
            {new Date(year, month - 1).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="text-xs font-mono text-gray-500 font-bold bg-gray-100 px-2 py-1 border border-gray-300 rounded">
            Click a day to view details
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid border-0">
          {/* Weekdays Row */}
          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="calendar-days">
            {/* Empty days filler */}
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div
                key={`empty-${i}`}
                className="calendar-day bg-gray-100 cursor-default opacity-50"
              />
            ))}

            {/* Actual days */}
            {calendarData.map((day) => {
              const date = new Date(day.date);
              const dayOfMonth = date.getUTCDate();
              const presentCount = Object.values(day.attendances).filter(
                (a: CalendarAttendance) => a.present,
              ).length;
              const totalCount = Object.values(day.attendances).length;

              // Calculate percentage for progress bar
              const percentage =
                totalCount > 0 ? (presentCount / totalCount) * 100 : 0;

              // Determine progress bar color based on percentage
              let progressColor = "bg-green-500";
              if (percentage < 50) progressColor = "bg-red-500";
              else if (percentage < 80) progressColor = "bg-yellow-400";

              return (
                <div
                  key={day.date}
                  className={getDayClass(day)}
                  onClick={() => handleDateClick(day.date)}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className="font-bold text-sm">{dayOfMonth}</span>
                    {day.description && (
                      <span className="text-[10px] text-red-600 font-extrabold uppercase text-right leading-tight max-w-[80px]">
                        {day.description}
                      </span>
                    )}
                  </div>

                  {totalCount > 0 && (
                    <div className="mt-2 w-full">
                      <div className="flex justify-between text-[10px] font-mono font-bold mb-1">
                        <span>Attendance</span>
                        <span>{presentCount}/{totalCount}</span>
                      </div>
                      <div className="w-full bg-white h-2 border border-black rounded-none overflow-hidden">
                        <div
                          className={`h-full ${progressColor}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Visual indicator for weekend without description */}
                  {day.isWeekend && !day.description && !totalCount && (
                    <div className="mt-auto text-[10px] text-gray-400 font-bold uppercase text-center w-full">
                      Weekend
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}