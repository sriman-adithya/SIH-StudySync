export type TopicStatus = "not_started" | "studying" | "passed_quiz" | "completed";

export interface User {
  id: string;
  name: string;
  email: string;
  academicGoal: string; // e.g. "Computer Science & Algorithms", "Medical Board Prep", "Semester Finals"
  avatarColor: string; // e.g. "bg-indigo-600"
  avatarInitials: string; // e.g. "AM"
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  moduleName: string;
  unitNumber?: number;
  unitTitle?: string;
  topicCode?: string; // e.g. "1.1", "1.2"
  parentHeading?: string; // e.g. "Introduction to Machine Learning"
  description: string;
  keyConcepts: string[];
  subtopics?: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  order: number;
  status: TopicStatus;
  quizScore?: number;
  completedAt?: string;
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  targetDate: string; // YYYY-MM-DD
  color: string;
  icon: string;
  resourceNames: string[];
  webLinks?: string[];
  rawNotes?: string;
  createdAt: string;
  topics: Topic[];
}

export interface UserPreferences {
  preferredStudyTime: string; // e.g. "08:30"
  topicsPerDay: number; // e.g. 2
  subjectsPerDay: number; // e.g. 2
  notificationsEnabled: boolean;
  notificationPermission: "default" | "granted" | "denied";
  streakDays?: number;
}

export interface EbbinghausRevisionItem {
  id: string;
  topicId: string;
  subjectId: string;
  topicTitle: string;
  subjectName: string;
  originalCompletionDate: string;
  scheduledDate: string; // YYYY-MM-DD
  stageNumber: number; // 1 to 5 (e.g., 1 = Day 1, 2 = Day 3, 3 = Day 7, 4 = Day 14, 5 = Day 30)
  intervalDays: number;
  status: "pending" | "completed";
  activeRecallText?: string;
  evaluationScore?: number;
  aiFeedback?: string;
  pointsRemembered?: string[];
  pointsMissed?: string[];
}

export interface DailyScheduleItem {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicTitle: string; // The subtopic / small topic title (daily task)
  parentHeading?: string; // The branch or heading of subtopics (e.g. "1.1 Variables and Data Types")
  subtopicTitle?: string;
  unitTitle?: string; // The unit / chapter heading
  topicCode?: string; // e.g. "1.1.1" or "1.1"
  subtopicIndex?: number;
  parentTopicId?: string;
  type: "new_study" | "ebbinghaus_revision";
  revisionStage?: number;
  completed: boolean;
  estimatedMinutes: number;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizSession {
  topicId: string;
  topicTitle: string;
  subjectName: string;
  questions: MCQQuestion[];
  passThresholdPercent: number; // default 75
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "consistency" | "mastery" | "ebbinghaus" | "community";
  unlocked: boolean;
  unlockedAt?: string;
  currentCount: number;
  targetCount: number;
}

export interface CommunityReply {
  id: string;
  author: string;
  authorAvatar: string;
  isCurrentUser: boolean;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  authorAvatar: string;
  isCurrentUser: boolean;
  subjectTag: string;
  topicTag?: string;
  type: "doubt" | "insight" | "resource";
  content: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  likedByMe?: boolean;
  replies: CommunityReply[];
}

export interface AlternativeResources {
  youtubeSuggestions: {
    title: string;
    channel: string;
    searchQuery: string;
    duration: string;
    reason: string;
  }[];
  notebookLmDossier: string;
  audioScript: string;
}
