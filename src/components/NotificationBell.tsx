"use client";

import { useState, useEffect } from "react";
import { api } from "../utils/api";
import EmployeeSelectionModal from "./EmployeeSelectionModal";
import SendAllConfirmationModal from "./SendAllConfirmationModal";

interface Notification {
  month: string;
  year: string;
  message?: string;
}

import { User } from "../types";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [
    showSendAllConfirmationModal,
    setShowSendAllConfirmationModal,
  ] = useState(false);
  const [
    confirmationEmployees,
    setConfirmationEmployees,
  ] = useState<User[]>([]);
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/pi/notifications");
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchEmployees = async (month: string, year: string) => {
    try {
      setLoadingEmployees(true);
      const res = await api.get(
        `/pi/users-attendance?month=${month}&year=${year}`,
      );
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSendAllData = async (month: string, year: string) => {
    setSelectedNotification({ month, year });
    try {
      const res = await api.get(
        `/pi/users-attendance?month=${month}&year=${year}`,
      );
      if (res.success && res.data) {
        setConfirmationEmployees(res.data);
        setShowSendAllConfirmationModal(true);
      }
    } catch (error) {
      console.error("Failed to fetch employees for confirmation:", error);
    }
  };

  const confirmSendAllData = async () => {
    if (!selectedNotification) return;
    setConfirmationLoading(true);
    try {
      const res = await api.post("/pi/submit-data", {
        month: parseInt(selectedNotification.month),
        year: parseInt(selectedNotification.year),
        sendAll: true,
      });
      if (res.success) {
        alert("All employee attendance data sent to HR successfully!");
        setNotifications((prev) =>
          prev.filter(
            (n) =>
              !(
                n.month === selectedNotification.month &&
                n.year === selectedNotification.year
              ),
          ),
        );
        setShowSendAllConfirmationModal(false);
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (error) {
      console.error("Failed to send data:", error);
      alert("Failed to send data. Please try again.");
    } finally {
      setConfirmationLoading(false);
    }
  };

  const handleSelectEmployees = async (notif: Notification) => {
    setSelectedNotification(notif);
    await fetchEmployees(notif.month, notif.year);
    setShowEmployeeModal(true);
  };

  const handleSendSelectedEmployees = async (
    selectedEmployeeNumbers: string[],
  ) => {
    if (!selectedNotification) return;

    try {
      const res = await api.post("/pi/submit-data", {
        month: parseInt(selectedNotification.month),
        year: parseInt(selectedNotification.year),
        sendAll: false,
        selectedEmployees: selectedEmployeeNumbers, // Send only selected employees
      });

      if (res.success) {
        alert(
          `${selectedEmployeeNumbers.length} employee(s) attendance data sent to HR successfully!`,
        );
        setNotifications((prev) =>
          prev.filter(
            (n) =>
              !(
                n.month === selectedNotification.month &&
                n.year === selectedNotification.year
              ),
          ),
        );
        setShowEmployeeModal(false);
        setSelectedNotification(null);
      } else {
        alert(`Error: ${res.error}`);
      }
    } catch (error) {
      console.error("Failed to send selected data:", error);
      alert("Failed to send data. Please try again.");
    }
  };

  const formatNotificationMessage = (notif: Notification) => {
    const monthName = new Date(0, parseInt(notif.month) - 1).toLocaleString(
      "en-US",
      { month: "long" },
    );
    const message = notif.message || "Request for attendance data for";
    return `${message}: ${monthName} ${notif.year}`;
  };

  return (
    <>
      <div className="relative cursor-pointer group">
        <div
          className="relative neo-btn px-2 py-2 border-none shadow-none hover:shadow-none bg-transparent hover:bg-gray-100"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-2xl">🔔</span>
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-bold h-5 w-5 flex items-center justify-center border-2 border-white rounded-full">
              {notifications.length}
            </span>
          )}
        </div>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 z-50 neo-card overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white border-b-2 border-black p-3 font-bold uppercase text-sm">
              HR Attendance Requests
            </div>

            {notifications.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.map((notif, index) => (
                  <div key={index} className="p-4 border-b-2 border-black last:border-b-0 hover:bg-gray-50">
                    <p className="mb-3 text-sm font-medium border-l-4 border-black pl-2">
                      {formatNotificationMessage(notif)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        className="neo-btn neo-btn-primary w-full text-xs py-2"
                        onClick={() => handleSendAllData(notif.month, notif.year)}
                      >
                        Send All Data
                      </button>
                      <button
                        className="neo-btn w-full text-xs py-2 bg-white"
                        onClick={() => handleSelectEmployees(notif)}
                      >
                        Select Employees
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 italic text-sm">
                No new requests from HR
              </div>
            )}
          </div>
        )}
      </div>

      {showEmployeeModal && selectedNotification && (
        <EmployeeSelectionModal
          isOpen={showEmployeeModal}
          onClose={() => {
            setShowEmployeeModal(false);
            setSelectedNotification(null);
          }}
          employees={employees}
          loadingEmployees={loadingEmployees}
          month={selectedNotification.month}
          year={selectedNotification.year}
          onConfirm={handleSendSelectedEmployees}
        />
      )}

      {showSendAllConfirmationModal && selectedNotification && (
        <SendAllConfirmationModal
          isOpen={showSendAllConfirmationModal}
          onClose={() => {
            setShowSendAllConfirmationModal(false);
            setSelectedNotification(null);
          }}
          employees={confirmationEmployees}
          month={selectedNotification.month}
          year={selectedNotification.year}
          loading={confirmationLoading}
          onConfirm={confirmSendAllData}
        />
      )}
    </>
  );
}