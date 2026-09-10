import React from "react";
import {
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  ChevronRight,
  Video,
  Flame,
  Check,
  Calendar,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { Subject, Topic, DailyScheduleItem, EbbinghausRevisionItem } from "../types";
import { formatReadableDate, getTodayString, findTopicOrSubtopic } from "../utils/scheduler";

interface TodayDashboardProps {
  todaySchedule: DailyScheduleItem[];
  todayRevisions: EbbinghausRevisionItem[];
  overdueItems: DailyScheduleItem[];
  subjects: Subject[];
  onOpenTopic: (topic: Topic, subjectName: string) => void;
  onOpenRevision: (revision: EbbinghausRevisionItem) => void;
  onOpenSimulator: () => void;
  onAdjustSchedule: () => void;
  onMarkTopicDone: (topicId: string) => void;
  preferredTime: string;
  streakCount: number;
  onNavigateToSubjects?: () => void;
  studentName?: string;
}

export const TodayDashboard: React.FC<TodayDashboardProps> = ({
  todaySchedule,
  todayRevisions,
  overdueItems,
  subjects,
  onOpenTopic,
  onOpenRevision,
  onOpenSimulator,
  onAdjustSchedule,
  streakCount,
  onNavigateToSubjects,
  studentName,
}) => {
  const todayStr = getTodayString();

  const totalTodayTasks = todaySchedule.length + todayRevisions.length;
  const completedTodayTasks =
    todaySchedule.filter((item) => item.completed).length +
    todayRevisions.filter((rev) => rev.status === "completed").length;

  const allCompleted = totalTodayTasks > 0 && completedTodayTasks === totalTodayTasks;

  return (
    <div className="max-w-xl mx-auto space-y-6 pb-20">
      {/* Clean Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-xs font-semibold text-indigo-600 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatReadableDate(todayStr)}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
            Today's Focus
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Daily Streak */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-amber-800 text-xs font-bold">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{streakCount}d Streak</span>
          </div>

          {/* Daily Progress */}
          <div className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-700">
            {completedTodayTasks}/{totalTodayTasks} Done
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full transition-all duration-500"
          style={{
            width: `${totalTodayTasks > 0 ? (completedTodayTasks / totalTodayTasks) * 100 : 100}%`,
          }}
        />
      </div>

      {/* AI Autonomous Pacing Badge Banner */}
      <div className="p-3 bg-gradient-to-r from-indigo-50 via-slate-50 to-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-indigo-950">
          <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
          <p className="leading-tight">
            <strong>AI Autonomous Pacing:</strong> Subtopics scheduled to complete 2–3 days before deadlines for mock exams.
          </p>
        </div>
        <button
          onClick={onOpenSimulator}
          className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline shrink-0 whitespace-nowrap"
        >
          View Pace Math
        </button>
      </div>

      {/* Subtle Missed Day Nudge (Only appears if yesterday was missed) */}
      {overdueItems.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <p className="text-amber-900">
            Missed a study day? <strong>{overdueItems.length} subtopic{overdueItems.length > 1 ? "s" : ""}</strong> waiting.
          </p>
          <button
            onClick={onAdjustSchedule}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition-colors shrink-0 shadow-2xs"
            title="Automatically rebalances your schedule over remaining days"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Adjust Schedule</span>
          </button>
        </div>
      )}

      {/* Welcome & Empty Subjects State */}
      {subjects.length === 0 ? (
        <div className="p-8 bg-white border border-indigo-100 rounded-3xl text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100/80">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-slate-900">
              Welcome to StudySync{studentName ? `, ${studentName}` : ""}!
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your study space is ready. Add your first subject with an exam deadline or upload your syllabus, and StudySync will automatically break it into 15–20 minute atomic subtopics and schedule them to finish before your exam date.
            </p>
          </div>
          {onNavigateToSubjects && (
            <div className="pt-2">
              <button
                onClick={onNavigateToSubjects}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Your First Subject</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* All Done Celebration */}
          {allCompleted && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-2 animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-emerald-950">
                You've Completed Today's Subtopics!
              </h2>
              <p className="text-xs text-emerald-800 max-w-sm mx-auto">
                Effortless daily consistency builds long-term mastery. Your Ebbinghaus spaced repetitions are scheduled automatically.
              </p>
            </div>
          )}

      {/* SECTION 1: ATOMIC SUBTOPICS TO LEARN TODAY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            Daily Subtopic Tasks ({todaySchedule.length})
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">15–20 min each • ≥ 75% quiz</span>
        </div>

        {todaySchedule.length === 0 ? (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl text-center text-xs text-slate-600">
            No new subtopics scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((item) => {
              const topicObj = findTopicOrSubtopic(subjects, item);
              const isMastered = item.completed;

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isMastered
                      ? "bg-emerald-50/40 border-emerald-200 shadow-2xs"
                      : "bg-white border-slate-200 hover:border-indigo-300 shadow-sm"
                  }`}
                >
                  {/* Subject Tag & Context */}
                  <div className="flex items-center justify-between text-xs mb-2 flex-wrap gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100/80">
                        {item.subjectName}
                      </span>
                      {item.unitTitle && (
                        <span className="text-[11px] font-medium text-slate-500">
                          {item.unitTitle}
                        </span>
                      )}
                      {item.topicCode && (
                        <span className="text-[11px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded font-mono">
                          {item.topicCode}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.estimatedMinutes} mins
                    </span>
                  </div>

                  {/* Parent Heading / Chapter Branch Context */}
                  {item.parentHeading && item.parentHeading !== item.topicTitle && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-1">
                      <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">Heading: {item.parentHeading}</span>
                    </div>
                  )}

                  {/* Subtopic Title (The Daily Task!) */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {item.topicTitle}
                  </h3>

                  {/* Micro-learning Effortless Promise */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      Atomic Subtopic Task ({item.estimatedMinutes} mins)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Effortless single-sitting mastery
                    </span>
                  </div>

                  {/* Primary Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    {isMastered ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3.5 py-2 rounded-xl">
                        <Check className="w-4 h-4" />
                        <span>Mastered (Quiz Passed)</span>
                      </div>
                    ) : (
                      <button
                        id={`btn-study-${item.topicId}`}
                        onClick={() => topicObj && onOpenTopic(topicObj, item.subjectName)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Study Subtopic & Take Quiz</span>
                      </button>
                    )}

                    <button
                      onClick={() => topicObj && onOpenTopic(topicObj, item.subjectName)}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors"
                      title="Notes, YouTube & Audio"
                    >
                      <Video className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TOPICS TO REVISE TODAY (EBBINGHAUS SPACING) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-600" />
            Ebbinghaus Spaced Revision
          </h2>
          <span className="text-[11px] text-purple-600 font-medium">Active memory recall</span>
        </div>

        {todayRevisions.length === 0 ? (
          <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl text-center text-xs text-purple-900/80">
            No revisions due today. As you master subtopics, their spaced reviews will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {todayRevisions.map((rev) => {
              const isCompleted = rev.status === "completed";

              return (
                <div
                  key={rev.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    isCompleted
                      ? "bg-emerald-50/40 border-emerald-200"
                      : "bg-purple-50/30 border-purple-200 hover:border-purple-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md">
                      Stage {rev.stageNumber} • (+{rev.intervalDays}d Recall)
                    </span>
                    <span className="text-slate-500 text-[11px]">{rev.subjectName}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {rev.topicTitle}
                  </h3>

                  <p className="text-xs text-purple-900/80 mt-1.5">
                    Write what you remember from memory without looking at notes. AI evaluates your retention.
                  </p>

                  <div className="mt-3 pt-3 border-t border-purple-100/80 flex items-center justify-between">
                    {isCompleted ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Memory Stabilized ({rev.evaluationScore || 85}% Score)
                      </span>
                    ) : (
                      <button
                        id={`btn-revise-${rev.id}`}
                        onClick={() => onOpenRevision(rev)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Start 2-Minute Recall Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}

      {/* Bottom Subtle Tools Bar */}
      <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200">
        <button
          onClick={onAdjustSchedule}
          className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
          title="Rebalance schedule if days were missed"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Adjust Schedule</span>
        </button>

        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
          title="Autonomous pacing rules and deadline analysis"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>AI Autonomous Schedule Engine</span>
        </button>
      </div>
    </div>
  );
};
