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
        ? (holidaysRes as any).holidays
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
    let classes = "calendar-day";
    if (day.isHoliday) classes += " holiday";
    if (day.isWeekend) classes += " weekend";
    if (day.status === "present") classes += " present";
    if (day.status === "absent") classes += " absent";
    return classes;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="modal-backdrop" onClick={handleBackdropClick}>
        <div className="modal-container">
          <div className="modal-header">
            <h2>{user.username} - Current Month Calendar</h2>
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="loading">Loading calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>{user.username} - Monthly Calendar</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="p-6">
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
                const dateObj = new Date(day.date);
                const dayOfMonth = dateObj.getUTCDate();
                return (
                  <div key={day.date} className={getDayClass(day)}>
                    <div className="day-number">{dayOfMonth}</div>
                    {day.description && (
                      <div className="day-holiday">{day.description}</div>
                    )}
                    <div className="day-status">
                      {day.status === "present" && "Present"}
                      {day.status === "absent" && "Absent"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
