"use client";

import { useState, useEffect } from "react";
import FieldTripModal from "./FieldTripModel";
import EmployeeCalendarModal from "./EmployeeCalendarModal";
import ModifyAttendanceModal from "./ModifyAttendanceModal";
import { api } from "../utils/api"; // Import the api client

import type { ApiResponse, User, FieldTrip, Attendance } from "../types";

interface AttendanceTableProps {
  data: ApiResponse | null;
  loading: boolean;
  error: string;
  onViewDetails: (user: User) => void;
  selectedDate?: string;
  dateAttendances?: (Attendance & { username: string })[];
  loadData: () => void; // For refreshing data
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

  if (loading) {
    return (
      <div className="users-table">
        <div className="table-header">
          <h2>Employee Attendance Records</h2>
        </div>
        <div className="loading">Loading…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-table">
        <div className="table-header">
          <h2>Employee Attendance Records</h2>
        </div>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!data || !data.data) {
    return (
      <div className="users-table">
        <div className="table-header">
          <h2>Employee Attendance Records</h2>
        </div>
        <div className="loading">No data available</div>
      </div>
    );
  }

  const absentEmployees = getAbsentEmployees();

  return (
    <>
      {/* Daily Attendance Section */}
      {selectedDate && dateAttendances && dateAttendances.length > 0 && (
        <div className="users-table mb-6">
          <div className="table-header">
            <h2>
              Attendance for{" "}
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <span className="font-bold">
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
                    className="card"
                    style={{
                      minWidth: "250px",
                      width: "250px",
                      flexShrink: 0,
                    }}
                  >
                    <div className="font-bold mb-3 pb-2 border-b-2 border-black">
                      {att.username}
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="font-bold text-sm mb-1">Check-in:</div>
                        <div className="text-green-600 font-semibold">
                          {formatTime(att.checkinTime)}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm mb-1">
                          Check-out:
                        </div>
                        <div
                          className={
                            att.checkoutTime
                              ? "text-red-600 font-semibold"
                              : "text-gray-500 italic"
                          }
                        >
                          {formatTime(att.checkoutTime)}
                        </div>
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
        <div className="users-table mb-6">
          <div className="table-header">
            <h2>
              Absent for{" "}
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <span className="font-bold">
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
                    className="card bg-red-50"
                    style={{
                      minWidth: "250px",
                      width: "250px",
                      flexShrink: 0,
                    }}
                  >
                    <div className="font-bold mb-3 pb-2 border-b-2 border-red-500">
                      {user.username}
                    </div>
                    <div className="space-y-2">
                      <div>
                        <div className="font-bold text-sm mb-1">
                          Employee Number:
                        </div>
                        <div className="text-gray-700">
                          {user.employeeNumber}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-sm mb-1">
                          Project ID:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {user.projects.map((p, pIndex) => (
                            <span
                              key={`${p.projectCode}-${pIndex}`}
                              className="project-tag text-xs"
                            >
                              {p.projectCode}
                            </span>
                          ))}
                        </div>
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
          <div className="users-table mb-6">
            <div className="table-header">
              <h2 className="text-green-600">
                Absent Employees on{" "}
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center text-green-600 font-semibold">
                🎉 No employees were absent on this day!
              </div>
            </div>
          </div>
        )}

      {/* Main Attendance Table */}
      <div className="users-table">
        <div className="table-header">
          <h2>Employee Attendance Records</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search...."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="date-search-input"
                style={{ minWidth: "250px" }}
              />
            </div>
            <div className="header-info">
              <span>
                Month: {data.month}/{data.year}
              </span>
              <span>Total Users: {data.totalUsers}</span>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Employee Number</th>
              <th>Employee Username</th>
              <th>Projects</th>
              <th>Monthly Stats</th>
              <th>Field Trip Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user: User, index: number) => (
                <tr key={user.employeeNumber || index} className="user-row">
                  <td>{user.employeeNumber}</td>
                  <td>{user.username}</td>
                  <td>
                    <div className="project-list">
                      {user.projects.map((p, pIndex) => (
                        <span
                          key={`${p.projectCode}-${pIndex}`}
                          className="project-tag"
                        >
                          {p.projectCode}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <div className="monthly-stats">
                      <span
                        title="Full Days"
                        className="stat-badge full-days"
                      >
                        {user.monthlyStatistics.fullDays}F
                      </span>
                      <span
                        title="Half Days"
                        className="stat-badge half-days"
                      >
                        {user.monthlyStatistics.halfDays}H
                      </span>
                      <span
                        title="Adjusted Total"
                        className="stat-badge total-days"
                      >
                        {user.monthlyStatistics.totalDays}T
                      </span>
                      {user.monthlyStatistics.addedDays > 0 && (
                        <span
                          title="Added Days"
                          className="stat-badge added-days"
                        >
                          {user.monthlyStatistics.addedDays}A
                        </span>
                      )}
                      {user.monthlyStatistics.removedDays > 0 && (
                        <span
                          title="Removed Days"
                          className="stat-badge removed-days"
                        >
                          {user.monthlyStatistics.removedDays}R
                        </span>
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="field-trip-status">
                      <button
                        className="manage-trips-btn"
                        onClick={() => setFieldTripModalUser(user)}
                      >
                        Manage
                      </button>
                    </div>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button
                        className="calendar-btn ml-2"
                        onClick={() => setCalendarModalUser(user)}
                      >
                        📅
                      </button>
                      <button
                        className="view-btn"
                        onClick={() => onViewDetails(user)}
                      >
                        View
                      </button>
                      <button
                        className="modify-btn"
                        onClick={() => openModifyModal(user)}
                      >
                        Modify
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="no-records-message">
                  No employees found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
          onSave={async (
            employeeNumber: string,
            fieldTrips: FieldTrip[],
          ) => {
            try {
              console.log(
                "Saving field trips for:",
                employeeNumber,
                fieldTrips,
              );
              // NOTE: You might want to call loadData() here as well if saving a field trip should refresh the main table data.
            } catch (error) {
              console.error("Error saving field trips:", error);
              alert("Failed to save field trips.");
            }
          }}
        />
      )}

      {modifyModalUser && (
        <ModifyAttendanceModal
          user={modifyModalUser}
          onClose={() => setModifyModalUser(null)}
          onSave={async (employeeNumber, date, status, comment) => {
            try {
              // Use the api client instead of manual fetch
              const result = await api.post("/pi/modify-attendance", {
                employeeNumber,
                date,
                status,
                comment,
              });

              if (result.success) {
                alert("Attendance modified successfully");
                setModifyModalUser(null);
                loadData(); // Trigger data refresh in the parent component
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
