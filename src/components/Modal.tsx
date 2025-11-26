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

    if (searchDate) {
      filtered = filtered.filter((att) => {
        const attDate = new Date(att.date).toISOString().split("T")[0];
        return attDate === searchDate;
      });
    }

    if (modeFilter !== "ALL") {
      filtered = filtered.filter((att) => {
        const isFieldTrip =
          att.locationType === "FIELDTRIP" ||
          (att.takenLocation &&
            att.takenLocation.toLowerCase().includes("field trip"));

        if (modeFilter === "FIELDTRIP") return isFieldTrip;
        if (modeFilter === "CAMPUS") return !isFieldTrip;
        return false;
      });
    }

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

  const getAttendanceTypeLabel = (att: Attendance) => {
    if (!att.isCheckedOut) return "In Progress";
    if (att.isFullDay) return "Full Day";
    if (att.isHalfDay) return "Half Day";
    return "N/A";
  };

  const clearFilters = () => {
    setSearchDate("");
    setModeFilter("ALL");
    setTypeFilter("ALL");
  };

  const areFiltersActive =
    searchDate !== "" || modeFilter !== "ALL" || typeFilter !== "ALL";

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleBackdropClick}>
      <div className="modal-container neo-card p-0 flex flex-col max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="modal-header bg-white p-4 border-b-2 border-black flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-extrabold uppercase">{user.username}</h2>
            <p className="text-sm font-mono text-gray-500">Attendance Details</p>
          </div>
          <button className="neo-btn text-xl leading-none px-3" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body p-6 overflow-y-auto">
          {/* User Info Block */}
          <div className="bg-gray-50 border-2 border-black p-4 mb-6 font-mono text-sm">
            <div className="grid grid-cols-2 gap-2">
              <p><strong>ID:</strong> {user.employeeNumber}</p>
              <p><strong>Class:</strong> {user.empClass}</p>
              <p className="col-span-2"><strong>Projects:</strong> {user.projects.map((p) => p.projectCode).join(", ")}</p>
            </div>
          </div>

          {/* Monthly Stats */}
          {user.monthlyStatistics && (
            <div className="mb-8">
              <h3 className="text-lg font-bold uppercase mb-2">Monthly Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="border-2 border-black p-3 text-center">
                  <div className="text-xs uppercase font-bold text-gray-500">Total</div>
                  <div className="text-2xl font-bold">{user.monthlyStatistics.totalDays.toFixed(1)}</div>
                </div>
                <div className="border-2 border-black p-3 text-center bg-green-50">
                  <div className="text-xs uppercase font-bold text-gray-500">Full</div>
                  <div className="text-2xl font-bold">{user.monthlyStatistics.fullDays}</div>
                </div>
                <div className="border-2 border-black p-3 text-center bg-yellow-50">
                  <div className="text-xs uppercase font-bold text-gray-500">Half</div>
                  <div className="text-2xl font-bold">{user.monthlyStatistics.halfDays}</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="p-4 bg-gray-100 border-2 border-black mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="neo-input"
              />
              <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)} className="neo-input">
                <option value="ALL">All Modes</option>
                <option value="CAMPUS">Campus</option>
                <option value="FIELDTRIP">Field Trip</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="neo-input">
                <option value="ALL">All Types</option>
                <option value="FULL_DAY">Full Day</option>
                <option value="HALF_DAY">Half Day</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
            {areFiltersActive && (
              <button onClick={clearFilters} className="text-xs underline font-bold mt-2">Clear Filters</button>
            )}
          </div>

          {/* List */}
          {filteredAttendances.length === 0 ? (
            <div className="p-8 text-center italic border-2 border-dashed border-gray-300">
              No records found.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAttendances.map((att, index) => {
                const checkInDate = new Date(att.checkinTime);
                const checkOutDate = att.checkoutTime ? new Date(att.checkoutTime) : null;
                const isFieldTrip = att.locationType === "FIELDTRIP" || (att.takenLocation && att.takenLocation.toLowerCase().includes("field trip"));

                // Trip Description Logic (Simulated from existing component)
                let tripDescription = null;
                if (isFieldTrip) {
                  const attDate = new Date(att.date);
                  attDate.setHours(0, 0, 0, 0);
                  const trip = fieldTrips.find(t => {
                    const s = new Date(t.startDate); s.setHours(0, 0, 0, 0);
                    const e = new Date(t.endDate); e.setHours(0, 0, 0, 0);
                    return attDate >= s && attDate <= e;
                  });
                  tripDescription = trip?.description;
                }

                return (
                  <div key={index} className="border-2 border-black p-4 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] bg-white">
                    <div className="flex justify-between items-center border-b border-black pb-2 mb-3">
                      <span className="font-bold">
                        {checkInDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <div className="flex gap-2">
                        <span className={`badge ${isFieldTrip ? 'badge-green' : 'bg-gray-200'}`}>
                          {isFieldTrip ? "Field Trip" : "Campus"}
                        </span>
                        <span className={`badge ${att.isCheckedOut ? 'bg-black text-white' : 'badge-yellow'}`}>
                          {getAttendanceTypeLabel(att)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-bold block text-xs uppercase text-gray-500">Check In</span>
                        {checkInDate.toLocaleTimeString()}
                      </div>
                      <div>
                        <span className="font-bold block text-xs uppercase text-gray-500">Check Out</span>
                        {checkOutDate ? checkOutDate.toLocaleTimeString() : "--"}
                      </div>
                      <div className="col-span-2">
                        <span className="font-bold block text-xs uppercase text-gray-500">Location</span>
                        <span className="font-mono text-xs">{att.location?.address || att.takenLocation || "N/A"}</span>
                      </div>
                      {tripDescription && (
                        <div className="col-span-2 bg-yellow-50 p-2 border border-yellow-200 text-xs italic">
                          &quot;{tripDescription}&quot;
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-2">
                      {att.photo && (
                        <a href={att.photo.url} target="_blank" rel="noreferrer" className="neo-btn text-xs py-1 px-2">
                          📷 Photo
                        </a>
                      )}
                      {att.audio && (
                        <a href={att.audio.url} target="_blank" rel="noreferrer" className="neo-btn text-xs py-1 px-2">
                          🎵 Audio
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