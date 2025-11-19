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
    <div
      className="modal"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal")) onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h2>Manage Field Trips - {user.username}</h2>
          <button className="text-2xl" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="field-trip-info mb-6">
            <p>
              <strong>Employee Number:</strong> {user.employeeNumber}
            </p>
            <p>
              <strong>Projects:</strong>{" "}
              {user.projects.map((p) => p.projectCode).join(", ")}
            </p>
          </div>

          {loading ? (
            <p>Loading field trips…</p>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="field-trip-form">
                <h3 className="text-lg font-bold mb-4">
                  Schedule New Field Trip
                </h3>
                <div className="form-row md:grid-cols-2 mb-4">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) =>
                        setNewTrip({ ...newTrip, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      type="date"
                      value={newTrip.endDate}
                      min={newTrip.startDate}
                      onChange={(e) =>
                        setNewTrip({ ...newTrip, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group mb-4">
                  <label htmlFor="description">Description (Optional)</label>
                  <input
                    id="description"
                    type="text"
                    value={newTrip.description}
                    onChange={(e) =>
                      setNewTrip({ ...newTrip, description: e.target.value })
                    }
                    placeholder="e.g., Client visit, Training"
                  />
                </div>
                <button className="btn" onClick={handleAddTrip}>
                  Schedule Field Trip
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">
                  Scheduled Field Trips
                </h3>
                {fieldTrips.length === 0 ? (
                  <div className="field-trip-empty">
                    No field trips scheduled
                  </div>
                ) : (
                  <div className="field-trip-list">
                    {fieldTrips.map((trip, index) => (
                      <div
                        key={index}
                        className={`field-trip-item ${
                          isCurrentlyOnTrip(trip) ? "active" : ""
                        }`}
                      >
                        <div className="field-trip-item-info">
                          <span className="field-trip-item-date">
                            {new Date(trip.startDate).toLocaleDateString()} -{" "}
                            {new Date(trip.endDate).toLocaleDateString()}
                          </span>
                          {trip.description && (
                            <span className="field-trip-item-description">
                              {trip.description}
                            </span>
                          )}
                          {isCurrentlyOnTrip(trip) && (
                            <span className="field-trip-item-status">
                              ACTIVE NOW
                            </span>
                          )}
                        </div>
                        <button
                          className="field-trip-remove-btn"
                          onClick={() => handleRemoveTrip(index)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button className="btn bg-gray-200" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn bg-black text-white"
                  onClick={handleSave}
                >
                  Save Field Trips
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
