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
        ? holidaysRes.holidays
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
    let classes = "calendar-day";

    if (day.isHoliday) classes += " holiday";
    if (day.isWeekend) classes += " weekend";

    return classes;
  };

  if (loading) {
    return <div className="calendar-loading">Loading calendar...</div>;
  }

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  return (
    <div
      className="calendar"
      style={{ maxWidth: "900px", margin: "0 auto", marginBottom: "30px" }}
    >
      <div className="calendar-header">
        <h2>
          {new Date(year, month - 1).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="calendar-days">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="calendar-day empty" />
          ))}

          {calendarData.map((day) => {
            const date = new Date(day.date);
            const dayOfMonth = date.getUTCDate();
            const presentCount = Object.values(day.attendances).filter(
              (a: CalendarAttendance) => a.present,
            ).length;
            const totalCount = Object.values(day.attendances).length;

            return (
              <div
                key={day.date}
                className={getDayClass(day)}
                onClick={() => handleDateClick(day.date)}
              >
                <div className="day-number">{dayOfMonth}</div>
                {day.description && (
                  <div className="day-holiday">{day.description}</div>
                )}
                {totalCount > 0 && (
                  <div className="day-attendance">
                    <span>
                      {presentCount}/{totalCount}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
