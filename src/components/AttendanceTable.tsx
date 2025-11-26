"use client";

import { useState, useEffect } from "react";
import FieldTripModal from "./FieldTripModel";
import EmployeeCalendarModal from "./EmployeeCalendarModal";
import ModifyAttendanceModal from "./ModifyAttendanceModal";
import { api } from "../utils/api";

import type { ApiResponse, User, Attendance } from "../types";

interface AttendanceTableProps {
  data: ApiResponse | null;
  loading: boolean;
  error: string;
  onViewDetails: (user: User) => void;
  selectedDate?: string;
  dateAttendances?: (Attendance & { username: string })[];
  loadData: () => void;
}

export default function AttendanceTable({
  data,
  loading,
  error,
  onViewDetails,
  selectedDate,
  dateAttendances,
  loadData,
}: AttendanceTableProps) {
  const [fieldTripModalUser, setFieldTripModalUser] = useState<User | null>(
    null,
  );
  const [calendarModalUser, setCalendarModalUser] = useState<User | null>(null);
  const [modifyModalUser, setModifyModalUser] = useState<User | null>(null);

  const openModifyModal = (user: User) => {
    setModifyModalUser(user);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    if (data?.data) {
      const lowercasedQuery = searchQuery.toLowerCase().trim();
      if (!lowercasedQuery) {
        setFilteredUsers(data.data);
      } else {
        const filtered = data.data.filter(
          (user) =>
            user.username.toLowerCase().includes(lowercasedQuery) ||
            user.employeeNumber
              .toString()
              .toLowerCase()
              .includes(lowercasedQuery),
        );
        setFilteredUsers(filtered);
      }
    }
  }, [searchQuery, data]);

  const formatTime = (timeString?: string) => {
    if (!timeString) return "Not recorded";
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAbsentEmployees = () => {
    if (!selectedDate || !data?.data) return [];

    const presentUsernames = new Set(
      dateAttendances?.map((att) => att.username) || [],
    );

    const date = new Date(selectedDate);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return data.data.filter((user) => {
      const hasAttendance = presentUsernames.has(user.username);
      return !hasAttendance && !isWeekend;
    });
  };

  // Loading / Error Wrappers styled as Neo Cards
  if (loading) {
    return (
      <div className="neo-card p-8 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
        <div className="font-bold text-lg">Loading Records...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="neo-card p-8 border-red-500 text-center">
        <div className="text-red-600 font-bold mb-2">Error</div>
        <div>{error}</div>
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className="neo-card p-8 text-center font-bold">No data available</div>
    );
  }

  const absentEmployees = getAbsentEmployees();

  return (
    <>
      {/* Daily Attendance Section */}
      {selectedDate && dateAttendances && dateAttendances.length > 0 && (
        <div className="neo-card mb-8">
          <div className="p-4 border-b-2 border-black flex justify-between items-center bg-gray-50 rounded-t-md">
            <h2 className="font-bold uppercase">
              Attendance for{" "}
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <span className="badge badge-green">
              Total Present: {dateAttendances.length}
            </span>
          </div>
          <div className="p-6">
            <div
              className="horizontal-scroll-container"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                width: "100%",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  paddingBottom: "1rem",
                  minWidth: "min-content",
                }}
              >
                {dateAttendances.map((att, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-black p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.25)]"
                    style={{
                      minWidth: "250px",
                      width: "250px",
                      flexShrink: 0,
                    }}
                  >
                    <div className="font-bold mb-3 pb-2 border-b-2 border-black text-lg">
                      {att.username}
                    </div>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">IN:</span>
                        <span className="text-green-700 bg-green-50 px-1 border border-green-200">
                          {formatTime(att.checkinTime)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">OUT:</span>
                        <span
                          className={
                            att.checkoutTime
                              ? "text-red-700 bg-red-50 px-1 border border-red-200"
                              : "text-gray-400"
                          }
                        >
                          {formatTime(att.checkoutTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Absent Employees Section */}
      {selectedDate && absentEmployees.length > 0 && (
        <div className="neo-card mb-8 border-red-900">
          <div className="p-4 border-b-2 border-black flex justify-between items-center bg-red-50 rounded-t-md">
            <h2 className="font-bold uppercase text-red-900">
              Absent List
            </h2>
            <span className="badge badge-red">
              Total Absent: {absentEmployees.length}
            </span>
          </div>
          <div className="p-6">
            <div
              className="horizontal-scroll-container"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                width: "100%",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  paddingBottom: "1rem",
                  minWidth: "min-content",
                }}
              >
                {absentEmployees.map((user, idx) => (
                  <div
                    key={idx}
                    className="bg-red-50 border-2 border-red-900 p-4"
                    style={{
                      minWidth: "250px",
                      width: "250px",
                      flexShrink: 0,
                    }}
                  >
                    <div className="font-bold mb-3 pb-2 border-b-2 border-red-900 text-lg">
                      {user.username}
                    </div>
                    <div className="space-y-2 font-mono text-xs">
                      <div>
                        <span className="font-bold">ID:</span> {user.employeeNumber}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.projects.map((p, pIndex) => (
                          <span
                            key={`${p.projectCode}-${pIndex}`}
                            className="bg-white border border-black px-1"
                          >
                            {p.projectCode}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDate &&
        absentEmployees.length === 0 &&
        dateAttendances &&
        dateAttendances.length > 0 && (
          <div className="neo-card mb-8 bg-green-50 border-green-800 p-6 text-center">
            <h2 className="text-green-800 font-bold uppercase text-xl">
              🎉 Full Attendance Recorded!
            </h2>
          </div>
        )}

      {/* Main Attendance Table */}
      <div className="neo-card">
        <div className="p-4 border-b-2 border-black flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold uppercase">Employee Directory</h2>

          <div className="flex items-center gap-4 flex-wrap w-full md:w-auto">
            <div className="flex-grow md:flex-grow-0">
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="neo-input"
              />
            </div>
            <div className="text-sm font-mono border-2 border-black p-2 bg-gray-100">
              Count: {data.totalUsers}
            </div>
          </div>
        </div>

        <div className="neo-table-container border-0 rounded-none">
          <table className="neo-table">
            <thead>
              <tr>
                <th>Emp. ID</th>
                <th>Username</th>
                <th>Projects</th>
                <th>Monthly Stats</th>
                <th>Field Trip</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user: User, index: number) => (
                  <tr key={user.employeeNumber || index}>
                    <td>{user.employeeNumber}</td>
                    <td className="font-bold">{user.username}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {user.projects.map((p, pIndex) => (
                          <span
                            key={`${p.projectCode}-${pIndex}`}
                            className="text-xs border border-black px-1 bg-gray-50"
                          >
                            {p.projectCode}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <div className="flex gap-1 justify-center">
                        <span title="Full Days" className="badge badge-green">
                          {user.monthlyStatistics.fullDays}F
                        </span>
                        <span title="Half Days" className="badge badge-yellow">
                          {user.monthlyStatistics.halfDays}H
                        </span>
                        <span title="Adjusted Total" className="badge bg-white">
                          {user.monthlyStatistics.totalDays}T
                        </span>
                      </div>
                    </td>

                    <td>
                      <button
                        className="neo-btn text-xs py-1 px-2"
                        onClick={() => setFieldTripModalUser(user)}
                      >
                        Manage
                      </button>
                    </td>

                    <td>
                      <div className="flex gap-2 justify-center">
                        <button
                          className="neo-btn text-xs py-1 px-2"
                          onClick={() => setCalendarModalUser(user)}
                          title="View Calendar"
                        >
                          📅
                        </button>
                        <button
                          className="neo-btn neo-btn-primary text-xs py-1 px-2"
                          onClick={() => onViewDetails(user)}
                        >
                          View
                        </button>
                        <button
                          className="neo-btn text-xs py-1 px-2"
                          onClick={() => openModifyModal(user)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center p-8 italic text-gray-500">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {calendarModalUser && data && (
        <EmployeeCalendarModal
          user={calendarModalUser}
          month={data.month!}
          year={data.year!}
          onClose={() => setCalendarModalUser(null)}
        />
      )}

      {fieldTripModalUser && (
        <FieldTripModal
          user={fieldTripModalUser}
          onClose={() => setFieldTripModalUser(null)}
          onSave={async (employeeNumber, fieldTrips) => {
            // Logic kept as is
            try {
              console.log("Saving", employeeNumber, fieldTrips);
            } catch (e) { console.error(e) }
          }}
        />
      )}

      {modifyModalUser && (
        <ModifyAttendanceModal
          user={modifyModalUser}
          onClose={() => setModifyModalUser(null)}
          onSave={async (employeeNumber, date, status, comment) => {
            try {
              const result = await api.post("/pi/modify-attendance", {
                employeeNumber,
                date,
                status,
                comment,
              });

              if (result.success) {
                alert("Attendance modified successfully");
                setModifyModalUser(null);
                loadData();
              } else {
                alert(`Error: ${result.error}`);
              }
            } catch (error) {
              console.error("Failed to modify attendance:", error);
              alert("An error occurred while modifying attendance.");
            }
          }}
        />
      )}
    </>
  );
}