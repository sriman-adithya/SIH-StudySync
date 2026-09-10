import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Flag,
  ShieldCheck,
} from "lucide-react";
import { DailyScheduleItem, EbbinghausRevisionItem, Topic, Subject } from "../types";
import { formatReadableDate, getTodayString, findTopicOrSubtopic } from "../utils/scheduler";

interface CalendarViewProps {
  schedule: DailyScheduleItem[];
  revisions: EbbinghausRevisionItem[];
  subjects: Subject[];
  onOpenTopic: (topic: Topic, subjectName: string) => void;
  onOpenRevision: (revision: EbbinghausRevisionItem) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  schedule,
  revisions,
  subjects,
  onOpenTopic,
  onOpenRevision,
}) => {
  const today = getTodayString();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(today);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Map schedule & revisions by date string YYYY-MM-DD
  const scheduleByDate = new Map<string, DailyScheduleItem[]>();
  for (const item of schedule) {
    const arr = scheduleByDate.get(item.date) || [];
    arr.push(item);
    scheduleByDate.set(item.date, arr);
  }

  const revisionsByDate = new Map<string, EbbinghausRevisionItem[]>();
  for (const rev of revisions) {
    const arr = revisionsByDate.get(rev.scheduledDate) || [];
    arr.push(rev);
    revisionsByDate.set(rev.scheduledDate, arr);
  }

  // Deadlines map
  const deadlinesByDate = new Map<string, Subject[]>();
  for (const sub of subjects) {
    const arr = deadlinesByDate.get(sub.targetDate) || [];
    arr.push(sub);
    deadlinesByDate.set(sub.targetDate, arr);
  }

  const selectedDateSchedule = scheduleByDate.get(selectedDateStr) || [];
  const selectedDateRevisions = revisionsByDate.get(selectedDateStr) || [];
  const selectedDateDeadlines = deadlinesByDate.get(selectedDateStr) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Autonomous Study & Revision Calendar
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Daily atomic subtopics dynamically paced across all subjects to finish 2–3 days before each deadline.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            <span className="text-slate-600 font-medium">Subtopic Task</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-600 inline-block" />
            <span className="text-slate-600 font-medium">Ebbinghaus (R1-R5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="text-slate-600 font-medium">Subject Deadline</span>
          </div>
        </div>
      </div>

      {/* Main Container: Calendar Grid + Selected Date Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid (8 cols on lg) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          {/* Month Navigator */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDateStr(today);
                }}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Empty slots for start of month */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20 sm:h-24 bg-slate-50/50 rounded-xl border border-transparent" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = dateKey === today;
              const isSelected = dateKey === selectedDateStr;

              const daySchedule = scheduleByDate.get(dateKey) || [];
              const dayRevisions = revisionsByDate.get(dateKey) || [];
              const dayDeadlines = deadlinesByDate.get(dateKey) || [];

              const hasItems = daySchedule.length > 0 || dayRevisions.length > 0 || dayDeadlines.length > 0;

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDateStr(dateKey)}
                  className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/30"
                      : isToday
                      ? "border-amber-400 bg-amber-50/30"
                      : "border-slate-100 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? "bg-indigo-600 text-white"
                          : isSelected
                          ? "text-indigo-700 font-extrabold"
                          : "text-slate-700"
                      }`}
                    >
                      {dayNum}
                    </span>

                    {/* Deadline icon or count */}
                    {dayDeadlines.length > 0 ? (
                      <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 rounded flex items-center gap-0.5">
                        <Flag className="w-2.5 h-2.5" /> Deadline
                      </span>
                    ) : hasItems ? (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {daySchedule.length + dayRevisions.length}
                      </span>
                    ) : null}
                  </div>

                  {/* Day items preview pills */}
                  <div className="space-y-0.5 overflow-hidden">
                    {daySchedule.slice(0, 1).map((s) => (
                      <div
                        key={s.id}
                        className="truncate text-[9px] px-1 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium"
                      >
                        {s.topicTitle}
                      </div>
                    ))}
                    {dayRevisions.slice(0, 1).map((r) => (
                      <div
                        key={r.id}
                        className="truncate text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-medium flex items-center gap-0.5"
                      >
                        <span className="font-bold">R{r.stageNumber}</span> {r.topicTitle}
                      </div>
                    ))}
                    {daySchedule.length + dayRevisions.length > 2 && (
                      <div className="text-[8px] text-slate-500 font-bold px-1">
                        +{daySchedule.length + dayRevisions.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector (4 cols on lg) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Selected Date</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              {formatReadableDate(selectedDateStr)}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedDateSchedule.length} subtopics • {selectedDateRevisions.length} revisions
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[500px]">
            {/* Subject Deadlines on this date */}
            {selectedDateDeadlines.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-800">
                  <Flag className="w-3.5 h-3.5 text-rose-600" />
                  <span>Subject Exam / Target Deadline:</span>
                </div>
                {selectedDateDeadlines.map((d) => (
                  <p key={d.id} className="text-rose-700 font-semibold pl-5">
                    • {d.name} (All subtopics scheduled to finish 2–3 days prior)
                  </p>
                ))}
              </div>
            )}

            {/* New Study Subtopics */}
            {selectedDateSchedule.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Scheduled Subtopic Tasks
                </h4>
                <div className="space-y-2">
                  {selectedDateSchedule.map((item) => {
                    const topicObj = findTopicOrSubtopic(subjects, item);
                    const isDone = item.completed;

                    return (
                      <div
                        key={item.id}
                        className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-semibold text-indigo-700">
                              {item.subjectName}
                            </span>
                            {item.parentHeading && item.parentHeading !== item.topicTitle && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                <Layers className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{item.parentHeading}</span>
                              </div>
                            )}
                            <p className="text-xs font-bold text-slate-900 mt-0.5">{item.topicTitle}</p>
                          </div>
                          <span className="text-[10px] font-medium text-slate-500 flex items-center gap-0.5 shrink-0">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {item.estimatedMinutes}m
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          {isDone ? (
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => topicObj && onOpenTopic(topicObj, item.subjectName)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Study Subtopic & Quiz
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ebbinghaus Revisions */}
            {selectedDateRevisions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-purple-600" />
                  Ebbinghaus Spaced Revisions
                </h4>
                <div className="space-y-2">
                  {selectedDateRevisions.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-200/80 text-purple-900">
                            Stage {rev.stageNumber} (+{rev.intervalDays}d)
                          </span>
                          <p className="text-xs font-bold text-slate-900 mt-1">{rev.topicTitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {rev.status === "completed" ? (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Revised ({rev.evaluationScore || 85}%)
                          </span>
                        ) : (
                          <button
                            onClick={() => onOpenRevision(rev)}
                            className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Start Active Recall
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedDateSchedule.length === 0 && selectedDateRevisions.length === 0 && selectedDateDeadlines.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">No scheduled study tasks on this date.</p>
                <p>Reserved for rest or comprehensive mock exam preparation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
