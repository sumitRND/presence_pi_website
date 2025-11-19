"use client";

import { useState, useEffect } from "react";
import { User } from "../types";

interface EmployeeSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: User[];
  loadingEmployees: boolean;
  month: string;
  year: string;
  onConfirm: (selectedEmployeeNumbers: string[]) => void;
}

export default function EmployeeSelectionModal({
  isOpen,
  onClose,
  employees,
  loadingEmployees,
  month,
  year,
  onConfirm,
}: EmployeeSelectionModalProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Reset selections when modal opens
    setSelectedEmployees(new Set());
    setSearchQuery("");
  }, [isOpen]);

  if (!isOpen) return null;

  const monthName = new Date(0, parseInt(month) - 1).toLocaleString("en-US", {
    month: "long",
  });

  const handleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(
        new Set(filteredEmployees.map((emp) => emp.employeeNumber)),
      );
    }
  };

  const handleToggleEmployee = (employeeNumber: string) => {
    const newSelection = new Set(selectedEmployees);
    if (newSelection.has(employeeNumber)) {
      newSelection.delete(employeeNumber);
    } else {
      newSelection.add(employeeNumber);
    }
    setSelectedEmployees(newSelection);
  };

  const handleConfirm = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee");
      return;
    }
    onConfirm(Array.from(selectedEmployees));
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("modal-backdrop")) {
          onClose();
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: "600px" }}>
        <div className="modal-header">
          <h2 className="modal-title">Select Employees to Send</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Select which employees&apos; attendance data to send to HR for{" "}
              <strong>
                {monthName} {year}
              </strong>
            </p>

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-700">
                Selected: {selectedEmployees.size} of {employees.length}{" "}
                employees
              </div>
              <button
                className="btn bg-gray-100 hover:bg-gray-200 px-3 py-1 text-sm"
                onClick={handleSelectAll}
              >
                {selectedEmployees.size === filteredEmployees.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by username or employee number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border-2 border-gray-300 rounded mb-4"
            />
          </div>

          {loadingEmployees ? (
            <div className="text-center py-8">
              <p>Loading employees...</p>
            </div>
          ) : (
            <div
              className="border-2 border-gray-200 rounded"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {filteredEmployees.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredEmployees.length > 0 &&
                            selectedEmployees.size === filteredEmployees.length
                          }
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-left">Employee</th>
                      <th className="p-3 text-left">Full Days</th>
                      <th className="p-3 text-left">Half Days</th>
                      <th className="p-3 text-left">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => (
                      <tr
                        key={emp.employeeNumber}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedEmployees.has(emp.employeeNumber)}
                            onChange={() =>
                              handleToggleEmployee(emp.employeeNumber)
                            }
                          />
                        </td>
                        <td className="p-3">
                          {emp.username} ({emp.employeeNumber})
                        </td>
                        <td className="p-3">
                          {emp.monthlyStatistics.fullDays}
                        </td>
                        <td className="p-3">
                          {emp.monthlyStatistics.halfDays}
                        </td>
                        <td className="p-3">
                          {emp.monthlyStatistics.totalDays}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery
                    ? "No employees found matching your search"
                    : "No employees found"}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              className="btn bg-gray-200 hover:bg-gray-300 px-4 py-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="btn btn-brutal px-4 py-2"
              onClick={handleConfirm}
              disabled={selectedEmployees.size === 0}
            >
              Send Selected ({selectedEmployees.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
