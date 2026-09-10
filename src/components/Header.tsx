import React from "react";
import {
  BookOpen,
  Calendar,
  Layers,
  Users,
  Award,
  Bell,
  Flame,
  User as UserIcon,
} from "lucide-react";
import { User } from "../types";

interface HeaderProps {
  activeTab: "today" | "subjects" | "calendar" | "community" | "badges";
  onSelectTab: (tab: "today" | "subjects" | "calendar" | "community" | "badges") => void;
  streakCount: number;
  onOpenSimulator?: () => void;
  onOpenNotifications?: () => void;
  unreadNotificationCount?: number;
  currentUser?: User | null;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  streakCount,
  onOpenNotifications,
  unreadNotificationCount = 0,
  currentUser,
  onOpenProfile,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onSelectTab("today")}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900">
              StudySync
            </span>
          </div>

          {/* Clean Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
            <button
              onClick={() => onSelectTab("today")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "today"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Today
            </button>
            <button
              onClick={() => onSelectTab("subjects")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "subjects"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Subjects
            </button>
            <button
              onClick={() => onSelectTab("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "calendar"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => onSelectTab("community")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "community"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Community
            </button>
            <button
              onClick={() => onSelectTab("badges")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "badges"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Badges
            </button>
          </nav>

          {/* Right Action Icons: Streak, Notification, Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectTab("badges")}
              className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors"
              title="View Habit Streaks"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>{streakCount}d</span>
            </button>

            {onOpenNotifications && (
              <button
                onClick={onOpenNotifications}
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors relative"
                title="Daily Study Reminder"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>
            )}

            {/* Student Profile / Login Button */}
            {currentUser ? (
              <button
                id="btn-header-profile"
                onClick={onOpenProfile}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors"
                title={`${currentUser.name} (${currentUser.academicGoal})`}
              >
                <div
                  className={`w-6 h-6 rounded-lg ${currentUser.avatarColor} text-white flex items-center justify-center text-[10px] font-extrabold shadow-2xs`}
                >
                  {currentUser.avatarInitials}
                </div>
                <span className="hidden sm:inline-block max-w-[90px] truncate text-slate-900">
                  {currentUser.name.split(" ")[0]}
                </span>
              </button>
            ) : (
              <button
                id="btn-header-signin"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

