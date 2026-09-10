import { Subject, Topic, DailyScheduleItem, EbbinghausRevisionItem } from "../types";

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatReadableDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function daysBetween(date1Str: string, date2Str: string): number {
  const d1 = new Date(date1Str).getTime();
  const d2 = new Date(date2Str).getTime();
  const diffTime = d2 - d1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Generate standard Ebbinghaus (+1, +3, +7, +14, +30 days) revisions for a newly mastered topic
export const EBBINGHAUS_INTERVALS = [
  { stage: 1, days: 1, label: "R1 (+1 Day)" },
  { stage: 2, days: 3, label: "R2 (+3 Days)" },
  { stage: 3, days: 7, label: "R3 (+7 Days)" },
  { stage: 4, days: 14, label: "R4 (+14 Days)" },
  { stage: 5, days: 30, label: "R5 (+30 Days)" },
];

export function generateEbbinghausRevisions(
  topicId: string,
  topicTitle: string,
  subjectId: string,
  subjectName: string,
  completionDate: string = getTodayString()
): EbbinghausRevisionItem[] {
  return EBBINGHAUS_INTERVALS.map((intv) => ({
    id: `rev-${topicId}-${intv.stage}-${Date.now()}`,
    topicId,
    subjectId,
    topicTitle,
    subjectName,
    originalCompletionDate: completionDate,
    scheduledDate: addDays(completionDate, intv.days),
    stageNumber: intv.stage,
    intervalDays: intv.days,
    status: "pending",
  }));
}

export interface AtomicSubtopicTask {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectTargetDate: string;
  parentTopicId: string;
  parentHeading: string;
  unitTitle?: string;
  topicCode?: string;
  title: string;
  subtopicIndex: number;
  estimatedMinutes: number;
  difficulty: "Easy" | "Medium" | "Hard";
  keyConcepts: string[];
  completed: boolean;
}

/**
 * Extracts atomic, bite-sized tasks from a subject's syllabus.
 * If a topic contains granular subtopics, EACH subtopic becomes an individual daily task.
 * If a topic has no subtopics, the topic itself is treated as the atomic small topic.
 */
export function extractAtomicTasksFromSubject(subject: Subject): AtomicSubtopicTask[] {
  const tasks: AtomicSubtopicTask[] = [];

  for (const topic of subject.topics) {
    if (topic.subtopics && topic.subtopics.length > 0) {
      topic.subtopics.forEach((st, idx) => {
        const subtopicCode = topic.topicCode
          ? `${topic.topicCode}.${idx + 1}`
          : `${topic.order}.${idx + 1}`;
        tasks.push({
          id: `${topic.id}-sub-${idx}`,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectTargetDate: subject.targetDate,
          parentTopicId: topic.id,
          parentHeading: topic.topicCode ? `${topic.topicCode} ${topic.title}` : topic.title,
          unitTitle: topic.unitTitle || topic.moduleName,
          topicCode: subtopicCode,
          title: st,
          subtopicIndex: idx,
          estimatedMinutes: Math.min(
            22,
            Math.max(12, Math.round((topic.estimatedMinutes || 20) / topic.subtopics!.length) || 16)
          ),
          difficulty: topic.difficulty || "Medium",
          keyConcepts: [st, ...(topic.keyConcepts || [])],
          completed: topic.status === "completed",
        });
      });
    } else {
      tasks.push({
        id: topic.id,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectTargetDate: subject.targetDate,
        parentTopicId: topic.id,
        parentHeading: topic.unitTitle || topic.moduleName,
        unitTitle: topic.unitTitle || topic.moduleName,
        topicCode: topic.topicCode || String(topic.order),
        title: topic.title,
        subtopicIndex: 0,
        estimatedMinutes: topic.estimatedMinutes || 18,
        difficulty: topic.difficulty || "Medium",
        keyConcepts: topic.keyConcepts || [topic.title],
        completed: topic.status === "completed",
      });
    }
  }

  return tasks;
}

/**
 * Calculates the ideal buffer days (2 to 3 days before deadline)
 * to ensure all study is completed before the target date for comprehensive mock exams.
 */
export function calculateSubjectBufferDays(startDate: string, targetDate: string): number {
  const daysRemaining = daysBetween(startDate, targetDate);
  if (daysRemaining >= 6) return 3; // Ideal 3 full days buffer
  if (daysRemaining >= 4) return 2; // 2 days buffer
  if (daysRemaining >= 2) return 1;
  return 0;
}

export function generateSchedule(
  subjects: Subject[],
  _preferences?: { topicsPerDay?: number; subjectsPerDay?: number },
  startDate: string = getTodayString()
): DailyScheduleItem[] {
  return generateSmartStudySchedule(subjects, 0, 0, startDate);
}

/**
 * Dynamically rebalances schedule when a day was missed or when a subject was added/adjusted.
 * Keeps past completed items intact, and regenerates remaining pending subtopics from today onward.
 */
export function adjustScheduleForRemainingDays(
  subjects: Subject[],
  existingSchedule: DailyScheduleItem[],
  _preferences?: { topicsPerDay?: number; subjectsPerDay?: number }
): DailyScheduleItem[] {
  const today = getTodayString();
  const pastCompleted = existingSchedule.filter((item) => item.completed);

  // Generate fresh autonomous distribution for all remaining uncompleted subtopics starting from today
  const freshSchedule = generateSmartStudySchedule(subjects, 0, 0, today);

  // Filter out any fresh items that were already marked completed in past
  const completedTaskIds = new Set(pastCompleted.map((i) => i.topicId));
  const filteredFresh = freshSchedule.filter((item) => !completedTaskIds.has(item.topicId));

  return [...pastCompleted, ...filteredFresh];
}

/**
 * AI Autonomous Study Scheduler:
 * - Subtopics or small topics are the daily study tasks (NEVER broad branches or headings)
 * - Each subject is scheduled to complete 2 to 3 days BEFORE its target deadline
 * - Multi-subject co-scheduling: dynamic pace calculation across all subjects
 * - Adding or modifying any subject automatically recalculates the whole schedule
 * - No manual user choice needed for number of topics per day
 */
export function generateSmartStudySchedule(
  subjects: Subject[],
  _topicsPerDay?: number,
  _subjectsPerDay?: number,
  startDate: string = getTodayString()
): DailyScheduleItem[] {
  if (!subjects || subjects.length === 0) return [];

  // 1. Extract all atomic subtopic tasks for all active subjects
  const subjectTaskQueues = new Map<string, AtomicSubtopicTask[]>();
  const subjectMeta = new Map<
    string,
    {
      subject: Subject;
      targetFinishDate: string;
      bufferDays: number;
      availableDays: number;
      baseDailyPace: number;
    }
  >();

  for (const sub of subjects) {
    const allTasks = extractAtomicTasksFromSubject(sub);
    const pendingTasks = allTasks.filter((t) => !t.completed);

    if (pendingTasks.length > 0) {
      subjectTaskQueues.set(sub.id, [...pendingTasks]);

      const bufferDays = calculateSubjectBufferDays(startDate, sub.targetDate);
      const targetFinishDate = addDays(sub.targetDate, -bufferDays);
      const availableDays = Math.max(1, daysBetween(startDate, targetFinishDate));
      const baseDailyPace = Math.max(1, Math.ceil(pendingTasks.length / availableDays));

      subjectMeta.set(sub.id, {
        subject: sub,
        targetFinishDate,
        bufferDays,
        availableDays,
        baseDailyPace,
      });
    }
  }

  if (subjectTaskQueues.size === 0) return [];

  const schedule: DailyScheduleItem[] = [];
  let currentDate = startDate;
  let safetyIteration = 0;
  const MAX_DAYS = 365;

  const hasRemainingTasks = () => {
    for (const queue of subjectTaskQueues.values()) {
      if (queue.length > 0) return true;
    }
    return false;
  };

  while (hasRemainingTasks() && safetyIteration < MAX_DAYS) {
    safetyIteration++;

    // Find all subjects that have pending tasks
    const activeSubjectIds = Array.from(subjectTaskQueues.entries())
      .filter(([_, q]) => q.length > 0)
      .map(([id]) => id);

    if (activeSubjectIds.length === 0) break;

    // Sort active subjects by urgency (urgency = remaining tasks / remaining available days to 2-3 day buffer)
    const sortedSubjectIds = [...activeSubjectIds].sort((aId, bId) => {
      const metaA = subjectMeta.get(aId)!;
      const metaB = subjectMeta.get(bId)!;
      const daysLeftA = Math.max(1, daysBetween(currentDate, metaA.targetFinishDate));
      const daysLeftB = Math.max(1, daysBetween(currentDate, metaB.targetFinishDate));
      const urgencyA = (subjectTaskQueues.get(aId)?.length || 0) / daysLeftA;
      const urgencyB = (subjectTaskQueues.get(bId)?.length || 0) / daysLeftB;
      return urgencyB - urgencyA; // Most urgent first
    });

    // Schedule subtopics for today from active subjects
    let scheduledTodayCount = 0;
    const itemsToday: DailyScheduleItem[] = [];

    for (const subId of sortedSubjectIds) {
      const queue = subjectTaskQueues.get(subId);
      const meta = subjectMeta.get(subId);
      if (!queue || queue.length === 0 || !meta) continue;

      // Determine required subtopics for this subject today
      const remainingDaysToFinish = Math.max(1, daysBetween(currentDate, meta.targetFinishDate));
      const neededToday = Math.max(1, Math.ceil(queue.length / remainingDaysToFinish));
      const subtopicsToTake = Math.min(queue.length, neededToday);

      for (let i = 0; i < subtopicsToTake; i++) {
        const task = queue.shift()!;
        itemsToday.push({
          id: `sched-${task.id}-${currentDate}`,
          date: currentDate,
          subjectId: task.subjectId,
          subjectName: task.subjectName,
          topicId: task.id,
          topicTitle: task.title,
          parentHeading: task.parentHeading,
          unitTitle: task.unitTitle,
          topicCode: task.topicCode,
          subtopicIndex: task.subtopicIndex,
          parentTopicId: task.parentTopicId,
          type: "new_study",
          completed: false,
          estimatedMinutes: task.estimatedMinutes,
        });
        scheduledTodayCount++;
      }
    }

    if (scheduledTodayCount === 0) break;

    // Interleave tasks if multiple subjects scheduled today for balanced cognitive load
    schedule.push(...itemsToday);

    currentDate = addDays(currentDate, 1);
  }

  return schedule;
}

/**
 * Subject pacing analysis for AI Schedule Engine:
 * Computes estimated completion, 2-3 day mock exam buffers, and daily subtopic pacing.
 */
export interface SubjectPaceEstimate {
  subjectId: string;
  subjectName: string;
  totalSubtopics: number;
  pendingSubtopics: number;
  targetDate: string; // Target deadline
  bufferDays: number; // 2 or 3 days buffer
  targetFinishDate: string; // targetDate - bufferDays
  projectedFinishDate: string;
  dailySubtopicsPace: number;
  isOnTrack: boolean;
  daysEarly: number; // days finished before target deadline
}

export interface WhatIfResult {
  totalPendingTopics: number;
  totalDaysNeeded: number;
  projectedFinishDate: string;
  subjectEstimates: SubjectPaceEstimate[];
}

export function simulateScheduleOutcome(
  subjects: Subject[],
  _topicsPerDay?: number,
  _subjectsPerDay?: number,
  startDate: string = getTodayString()
): WhatIfResult {
  const simulatedSchedule = generateSmartStudySchedule(subjects, 0, 0, startDate);

  const finishDatesBySubject = new Map<string, string>();
  for (const item of simulatedSchedule) {
    finishDatesBySubject.set(item.subjectId, item.date);
  }

  let totalPending = 0;
  const subjectEstimates: SubjectPaceEstimate[] = subjects.map((sub) => {
    const allTasks = extractAtomicTasksFromSubject(sub);
    const pendingTasks = allTasks.filter((t) => !t.completed);
    totalPending += pendingTasks.length;

    const bufferDays = calculateSubjectBufferDays(startDate, sub.targetDate);
    const targetFinishDate = addDays(sub.targetDate, -bufferDays);
    const projectedFinish = finishDatesBySubject.get(sub.id) || startDate;
    const availableDays = Math.max(1, daysBetween(startDate, targetFinishDate));
    const dailySubtopicsPace = Math.max(1, Math.ceil(pendingTasks.length / availableDays));
    const daysEarly = daysBetween(projectedFinish, sub.targetDate);

    return {
      subjectId: sub.id,
      subjectName: sub.name,
      totalSubtopics: allTasks.length,
      pendingSubtopics: pendingTasks.length,
      targetDate: sub.targetDate,
      bufferDays,
      targetFinishDate,
      projectedFinishDate: projectedFinish,
      dailySubtopicsPace,
      isOnTrack: daysEarly >= 2, // finishes at least 2 days before deadline
      daysEarly,
    };
  });

  const lastScheduleItem = simulatedSchedule[simulatedSchedule.length - 1];
  const projectedFinishDate = lastScheduleItem ? lastScheduleItem.date : startDate;
  const totalDaysNeeded = Math.max(0, daysBetween(startDate, projectedFinishDate));

  return {
    totalPendingTopics: totalPending,
    totalDaysNeeded,
    projectedFinishDate,
    subjectEstimates,
  };
}

/**
 * Helper to resolve either a full topic or an atomic subtopic schedule item into
 * an actionable Topic object for study, quizzes, AI tutoring, and notebook dossiers.
 */
export function findTopicOrSubtopic(
  subjects: Subject[],
  item: { subjectId: string; topicId: string; topicTitle?: string; parentHeading?: string; unitTitle?: string; topicCode?: string; estimatedMinutes?: number; completed?: boolean }
): Topic | undefined {
  const sub = subjects.find((s) => s.id === item.subjectId);
  if (!sub) return undefined;

  // Direct match in subject's topics
  const exact = sub.topics.find((t) => t.id === item.topicId);
  if (exact) return exact;

  // If item.topicId is a subtopic like `${t.id}-sub-${idx}`
  const parentTopic = sub.topics.find((t) => item.topicId.startsWith(t.id));
  if (parentTopic) {
    return {
      ...parentTopic,
      id: item.topicId,
      title: item.topicTitle || parentTopic.title,
      parentHeading: item.parentHeading || parentTopic.title,
      unitTitle: item.unitTitle || parentTopic.unitTitle,
      topicCode: item.topicCode || parentTopic.topicCode,
      description: `Atomic study task: "${item.topicTitle || parentTopic.title}" under ${item.parentHeading || parentTopic.title}.`,
      keyConcepts: [item.topicTitle || parentTopic.title, ...(parentTopic.keyConcepts || [])],
      subtopics: [item.topicTitle || parentTopic.title],
      estimatedMinutes: item.estimatedMinutes || Math.round(parentTopic.estimatedMinutes / Math.max(1, parentTopic.subtopics?.length || 1)),
      status: item.completed ? "completed" : "studying",
    };
  }

  // Fallback: match by title
  const byTitle = sub.topics.find((t) => t.title === item.topicTitle);
  if (byTitle) return byTitle;

  return undefined;
}

