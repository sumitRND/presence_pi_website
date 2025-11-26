"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../utils/api";
import AttendanceTable from "../../components/AttendanceTable";
import Calendar from "../../components/Calendar";
import Modal from "../../components/Modal";
import type { ApiResponse, User, UserAttendance } from "../../types";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalData, setModalData] = useState<User | null>(null);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    undefined,
  );
  const [dateAttendances, setDateAttendances] = useState<UserAttendance[]>([]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const endpoint = `/pi/users-attendance?month=${filters.month}&year=${filters.year}`;
      const response = await api.get<User[]>(endpoint);
      if (response.success) {
        setData({
          success: response.success,
          month: response.month,
          year: response.year,
          totalUsers: response.totalUsers ?? 0,
          data: response.data ?? [],
        });
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("Error connecting to server: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [user, filters.month, filters.year]);

  const handleDateSelect = (date: string, attendances: UserAttendance[]) => {
    setSelectedDate(date);
    setDateAttendances(attendances);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="neo-card mb-8 p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-xl font-bold uppercase">Filter View</h2>
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* 
                ISSUE FIX: Removed maxWidth constraint and added min-width/flex-grow 
                to ensure long month names like "September" fit properly.
            */}
            <div className="flex-grow md:flex-grow-0 min-w-[220px]">
              <select
                value={filters.month}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    month: parseInt(e.target.value),
                  }))
                }
                className="neo-input cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleDateString("en-US", {
                      month: "long",
                    })}
                  </option>
                ))}
              </select>
            </div>

            <div className="neo-input flex items-center justify-center font-bold bg-gray-100 w-24 border-2 border-black">
              {filters.year}
            </div>
          </div>
        </div>
      </div>

      <Calendar
        month={filters.month}
        year={filters.year}
        users={data?.data || []}
        onDateClick={handleDateSelect}
      />

      <AttendanceTable
        data={data}
        loading={loading}
        error={error}
        onViewDetails={(user) => setModalData(user)}
        selectedDate={selectedDate}
        dateAttendances={dateAttendances}
        loadData={loadData}
      />

      {modalData && (
        <Modal user={modalData} onClose={() => setModalData(null)} />
      )}
    </div>
  );
}