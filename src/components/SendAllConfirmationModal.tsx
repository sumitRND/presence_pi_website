"use client";

import { User } from "../types";

interface SendAllConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  employees: User[];
  month: string;
  year: string;
  loading: boolean;
}

export default function SendAllConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  employees,
  month,
  year,
  loading,
}: SendAllConfirmationModalProps) {
  if (!isOpen) return null;

  const monthName = new Date(0, parseInt(month) - 1).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container">
        <div className="modal-header">
          <h2>Confirm Bulk Data Submission</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="p-6">
          <p>
            You are about to send attendance data for the following employees for{" "}
            <strong>
              {monthName} {year}
            </strong>
            :
          </p>
          <div className="bg-gray-100 p-4 rounded-md my-4 max-h-60 overflow-y-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Employee</th>
                  <th className="p-2">Full Days</th>
                  <th className="p-2">Half Days</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.employeeNumber} className="border-b">
                    <td className="p-2">
                      {emp.username} ({emp.employeeNumber})
                    </td>
                    <td className="p-2">
                      {emp.monthlyStatistics.fullDays}
                    </td>
                    <td className="p-2">
                      {emp.monthlyStatistics.halfDays}
                    </td>
                    <td className="p-2">
                      {emp.monthlyStatistics.totalDays}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end gap-2">
            <button className="btn bg-gray-200" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={loading} onClick={onConfirm}>
              {loading ? "Submitting..." : "Confirm and Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
