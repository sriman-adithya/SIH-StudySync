import React, { useState } from "react";
import {
  X,
  User as UserIcon,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Users,
  Save,
  ShieldCheck,
} from "lucide-react";
import { User } from "../types";
import {
  updateUserProfile,
  getStoredUsers,
  loginUser,
} from "../utils/auth";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdated: (user: User) => void;
  onLogout: () => void;
}

const AVATAR_COLORS = [
  { label: "Indigo", value: "bg-indigo-600" },
  { label: "Purple", value: "bg-purple-600" },
  { label: "Emerald", value: "bg-emerald-600" },
  { label: "Amber", value: "bg-amber-600" },
  { label: "Rose", value: "bg-rose-600" },
  { label: "Sky", value: "bg-sky-600" },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated,
  onLogout,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [academicGoal, setAcademicGoal] = useState(currentUser.academicGoal);
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor);
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSwitchAccounts, setShowSwitchAccounts] = useState(false);

  if (!isOpen) return null;

  const storedUsers = getStoredUsers();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const res = updateUserProfile(currentUser.id, {
      name,
      academicGoal,
      avatarColor,
    });

    if (res.success && res.user) {
      onUserUpdated(res.user);
      setIsEditing(false);
      setStatusMessage({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ text: res.error || "Failed to update profile", type: "error" });
    }
  };

  const handleSwitchToAccount = async (email: string, passwordHash: string) => {
    const res = await loginUser(email, passwordHash);
    if (res.success && res.user) {
      onUserUpdated(res.user);
      setShowSwitchAccounts(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Student Account</h3>
              <p className="text-xs text-slate-500">Your StudySync profile & credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="my-5 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50/40 border border-slate-200 flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-2xl ${currentUser.avatarColor} text-white flex items-center justify-center text-lg font-extrabold shadow-sm shrink-0`}
          >
            {currentUser.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-slate-900 truncate">{currentUser.name}</h4>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              {currentUser.email}
            </p>
            <p className="text-xs font-semibold text-indigo-700 flex items-center gap-1 mt-1">
              <GraduationCap className="w-3 h-3 text-indigo-600" />
              {currentUser.academicGoal}
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Edit or View Details */}
        {!isEditing ? (
          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> Full Name
                </span>
                <span className="font-bold text-slate-800">{currentUser.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email
                </span>
                <span className="font-bold text-slate-800">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/50">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" /> Focus / Target
                </span>
                <span className="font-bold text-slate-800">{currentUser.academicGoal}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Student Since
                </span>
                <span className="font-semibold text-slate-600">{currentUser.createdAt}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                Edit Profile
              </button>
              <button
                type="button"
                onClick={() => setShowSwitchAccounts(!showSwitchAccounts)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                title="Switch Registered Accounts"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Switch</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Academic Focus / Goal
              </label>
              <input
                type="text"
                required
                value={academicGoal}
                onChange={(e) => setAcademicGoal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Badge Theme Color</label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setAvatarColor(c.value)}
                    className={`w-7 h-7 rounded-full ${c.value} transition-transform ${
                      avatarColor === c.value
                        ? "ring-3 ring-offset-2 ring-indigo-500 scale-110"
                        : "opacity-75 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Switch Accounts Drawer */}
        {showSwitchAccounts && (
          <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-slate-800">Switch Registered Account</h5>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {storedUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleSwitchToAccount(u.email, u.passwordHash)}
                  className={`p-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-colors ${
                    u.id === currentUser.id
                      ? "bg-indigo-100/70 text-indigo-900 font-bold"
                      : "bg-white hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-5 h-5 rounded-full ${u.avatarColor} text-white text-[10px] flex items-center justify-center font-bold`}
                    >
                      {u.avatarInitials}
                    </div>
                    <span className="truncate">{u.name}</span>
                  </div>
                  {u.id === currentUser.id && (
                    <span className="text-[10px] text-indigo-600 font-bold">Active</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log Out Action */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500">Finished studying for today?</span>
          <button
            type="button"
            id="btn-logout"
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
