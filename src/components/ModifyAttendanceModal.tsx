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
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          width: 500px;
          max-width: 90%;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
        .form-group {
          margin-bottom: 15px;
        }
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
        .cancel-btn,
        .save-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .cancel-btn {
          background-color: #eee;
        }
        .save-btn {
          background-color: #007bff;
          color: white;
        }
        .modified-attendance-list {
          margin-top: 20px;
        }
        .modified-attendance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        .delete-btn {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Modify Attendance for {user.username}</h2>
            <button onClick={onClose} className="close-button">
              &times;
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="date">Date</label>
                <input
                  type="date"
                  id="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ADDED" | "REMOVED")
                  }
                >
                  <option value="ADDED">Add Attendance</option>
                  <option value="REMOVED">Remove Attendance</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="comment">Comment</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save
              </button>
            </div>
          </form>
          <div className="modified-attendance-list">
            <h3>Previously Modified Attendance</h3>
            {modifiedAttendances.map((att) => (
              <div key={att.id} className="modified-attendance-item">
                <div>
                  <p>
                    <strong>Date:</strong> {new Date(att.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Status:</strong> {att.status}
                  </p>
                  <p>
                    <strong>Comment:</strong> {att.comment}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(att.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
