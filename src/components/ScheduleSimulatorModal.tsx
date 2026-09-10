import React, { useState } from "react";
import {
  X,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  ShieldCheck,
  RefreshCw,
  Layers,
  GraduationCap,
} from "lucide-react";
import { Subject, UserPreferences } from "../types";
import { simulateScheduleOutcome, formatReadableDate } from "../utils/scheduler";

interface ScheduleSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  currentPreferences?: UserPreferences;
  onApplySimulation: (topicsPerDay: number, subjectsPerDay: number) => void;
}

export const ScheduleSimulatorModal: React.FC<ScheduleSimulatorModalProps> = ({
  isOpen,
  onClose,
  subjects,
  onApplySimulation,
}) => {
  const [isRecalculating, setIsRecalculating] = useState(false);

  if (!isOpen) return null;

  // Run autonomous pacing simulation based on subject deadlines and atomic subtopics
  const simulation = simulateScheduleOutcome(subjects);

  const handleRecalculate = () => {
    setIsRecalculating(true);
    setTimeout(() => {
      onApplySimulation(0, 0);
      setIsRecalculating(false);
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">AI Autonomous Schedule Engine</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Zero Guesswork
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Paced automatically to complete each subject 2–3 days before its target deadline
              </p>
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
        <div className="p-6 space-y-6">
          {/* AI Scheduling Laws Card */}
          <div className="bg-gradient-to-br from-indigo-50/90 via-slate-50 to-indigo-50/50 border border-indigo-100 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>AI Autonomous Scheduling System Rules</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white/80 border border-indigo-100/80 p-3 rounded-lg">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Atomic Subtopics Per Day
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Daily tasks are individual subtopics (15–20 min each), never an entire chapter heading.
                </p>
              </div>
              <div className="bg-white/80 border border-indigo-100/80 p-3 rounded-lg">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  2–3 Day Mock Exam Buffer
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Every subject finishes 2–3 days before deadline, reserving buffer days for mock tests.
                </p>
              </div>
              <div className="bg-white/80 border border-indigo-100/80 p-3 rounded-lg">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                  Dynamic Multi-Subject Balancing
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Adding a subject automatically recalculates the whole calendar while keeping revisions safe.
                </p>
              </div>
              <div className="bg-white/80 border border-indigo-100/80 p-3 rounded-lg">
                <p className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  No Manual Topic Count Guesswork
                </p>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  The AI handles all cognitive pace math. You simply study the assigned subtopics each day.
                </p>
              </div>
            </div>
          </div>

          {/* AI Global Pacing Overview */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-400 font-medium">Final Subject Completion Date</p>
              <p className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                {formatReadableDate(simulation.projectedFinishDate)}
                <span className="text-xs font-normal text-slate-300">
                  ({simulation.totalDaysNeeded} study days total)
                </span>
              </p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4">
              <span className="text-xs text-slate-400 block">Total Atomic Subtopics</span>
              <span className="text-base font-bold text-indigo-300">
                {simulation.totalPendingTopics} bite-sized subtopics
              </span>
            </div>
          </div>

          {/* Per-Subject Deadline Pacing Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Subject Deadline Pacing & Completion Buffers
              </h3>
              <span className="text-[11px] text-slate-500">
                Target: Finish 2–3 days early
              </span>
            </div>

            <div className="space-y-2.5">
              {simulation.subjectEstimates.map((item) => (
                <div
                  key={item.subjectId}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.subjectName}</p>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {item.pendingSubtopics} subtopics
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Target Deadline: <strong className="text-slate-800">{formatReadableDate(item.targetDate)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finishes {formatReadableDate(item.projectedFinishDate)} ({item.daysEarly}d Buffer)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                    <span>
                      AI Daily Allocation: <strong className="text-indigo-700 font-semibold">{item.dailySubtopicsPace} subtopic{item.dailySubtopicsPace > 1 ? "s" : ""}/day</strong>
                    </span>
                    <span className="text-emerald-700 font-medium">
                      ✓ {item.daysEarly >= 3 ? "3-day" : `${item.daysEarly}-day`} mock exam buffer guaranteed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            id="btn-apply-simulator-schedule"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? "animate-spin" : ""}`} />
            <span>Recalculate AI Schedule Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
