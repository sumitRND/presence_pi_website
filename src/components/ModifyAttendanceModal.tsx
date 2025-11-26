"use client";

import { useState, useEffect } from "react";
import type { User, ModifiedAttendance } from "../types";
import { api } from "../utils/api";

interface ModifyAttendanceModalProps {
  user: User;
  onClose: () => void;
  onSave: (
    employeeNumber: string,
    date: string,
    status: "ADDED" | "REMOVED",
    comment: string,
  ) => void;
}

export default function ModifyAttendanceModal({
  user,
  onClose,
  onSave,
}: ModifyAttendanceModalProps) {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<"ADDED" | "REMOVED">("ADDED");
  const [comment, setComment] = useState("");
  const [modifiedAttendances, setModifiedAttendances] = useState<ModifiedAttendance[]>([]);

  useEffect(() => {
    const fetchModifiedAttendances = async () => {
      const response = await api.get(
        `/pi/modified-attendance/${user.employeeNumber}`,
      );
      if (response.success) {
        setModifiedAttendances(response.data);
      }
    };
    fetchModifiedAttendances();
  }, [user.employeeNumber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.employeeNumber, date, status, comment);
  };

  const handleDelete = async (id: number) => {
    const response = await api.delete(`/pi/modified-attendance/${id}`);
    if (response.success) {
      setModifiedAttendances(
        modifiedAttendances.filter((att) => att.id !== id),
      );
    }
  };

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => {
      if ((e.target as HTMLElement).classList.contains("modal-backdrop")) onClose();
    }}>
      <div className="modal-container neo-card p-0 flex flex-col max-h-[90vh] w-[550px]">
        {/* Header */}
        <div className="modal-header bg-white p-4 border-b-2 border-black flex justify-between items-center">
          <h2 className="text-xl font-extrabold uppercase">Modify Attendance</h2>
          <button onClick={onClose} className="neo-btn px-2 py-1 leading-none text-xl">
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <p className="mb-4 font-mono text-sm bg-gray-100 p-2 border border-black">
            Employee: <strong>{user.username}</strong> ({user.employeeNumber})
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-group">
              <label htmlFor="date" className="block text-sm font-bold uppercase mb-1">Date</label>
              <input
                className="neo-input"
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="status" className="block text-sm font-bold uppercase mb-1">Action</label>
              <select
                className="neo-input"
                id="status"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "ADDED" | "REMOVED")
                }
              >
                <option value="ADDED">Add Attendance (Mark Present)</option>
                <option value="REMOVED">Remove Attendance (Mark Absent)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="comment" className="block text-sm font-bold uppercase mb-1">Reason / Comment</label>
              <textarea
                className="neo-input"
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                required
                placeholder="Required for audit trail..."
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 mt-2">
              <button type="button" onClick={onClose} className="neo-btn bg-gray-200">
                Cancel
              </button>
              <button type="submit" className="neo-btn neo-btn-primary">
                Save Change
              </button>
            </div>
          </form>

          {modifiedAttendances.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-black">
              <h3 className="text-lg font-bold uppercase mb-4">Modification History</h3>
              <div className="flex flex-col gap-3">
                {modifiedAttendances.map((att) => (
                  <div key={att.id} className="border-2 border-black p-3 bg-yellow-50 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-sm">
                          {new Date(att.date).toLocaleDateString()}
                        </div>
                        <span className={`text-xs font-bold px-1 border border-black ${att.status === 'ADDED' ? 'bg-green-300' : 'bg-red-300'}`}>
                          {att.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(att.id)}
                        className="neo-btn neo-btn-danger text-xs py-1 px-2"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-xs font-mono text-gray-700 bg-white p-2 border border-gray-300">
                      &quot;{att.comment}&quot;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}