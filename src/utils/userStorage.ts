import {
  Subject,
  DailyScheduleItem,
  EbbinghausRevisionItem,
  UserPreferences,
} from "../types";
import {
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULE,
  INITIAL_REVISIONS,
  INITIAL_PREFERENCES,
} from "./initialData";

export const DEMO_USER_ID = "usr-alex-morgan";

/**
 * Checks if a given userId corresponds to the pre-seeded Demo Student (Alex Morgan)
 */
export function isDemoUser(userId?: string | null): boolean {
  if (!userId) return false;
  return (
    userId === DEMO_USER_ID ||
    userId.toLowerCase() === "alex.morgan@studysync.edu" ||
    userId === "usr-alex"
  );
}

/**
 * Checks whether a subjects array is purely the pre-seeded demo subjects
 */
function isDemoSubjectsArray(subs: Subject[]): boolean {
  if (!Array.isArray(subs) || subs.length === 0) return false;
  return subs.every((s) => s.id === "sub-1" || s.id === "sub-2");
}

export function loadUserScopedSubjects(userId?: string | null): Subject[] {
  if (!userId) return [];

  // Scoped key
  const key = `studysync_subjects_${userId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // If this is a non-demo user and the array was contaminated with demo subjects (sub-1/sub-2), clear it
        if (!isDemoUser(userId) && isDemoSubjectsArray(parsed)) {
          localStorage.removeItem(key);
          return [];
        }
        return parsed;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  // If this is the demo user (Alex Morgan), load the demo subjects
  if (isDemoUser(userId)) {
    return INITIAL_SUBJECTS;
  }

  // Any new registered student starts completely fresh with 0 subjects
  return [];
}

export function loadUserScopedSchedule(userId?: string | null): DailyScheduleItem[] {
  if (!userId) return [];

  const key = `studysync_schedule_${userId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (!isDemoUser(userId) && parsed.every((s) => s.subjectId === "sub-1" || s.subjectId === "sub-2")) {
          localStorage.removeItem(key);
          return [];
        }
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  if (isDemoUser(userId)) {
    return INITIAL_SCHEDULE;
  }

  return [];
}

export function loadUserScopedRevisions(userId?: string | null): EbbinghausRevisionItem[] {
  if (!userId) return [];

  const key = `studysync_revisions_${userId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        if (!isDemoUser(userId) && parsed.every((r) => r.subjectId === "sub-1" || r.subjectId === "sub-2")) {
          localStorage.removeItem(key);
          return [];
        }
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  if (isDemoUser(userId)) {
    return INITIAL_REVISIONS;
  }

  return [];
}

export function loadUserScopedPreferences(userId?: string | null): UserPreferences {
  if (!userId) return INITIAL_PREFERENCES;

  const key = `studysync_preferences_${userId}`;
  const saved = localStorage.getItem(key);

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }

  if (isDemoUser(userId)) {
    return INITIAL_PREFERENCES;
  }

  return {
    preferredStudyTime: "18:30",
    topicsPerDay: 2,
    subjectsPerDay: 2,
    notificationsEnabled: true,
    notificationPermission: "default",
    streakDays: 1,
  };
}

export function saveUserScopedSubjects(userId: string, subjects: Subject[]): void {
  try {
    localStorage.setItem(`studysync_subjects_${userId}`, JSON.stringify(subjects));
  } catch (err) {
    console.error("Failed to save user-scoped subjects:", err);
  }
}

export function saveUserScopedSchedule(userId: string, schedule: DailyScheduleItem[]): void {
  try {
    localStorage.setItem(`studysync_schedule_${userId}`, JSON.stringify(schedule));
  } catch (err) {
    console.error("Failed to save user-scoped schedule:", err);
  }
}

export function saveUserScopedRevisions(userId: string, revisions: EbbinghausRevisionItem[]): void {
  try {
    localStorage.setItem(`studysync_revisions_${userId}`, JSON.stringify(revisions));
  } catch (err) {
    console.error("Failed to save user-scoped revisions:", err);
  }
}

export function saveUserScopedPreferences(userId: string, preferences: UserPreferences): void {
  try {
    localStorage.setItem(`studysync_preferences_${userId}`, JSON.stringify(preferences));
  } catch (err) {
    console.error("Failed to save user-scoped preferences:", err);
  }
}
