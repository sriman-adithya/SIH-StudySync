import React, { useState } from "react";
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Smartphone,
  Sparkles,
  Volume2,
  AlertCircle,
} from "lucide-react";
import { UserPreferences } from "../types";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (updated: Partial<UserPreferences>) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [preferredTime, setPreferredTime] = useState(preferences.preferredStudyTime || "18:30");
  const [enabled, setEnabled] = useState(preferences.notificationsEnabled ?? true);
  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setPermissionState(perm);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendTestNotification = () => {
    setTestSent(true);
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      new Notification("StudySync Daily Reminder 📚", {
        body: "Time for your effortless daily study session! 2 topics and 1 Ebbinghaus revision waiting.",
        icon: "/favicon.ico",
      });
    }
    setTimeout(() => setTestSent(false), 4000);
  };

  const handleSave = () => {
    onSavePreferences({
      preferredStudyTime: preferredTime,
      notificationsEnabled: enabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Study Notifications</h2>
              <p className="text-xs text-slate-700">Stay consistent with punctual daily alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Notification time picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Daily Study Notification Time
            </label>
            <input
              type="time"
              value={preferredTime}
              onChange={(e) => setPreferredTime(e.target.value)}
              className="w-full text-sm font-semibold text-slate-800 p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-700">
              StudySync will remind you at this exact time every day with your specific topics and Ebbinghaus revisions.
            </p>
          </div>

          {/* Toggle enabled */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70">
            <div>
              <p className="text-xs font-bold text-slate-900">Enable Daily Reminders</p>
              <p className="text-[11px] text-slate-700">Receive alerts on your phone or computer</p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Browser Permission check */}
          <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                Browser & Mobile Push Status
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  permissionState === "granted"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {permissionState === "granted" ? "Permission Granted" : "Permission Needed"}
              </span>
            </div>

            {permissionState !== "granted" ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Allow Phone / Browser Notifications
              </button>
            ) : (
              <p className="text-[11px] text-indigo-900/80">
                ✓ Notifications are authorized on this device.
              </p>
            )}
          </div>

          {/* Test Notification Trigger */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSendTestNotification}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-600" />
              <span>Send Sample Test Notification Now</span>
            </button>

            {testSent && (
              <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Sample Notification triggered!</strong> Check your notification tray or phone lockscreen.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
