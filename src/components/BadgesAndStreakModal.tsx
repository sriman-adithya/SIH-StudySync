import React from "react";
import {
  Award,
  Flame,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Repeat,
  Users,
  X,
} from "lucide-react";
import { AchievementBadge } from "../types";

interface BadgesAndStreakModalProps {
  badges: AchievementBadge[];
  streakCount: number;
  totalTopicsMastered: number;
  totalRevisionsDone: number;
}

export const BadgesAndStreakModal: React.FC<BadgesAndStreakModalProps> = ({
  badges,
  streakCount,
  totalTopicsMastered,
  totalRevisionsDone,
}) => {
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full border border-white/20">
              Motivation & Milestones
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Habit Streaks & Badges
            </h1>
            <p className="text-xs sm:text-sm text-white/90 max-w-md leading-relaxed">
              Every small daily action compounds over time. Celebrate consistency, recall mastery, and spaced repetition milestones!
            </p>
          </div>

          {/* Big Streak Flame */}
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center shrink-0 min-w-[150px]">
            <div className="w-12 h-12 rounded-full bg-white text-amber-500 flex items-center justify-center mx-auto shadow-md mb-2">
              <Flame className="w-7 h-7 fill-amber-500 text-amber-500" />
            </div>
            <span className="text-2xl font-black block">{streakCount} Days</span>
            <span className="text-[11px] text-white/80 font-medium">Daily Study Habit</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-700 font-medium">Topics Mastered</span>
          <p className="text-2xl font-extrabold text-indigo-700">{totalTopicsMastered}</p>
          <p className="text-[11px] text-slate-700">Passed with ≥ 75% quiz score</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-700 font-medium">Ebbinghaus Spaced Revisions</span>
          <p className="text-2xl font-extrabold text-purple-700">{totalRevisionsDone}</p>
          <p className="text-[11px] text-slate-700">Active memory consolidations</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs text-slate-700 font-medium">Badges Unlocked</span>
          <p className="text-2xl font-extrabold text-amber-600">
            {unlockedCount} / {badges.length}
          </p>
          <p className="text-[11px] text-slate-700">Recognition of consistent growth</p>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          Achievement Badges
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                b.unlocked
                  ? "bg-white border-amber-200 shadow-2xs"
                  : "bg-slate-50/70 border-slate-200 opacity-75"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                    b.unlocked
                      ? "bg-amber-100 text-amber-600 shadow-xs"
                      : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {b.icon === "flame" ? (
                    <Flame className="w-6 h-6 fill-amber-500" />
                  ) : b.icon === "award" ? (
                    <Award className="w-6 h-6" />
                  ) : b.icon === "repeat" ? (
                    <Repeat className="w-6 h-6" />
                  ) : b.icon === "zap" ? (
                    <Zap className="w-6 h-6" />
                  ) : b.icon === "users" ? (
                    <Users className="w-6 h-6" />
                  ) : (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>

                {b.unlocked ? (
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900">{b.title}</h3>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">{b.description}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.unlocked ? "bg-amber-500" : "bg-slate-300"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.round((b.currentCount / b.targetCount) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-700 font-medium">
                  <span>Progress</span>
                  <span>
                    {b.currentCount} / {b.targetCount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
