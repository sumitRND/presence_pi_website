"use client";

import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import type { User, Attendance, FieldTrip } from "../types";

interface ModalProps {
  user: User;
  onClose: () => void;
}

export default function Modal({
  user,
  onClose,
}: ModalProps): React.JSX.Element {
  // --- State for filters ---
  const [searchDate, setSearchDate] = useState<string>("");
  const [modeFilter, setModeFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [filteredAttendances, setFilteredAttendances] = useState(
    user.attendances,
  );
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);

  useEffect(() => {
    const fetchFieldTrips = async () => {
      try {
        const response = await api.get(`/field-trips/${user.employeeNumber}`);
        if (response.success && response.data?.fieldTrips) {
          setFieldTrips(response.data.fieldTrips);
        }
      } catch (error) {
        console.error("Error fetching field trips:", error);
      }
    };

    fetchFieldTrips();
  }, [user.employeeNumber]);

  useEffect(() => {
    let filtered = user.attendances;

    // Filter by date
    if (searchDate) {
      filtered = filtered.filter((att) => {
        const attDate = new Date(att.date).toISOString().split("T")[0];
        return attDate === searchDate;
      });
    }

    // Robust filtering for Mode
    if (modeFilter !== "ALL") {
      filtered = filtered.filter((att) => {
        const isFieldTrip =
          att.locationType === "FIELDTRIP" ||
          (att.takenLocation &&
            att.takenLocation.toLowerCase().includes("field trip"));

        if (modeFilter === "FIELDTRIP") {
          return isFieldTrip;
        }
        if (modeFilter === "CAMPUS") {
          return !isFieldTrip;
        }
        return false;
      });
    }

    // Filter by type
    if (typeFilter !== "ALL") {
      filtered = filtered.filter((att) => {
        if (typeFilter === "FULL_DAY") return att.isFullDay;
        if (typeFilter === "HALF_DAY") return att.isHalfDay;
        if (typeFilter === "IN_PROGRESS") return !att.isCheckedOut;
        return false;
      });
    }

    setFilteredAttendances(filtered);
  }, [searchDate, modeFilter, typeFilter, user.attendances]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
      onClose();
    }
  };

  const getSessionColor = (sessionType?: string) => {
    if (sessionType === "FN") return "#17a2b8";
    if (sessionType === "AF") return "#ffc107";
    return "#6c757d";
  };

  const getAttendanceTypeLabel = (att: Attendance) => {
    if (!att.isCheckedOut) return "In Progress";
    if (att.isFullDay) return "Full Day";
    if (att.isHalfDay) return "Half Day";
    return "N/A";
  };

  const getAttendanceTypeColor = (att: Attendance) => {
    if (!att.isCheckedOut) return "#ffc107";
    if (att.isFullDay) return "#28a745";
    if (att.isHalfDay) return "#17a2b8";
    return "#6c757d";
  };

  const clearFilters = () => {
    setSearchDate("");
    setModeFilter("ALL");
    setTypeFilter("ALL");
  };

  const areFiltersActive =
    searchDate !== "" || modeFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="modal-title">{user.username} - Attendance Details</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body p-6 flex flex-col gap-6">
          <div className="modal-info leading-relaxed text-base text-gray-600 bg-gray-50 p-4 rounded-md">
            <strong>Employee Number:</strong> {user.employeeNumber}
            <br />
            <strong>Employee Class:</strong> {user.empClass}
            <br />
            <strong>Projects:</strong>{" "}
            {user.projects.map((p) => p.projectCode).join(", ")}
            <br />
          </div>

          {user.monthlyStatistics && (
            <div className="stats-summary card bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="mt-0 text-xl text-gray-800 border-b-2 border-blue-500 inline-block pb-1">
                Monthly Summary
              </h3>
              <div className="stats-row flex justify-around text-center mt-4">
                <div className="stat-item flex flex-col items-center text-lg">
                  <strong className="text-gray-700">Total Days:</strong>{" "}
                  <span className="font-semibold text-blue-600 mt-1">
                    {user.monthlyStatistics.totalDays.toFixed(1)}
                  </span>
                </div>
                <div className="stat-item flex flex-col items-center text-lg">
                  <strong className="text-gray-700">Full Days:</strong>{" "}
                  <span className="font-semibold text-blue-600 mt-1">
                    {user.monthlyStatistics.fullDays}
                  </span>
                </div>
                <div className="stat-item flex flex-col items-center text-lg">
                  <strong className="text-gray-700">Half Days:</strong>{" "}
                  <span className="font-semibold text-blue-600 mt-1">
                    {user.monthlyStatistics.halfDays}
                  </span>
                </div>
              </div>
            </div>
          )}

          <h3 className="section-title mt-0 text-xl text-gray-800 border-b-2 border-blue-500 inline-block pb-1">
            Attendance Records
          </h3>

          {/* --- Filters Section --- */}
          <div className="search-container flex items-end gap-6 flex-wrap">
            <div className="form-group">
              <label htmlFor="dateSearch">Filter by Date:</label>
              <input
                id="dateSearch"
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="date-search-input p-3 border border-gray-300 rounded-md text-base w-full"
              />
            </div>
            <div className="form-group flex-grow">
              <label htmlFor="modeFilter">Filter by Mode:</label>
              <select
                id="modeFilter"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value)}
                className="date-search-input p-3 border border-gray-300 rounded-md text-base w-full"
              >
                <option value="ALL">All Modes</option>
                <option value="CAMPUS">Campus</option>
                <option value="FIELDTRIP">Field Trip</option>
              </select>
            </div>
            <div className="form-group flex-grow">
              <label htmlFor="typeFilter">Filter by Type:</label>
              <select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="date-search-input p-3 border border-gray-300 rounded-md text-base w-full"
              >
                <option value="ALL">All Types</option>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
            {areFiltersActive && (
              <button
                className="clear-search-btn p-3 bg-gray-500 text-white border-none rounded-md cursor-pointer text-base transition-colors duration-200 hover:bg-gray-600"
                onClick={clearFilters}
              >
                Clear
              </button>
            )}
          </div>

          {filteredAttendances.length === 0 ? (
            <p className="no-records-message text-center text-gray-500 italic p-8">
              No attendance records found matching the current filters.
            </p>
          ) : (
            <div className="attendance-list flex flex-col gap-6">
              {filteredAttendances.map((att, index: number) => {
                const checkInDate = new Date(att.checkinTime);
                const checkOutDate = att.checkoutTime
                  ? new Date(att.checkoutTime)
                  : null;

                // --- MODIFIED: Robust display logic for Mode ---
                const isFieldTrip =
                  att.locationType === "FIELDTRIP" ||
                  (att.takenLocation &&
                    att.takenLocation.toLowerCase().includes("field trip"));

                const getTripDescription = (att: Attendance) => {
                  if (!isFieldTrip) return null;

                  const attDate = new Date(att.date);
                  attDate.setHours(0, 0, 0, 0);

                  const trip = fieldTrips.find((trip) => {
                    const startDate = new Date(trip.startDate);
                    const endDate = new Date(trip.endDate);
                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(0, 0, 0, 0);
                    return attDate >= startDate && attDate <= endDate;
                  });

                  return trip?.description;
                };

                const tripDescription = getTripDescription(att);

                return (
                  <div
                    key={index}
                    className="attendance-item card bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col gap-4"
                  >
                    <div className="attendance-date text-xl font-semibold text-gray-800 border-b border-dashed border-gray-300 pb-2 mb-2">
                      {checkInDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </div>
                    <div className="attendance-details flex flex-col gap-3">
                      <div className="detail-row flex justify-between flex-wrap gap-4">
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Session:</strong>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getSessionColor(att.sessionType),
                              color: "white",
                            }}
                          >
                            {att.sessionType || "N/A"}
                          </span>
                        </div>
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Type:</strong>
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getAttendanceTypeColor(att),
                              color: "white",
                            }}
                          >
                            {getAttendanceTypeLabel(att)}
                          </span>
                        </div>
                      </div>
                      <div className="detail-row flex justify-between flex-wrap gap-4">
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Check-in:</strong>{" "}
                          <span>{checkInDate.toLocaleTimeString()}</span>
                        </div>
                        {checkOutDate && (
                          <div className="detail-item flex-1 min-w-[200px]">
                            <strong>Check-out:</strong>{" "}
                            <span>{checkOutDate.toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="detail-row flex justify-between flex-wrap gap-4">
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Mode:</strong>
                          <span
                            className={`status-badge ${
                              isFieldTrip
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isFieldTrip ? "Field Trip" : "Campus"}
                          </span>
                        </div>
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Status:</strong>
                          <span
                            className={`status-badge ${
                              att.isCheckedOut
                                ? "bg-green-500 text-white"
                                : "bg-yellow-400 text-gray-800"
                            }`}
                          >
                            {att.isCheckedOut ? "Completed" : "In Progress"}
                          </span>
                        </div>
                      </div>
                      <div className="detail-row flex justify-between flex-wrap gap-4">
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Location:</strong>{" "}
                          <span>
                            {att.location?.address || "Not specified"}
                          </span>
                        </div>
                      </div>
                      <div className="detail-row flex justify-between flex-wrap gap-4">
                        <div className="detail-item flex-1 min-w-[200px]">
                          <strong>Taken Department Location:</strong>{" "}
                          <span>{att.takenLocation || "Not specified"}</span>
                        </div>
                      </div>
                      {isFieldTrip && tripDescription && (
                        <div className="detail-row flex justify-between flex-wrap gap-4">
                          <div className="detail-item flex-1 min-w-[200px]">
                            <strong>Field Trip Description:</strong>{" "}
                            <span>{tripDescription}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="media-links flex flex-wrap gap-2.5 mt-4">
                      {att.photo && (
                        <a
                          href={att.photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="media-link py-2 px-3 rounded-md no-underline text-white font-medium transition-colors duration-200 text-sm bg-blue-500 hover:bg-blue-600"
                        >
                          📷 View Photo
                        </a>
                      )}
                      {att.audio && (
                        <a
                          href={att.audio.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="media-link py-2 px-3 rounded-md no-underline text-white font-medium transition-colors duration-200 text-sm bg-gray-500 hover:bg-gray-600"
                        >
                          🎵 Audio (
                          {att.audio.duration
                            ? att.audio.duration + "s"
                            : "unknown"}
                          )
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
