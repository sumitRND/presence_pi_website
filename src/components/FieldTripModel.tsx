"use client";

import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { User, FieldTrip } from "../types";

interface FieldTripModalProps {
  user: User;
  onClose: () => void;
  onSave: (employeeNumber: string, fieldTrips: FieldTrip[]) => void;
}

export default function FieldTripModal({
  user,
  onClose,
  onSave,
}: FieldTripModalProps) {
  const [fieldTrips, setFieldTrips] = useState<FieldTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTrip, setNewTrip] = useState<FieldTrip>({
    startDate: "",
    endDate: "",
    description: "",
  });

  useEffect(() => {
    const fetchFieldTrips = async () => {
      try {
        const response = await api.get(`/field-trips/${user.employeeNumber}`);

        if (response.success && response.data?.fieldTrips) {
          setFieldTrips(
            response.data.fieldTrips.map((trip: FieldTrip) => ({
              startDate: trip.startDate.split("T")[0],
              endDate: trip.endDate.split("T")[0],
              description: trip.description || "",
            })),
          );
        } else {
          setFieldTrips([]);
        }
      } catch (err) {
        console.error("Error fetching field trips:", err);
        setFieldTrips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldTrips();
  }, [user.employeeNumber]);

  const handleAddTrip = () => {
    if (newTrip.startDate && newTrip.endDate) {
      const startDate = new Date(newTrip.startDate);
      const endDate = new Date(newTrip.endDate);

      if (startDate > endDate) {
        alert("End date must be after start date");
        return;
      }

      setFieldTrips([...fieldTrips, { ...newTrip }]);
      setNewTrip({ startDate: "", endDate: "", description: "" });
    } else {
      alert("Please fill in both start and end dates");
    }
  };

  const handleRemoveTrip = (index: number) => {
    setFieldTrips(fieldTrips.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const response = await api.put("/field-trips", {
        employeeNumber: user.employeeNumber,
        fieldTripDates: fieldTrips,
      });

      if (response.success) {
        alert("Field trips saved successfully!");
        onSave(user.employeeNumber, fieldTrips);
        onClose();
      } else {
        throw new Error(response.error || "Failed to save field trips");
      }
    } catch (error) {
      console.error("Error saving field trips:", error);
      alert("Failed to save field trips. Please try again.");
    }
  };

  const isCurrentlyOnTrip = (trip: FieldTrip): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return today >= startDate && today <= endDate;
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => {
      if ((e.target as HTMLElement).classList.contains("modal-backdrop")) onClose();
    }}>
      <div className="modal-container neo-card p-0 flex flex-col max-h-[90vh]">
        <div className="modal-header">
          <h2>Manage Field Trips</h2>
          <button className="neo-btn px-2 py-1 text-lg" onClick={onClose}>×</button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="bg-gray-100 p-4 border-2 border-black mb-6 font-mono text-sm">
            <p><strong>User:</strong> {user.username} ({user.employeeNumber})</p>
            <p><strong>Projects:</strong> {user.projects.map((p) => p.projectCode).join(", ")}</p>
          </div>

          {loading ? (
            <div className="text-center p-4">Loading field trips…</div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="border-2 border-dashed border-black p-4">
                <h3 className="text-lg font-bold mb-4 uppercase">Schedule New Trip</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="form-group">
                    <label className="block text-sm font-bold mb-1">Start Date</label>
                    <input
                      className="neo-input"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="block text-sm font-bold mb-1">End Date</label>
                    <input
                      className="neo-input"
                      type="date"
                      value={newTrip.endDate}
                      min={newTrip.startDate}
                      onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label className="block text-sm font-bold mb-1">Description</label>
                  <input
                    className="neo-input"
                    type="text"
                    value={newTrip.description}
                    onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })}
                    placeholder="e.g., Client visit, Training"
                  />
                </div>
                <button className="neo-btn neo-btn-primary w-full" onClick={handleAddTrip}>
                  Add Trip
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3 uppercase">Scheduled Trips</h3>
                {fieldTrips.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 text-center italic">
                    No field trips scheduled
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {fieldTrips.map((trip, index) => {
                      const active = isCurrentlyOnTrip(trip);
                      return (
                        <div key={index} className={`flex justify-between items-center p-3 border-2 border-black ${active ? 'bg-blue-50 border-blue-500' : 'bg-white'}`}>
                          <div>
                            <div className="font-mono font-bold">
                              {new Date(trip.startDate).toLocaleDateString()} &rarr; {new Date(trip.endDate).toLocaleDateString()}
                            </div>
                            {trip.description && <div className="text-sm text-gray-600">{trip.description}</div>}
                            {active && <span className="badge bg-blue-500 text-white mt-1">Active</span>}
                          </div>
                          <button className="neo-btn neo-btn-danger text-xs py-1 px-2" onClick={() => handleRemoveTrip(index)}>
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t-2 border-black">
                <button className="neo-btn" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="neo-btn bg-black text-white hover:bg-gray-800"
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}