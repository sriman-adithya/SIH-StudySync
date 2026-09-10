import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  Brain,
  Users,
  Award,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  Subject,
  Topic,
  DailyScheduleItem,
  EbbinghausRevisionItem,
  UserPreferences,
  CommunityPost,
  AchievementBadge,
  User,
} from "./types";
import {
  INITIAL_SUBJECTS,
  INITIAL_SCHEDULE,
  INITIAL_REVISIONS,
  INITIAL_PREFERENCES,
  INITIAL_POSTS,
  INITIAL_BADGES,
} from "./utils/initialData";
import {
  getTodayString,
  adjustScheduleForRemainingDays,
  generateSchedule,
  generateEbbinghausRevisions,
} from "./utils/scheduler";
import {
  getCurrentUser,
  setCurrentUser as saveCurrentUser,
  userSignOut,
} from "./utils/auth";
import {
  syncSubjectsToCloud,
  fetchSubjectsFromCloud,
  syncScheduleToCloud,
  fetchScheduleFromCloud,
  syncRevisionsToCloud,
  fetchRevisionsFromCloud,
  syncPreferencesToCloud,
  syncCommunityPostToCloud,
  subscribeToCommunityPosts,
} from "./utils/firestoreSync";
import {
  loadUserScopedSubjects,
  loadUserScopedSchedule,
  loadUserScopedRevisions,
  loadUserScopedPreferences,
  saveUserScopedSubjects,
  saveUserScopedSchedule,
  saveUserScopedRevisions,
  saveUserScopedPreferences,
  isDemoUser,
} from "./utils/userStorage";

// Components
import { Header } from "./components/Header";
import { TodayDashboard } from "./components/TodayDashboard";
import { CalendarView } from "./components/CalendarView";
import { SubjectsManager } from "./components/SubjectsManager";
import { CommunityHub } from "./components/CommunityHub";
import { BadgesAndStreakModal } from "./components/BadgesAndStreakModal";
import { QuizMasteryModal } from "./components/QuizMasteryModal";
import { EbbinghausRevisionModal } from "./components/EbbinghausRevisionModal";
import { ScheduleSimulatorModal } from "./components/ScheduleSimulatorModal";
import { NotificationSettingsModal } from "./components/NotificationSettingsModal";
import { AuthView } from "./components/AuthView";
import { UserProfileModal } from "./components/UserProfileModal";

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");

  // --- User-Scoped Persistent States ---
  // Demo user Alex Morgan gets initial subjects; newly registered students start with a clean slate
  const [subjects, setSubjects] = useState<Subject[]>(() =>
    loadUserScopedSubjects(currentUser?.id)
  );

  const [schedule, setSchedule] = useState<DailyScheduleItem[]>(() =>
    loadUserScopedSchedule(currentUser?.id)
  );

  const [revisions, setRevisions] = useState<EbbinghausRevisionItem[]>(() =>
    loadUserScopedRevisions(currentUser?.id)
  );

  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    loadUserScopedPreferences(currentUser?.id)
  );

  const [posts, setPosts] = useState<CommunityPost[]>(() => {
    const saved = localStorage.getItem("studysync_posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [badges, setBadges] = useState<AchievementBadge[]>(() => {
    const saved = localStorage.getItem("studysync_badges");
    return saved ? JSON.parse(saved) : INITIAL_BADGES;
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "today" | "calendar" | "subjects" | "community" | "badges"
  >("today");

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeQuizTopic, setActiveQuizTopic] = useState<{
    topic: Topic;
    subjectName: string;
  } | null>(null);
  const [activeRevision, setActiveRevision] = useState<EbbinghausRevisionItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    text: string;
    type: "success" | "info" | "warning";
  } | null>(null);

  const showToast = (title: string, text: string, type: "success" | "info" | "warning" = "success") => {
    setToastMessage({ title, text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Sync state to user-scoped localStorage and Cloud Firestore
  useEffect(() => {
    if (currentUser?.id) {
      saveUserScopedSubjects(currentUser.id, subjects);
      syncSubjectsToCloud(currentUser.id, subjects);
    }
  }, [subjects, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserScopedSchedule(currentUser.id, schedule);
      syncScheduleToCloud(currentUser.id, schedule);
    }
  }, [schedule, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserScopedRevisions(currentUser.id, revisions);
      syncRevisionsToCloud(currentUser.id, revisions);
    }
  }, [revisions, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id) {
      saveUserScopedPreferences(currentUser.id, preferences);
      syncPreferencesToCloud(currentUser.id, preferences);
    }
  }, [preferences, currentUser?.id]);

  useEffect(() => {
    localStorage.setItem("studysync_posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("studysync_badges", JSON.stringify(badges));
  }, [badges]);

  // Synchronize state when currentUser changes (e.g. login, switch account, sign out)
  useEffect(() => {
    const uid = currentUser?.id;
    if (!uid) {
      setSubjects([]);
      setSchedule([]);
      setRevisions([]);
      return;
    }

    // 1. Immediately switch to current user's scoped local data
    const localSubs = loadUserScopedSubjects(uid);
    const localSched = loadUserScopedSchedule(uid);
    const localRevs = loadUserScopedRevisions(uid);
    const localPrefs = loadUserScopedPreferences(uid);

    setSubjects(localSubs);
    setSchedule(localSched);
    setRevisions(localRevs);
    setPreferences(localPrefs);

    // 2. Fetch from Cloud Firestore
    let isMounted = true;

    async function loadCloudData() {
      try {
        const [cloudSubs, cloudSched, cloudRevs] = await Promise.all([
          fetchSubjectsFromCloud(uid!),
          fetchScheduleFromCloud(uid!),
          fetchRevisionsFromCloud(uid!),
        ]);

        if (!isMounted) return;

        // Ensure demo subjects never contaminate a new non-demo user's account in cloud
        if (cloudSubs) {
          const isDemoData =
            !isDemoUser(uid) && cloudSubs.every((s) => s.id === "sub-1" || s.id === "sub-2");
          if (isDemoData) {
            setSubjects([]);
            saveUserScopedSubjects(uid!, []);
            syncSubjectsToCloud(uid!, []);
          } else {
            setSubjects(cloudSubs);
            saveUserScopedSubjects(uid!, cloudSubs);
          }
        }

        if (cloudSched) {
          const isDemoData =
            !isDemoUser(uid) &&
            cloudSched.every((s) => s.subjectId === "sub-1" || s.subjectId === "sub-2");
          if (isDemoData) {
            setSchedule([]);
            saveUserScopedSchedule(uid!, []);
            syncScheduleToCloud(uid!, []);
          } else {
            setSchedule(cloudSched);
            saveUserScopedSchedule(uid!, cloudSched);
          }
        }

        if (cloudRevs) {
          const isDemoData =
            !isDemoUser(uid) &&
            cloudRevs.every((r) => r.subjectId === "sub-1" || r.subjectId === "sub-2");
          if (isDemoData) {
            setRevisions([]);
            saveUserScopedRevisions(uid!, []);
            syncRevisionsToCloud(uid!, []);
          } else {
            setRevisions(cloudRevs);
            saveUserScopedRevisions(uid!, cloudRevs);
          }
        }
      } catch (err) {
        console.warn("Cloud data fetch notice:", err);
      }
    }

    loadCloudData();

    const unsub = subscribeToCommunityPosts((cloudPosts) => {
      if (!isMounted) return;
      setPosts((prev) => {
        const map = new Map<string, CommunityPost>();
        cloudPosts.forEach((p) => map.set(p.id, p));
        prev.forEach((p) => {
          if (!map.has(p.id)) map.set(p.id, p);
        });
        return Array.from(map.values());
      });
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser?.id]);

  // Derive Today's items
  const todayStr = getTodayString();
  const todaySchedule = schedule.filter((s) => s.date === todayStr);
  const todayRevisions = revisions.filter((r) => r.scheduledDate === todayStr);
  const overdueSchedule = schedule.filter((s) => s.date < todayStr && !s.completed);

  // --- Handlers ---

  // Adjust schedule for missed days
  const handleAdjustSchedule = () => {
    const updatedSchedule = adjustScheduleForRemainingDays(subjects, schedule);
    setSchedule(updatedSchedule);
    showToast(
      "AI Schedule Balanced!",
      "Uncompleted subtopics have been dynamically rebalanced across your remaining study days to finish 2–3 days before each deadline.",
      "info"
    );
  };

  // When a topic/subtopic quiz is passed (score >= 75%)
  const handleTopicCompleted = (topicId: string, score: number) => {
    // 1. Mark schedule item as completed
    const scheduleItem = schedule.find((item) => item.topicId === topicId);
    const updatedSchedule = schedule.map((item) =>
      item.topicId === topicId ? { ...item, completed: true } : item
    );
    setSchedule(updatedSchedule);

    // 2. Mark topic completed in subject
    let parentSubject: Subject | undefined;
    let completedTaskTitle = scheduleItem?.topicTitle || "Subtopic";

    const updatedSubjects = subjects.map((sub) => {
      const targetTopic = sub.topics.find(
        (t) => t.id === topicId || (topicId.startsWith(t.id) && topicId.includes("-sub-"))
      );
      if (targetTopic) {
        parentSubject = sub;
        // Check if all subtopics for this topic are now completed in the schedule
        const otherSubtopicsPending = updatedSchedule.some(
          (s) =>
            s.subjectId === sub.id &&
            s.topicId !== topicId &&
            s.topicId.startsWith(targetTopic.id) &&
            !s.completed
        );

        if (!otherSubtopicsPending) {
          return {
            ...sub,
            topics: sub.topics.map((t) =>
              t.id === targetTopic.id ? { ...t, status: "completed" as const } : t
            ),
          };
        }
      }
      return sub;
    });

    setSubjects(updatedSubjects);

    // 3. Automatically schedule 5 Ebbinghaus spaced repetitions (+1, +3, +7, +14, +30 days)
    if (parentSubject) {
      const newRevisions = generateEbbinghausRevisions(
        topicId,
        completedTaskTitle,
        parentSubject.id,
        parentSubject.name,
        todayStr
      );

      setRevisions((prev) => [...prev, ...newRevisions]);
    }

    // 4. Update Badges & Streaks
    setBadges((prevBadges) =>
      prevBadges.map((b) => {
        if (b.id === "b-first-step") return { ...b, unlocked: true, currentCount: 1 };
        if (b.id === "b-mastery-king") {
          const newCount = b.currentCount + 1;
          return {
            ...b,
            currentCount: newCount,
            unlocked: newCount >= b.targetCount,
          };
        }
        return b;
      })
    );

    showToast(
      "Subtopic Mastered!",
      `Passed with ${score}%. 5 Ebbinghaus spaced repetition dates have been added to your calendar!`,
      "success"
    );
  };

  // When an Ebbinghaus recall revision is evaluated
  const handleCompleteRevision = (
    revisionId: string,
    evaluation: {
      score: number;
      feedback: string;
      pointsRemembered: string[];
      pointsMissed: string[];
    }
  ) => {
    const updatedRevisions = revisions.map((r) =>
      r.id === revisionId
        ? {
            ...r,
            status: "completed" as const,
            evaluationScore: evaluation.score,
            userRecallText: evaluation.feedback,
          }
        : r
    );
    setRevisions(updatedRevisions);

    // Update Ebbinghaus badge
    setBadges((prevBadges) =>
      prevBadges.map((b) => {
        if (b.id === "b-memory-titan") {
          const newCount = b.currentCount + 1;
          return {
            ...b,
            currentCount: newCount,
            unlocked: newCount >= b.targetCount,
          };
        }
        return b;
      })
    );

    showToast(
      "Memory Synapses Strengthened!",
      `AI evaluated active recall score: ${evaluation.score}%. Your retention curve is stabilized.`,
      "success"
    );
  };

  // Add new Subject
  const handleAddSubject = (newSubject: Subject) => {
    const updatedSubjects = [...subjects, newSubject];
    setSubjects(updatedSubjects);

    // AI Autonomous Schedule: Rebalances all active subjects across calendar
    // ensuring each finishes 2-3 days before its target deadline, while leaving revisions untouched!
    const newFullSchedule = adjustScheduleForRemainingDays(updatedSubjects, schedule);
    setSchedule(newFullSchedule);

    showToast(
      "AI Autonomous Schedule Updated!",
      `${newSubject.name} integrated. Subtopics automatically rebalanced across your calendar to complete 2–3 days before each deadline.`,
      "success"
    );
  };

  // Delete Subject
  const handleDeleteSubject = (subjectId: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== subjectId);
    setSubjects(updatedSubjects);
    const updatedSchedule = adjustScheduleForRemainingDays(
      updatedSubjects,
      schedule.filter((item) => item.subjectId !== subjectId)
    );
    setSchedule(updatedSchedule);
    setRevisions((prev) => prev.filter((rev) => rev.subjectId !== subjectId));
    showToast("Subject Removed", "Remaining subjects rebalanced across calendar.", "info");
  };

  // Community Hub Handlers
  const handleAddPost = (
    newPost: Omit<CommunityPost, "id" | "createdAt" | "likes" | "replies">
  ) => {
    const postObj: CommunityPost = {
      ...newPost,
      author: currentUser ? currentUser.name : "Alex Morgan",
      authorAvatar: currentUser ? currentUser.avatarInitials : "AM",
      id: `post-${Date.now()}`,
      createdAt: "Just now",
      likes: 0,
      replies: [],
    };
    setPosts((prev) => [postObj, ...prev]);
    syncCommunityPostToCloud(postObj);
    showToast("Posted to Community", "Your discussion post is now live and synced to Cloud.", "success");
  };

  const handleEditPost = (postId: string, newContent: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, content: newContent } : p))
    );
    showToast("Post Updated", "Your message edits have been saved.", "info");
  };

  const handleDeletePost = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Message Unsent", "Your post was completely removed from the discussion.", "info");
  };

  const handleAddReply = (postId: string, content: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            replies: [
              ...p.replies,
              {
                id: `rep-${Date.now()}`,
                author: currentUser ? `${currentUser.name} (You)` : "Alex Morgan (You)",
                content,
                createdAt: "Just now",
              },
            ],
          };
        }
        return p;
      })
    );
    showToast("Reply Sent", "Your reply was posted.", "success");
  };

  const handleToggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = !p.likedByMe;
          return {
            ...p,
            likedByMe: liked,
            likes: liked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      })
    );
  };

  // Counts for Badges modal
  const totalTopicsMastered = subjects.reduce(
    (acc, sub) => acc + sub.topics.filter((t) => t.status === "completed").length,
    0
  );
  const totalRevisionsDone = revisions.filter((r) => r.status === "completed").length;

  // If user is not logged in, render the comprehensive Authentication portal
  if (!currentUser) {
    return (
      <AuthView
        initialMode={authInitialMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          saveCurrentUser(user);
          showToast("Welcome back!", `Signed in as ${user.name}.`, "success");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        streakCount={preferences.streakDays || 3}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        unreadNotificationCount={overdueSchedule.length > 0 ? overdueSchedule.length : 0}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenAuth={() => {
          setAuthInitialMode("login");
          setCurrentUser(null);
          saveCurrentUser(null);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "today" && (
          <TodayDashboard
            todaySchedule={todaySchedule}
            todayRevisions={todayRevisions}
            overdueItems={overdueSchedule}
            subjects={subjects}
            onOpenTopic={(topic, subjectName) => setActiveQuizTopic({ topic, subjectName })}
            onOpenRevision={(rev) => setActiveRevision(rev)}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            onAdjustSchedule={handleAdjustSchedule}
            onMarkTopicDone={(topicId) => handleTopicCompleted(topicId, 85)}
            preferredTime={preferences.preferredStudyTime}
            streakCount={preferences.streakDays}
            onNavigateToSubjects={() => setActiveTab("subjects")}
            studentName={currentUser?.name}
          />
        )}

        {activeTab === "calendar" && (
          <CalendarView
            schedule={schedule}
            revisions={revisions}
            subjects={subjects}
            onOpenTopic={(topic, subjectName) => setActiveQuizTopic({ topic, subjectName })}
            onOpenRevision={(rev) => setActiveRevision(rev)}
          />
        )}

        {activeTab === "subjects" && (
          <SubjectsManager
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onDeleteSubject={handleDeleteSubject}
            onOpenTopic={(topic, subjectName) => setActiveQuizTopic({ topic, subjectName })}
          />
        )}

        {activeTab === "community" && (
          <CommunityHub
            posts={posts}
            onAddPost={handleAddPost}
            onEditPost={handleEditPost}
            onDeletePost={handleDeletePost}
            onAddReply={handleAddReply}
            onToggleLike={handleToggleLike}
          />
        )}

        {activeTab === "badges" && (
          <BadgesAndStreakModal
            badges={badges}
            streakCount={preferences.streakDays}
            totalTopicsMastered={totalTopicsMastered}
            totalRevisionsDone={totalRevisionsDone}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab("today")}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === "today" ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>Today</span>
        </button>

        <button
          onClick={() => setActiveTab("calendar")}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === "calendar" ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          <CalendarIcon className="w-5 h-5 mb-0.5" />
          <span>Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === "subjects" ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>Subjects</span>
        </button>

        <button
          onClick={() => setActiveTab("community")}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === "community" ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Community</span>
        </button>

        <button
          onClick={() => setActiveTab("badges")}
          className={`flex flex-col items-center py-1 px-2 text-[10px] font-bold ${
            activeTab === "badges" ? "text-indigo-600" : "text-slate-700"
          }`}
        >
          <Award className="w-5 h-5 mb-0.5" />
          <span>Badges</span>
        </button>
      </div>

      {/* MODALS */}

      {/* Quiz Mastery & Study Notes Modal */}
      {activeQuizTopic && (
        <QuizMasteryModal
          isOpen={!!activeQuizTopic}
          onClose={() => setActiveQuizTopic(null)}
          topic={activeQuizTopic.topic}
          subjectName={activeQuizTopic.subjectName}
          onTopicMastered={(score) => handleTopicCompleted(activeQuizTopic.topic.id, score)}
        />
      )}

      {/* Ebbinghaus Active Recall Revision Modal */}
      {activeRevision && (
        <EbbinghausRevisionModal
          isOpen={!!activeRevision}
          onClose={() => setActiveRevision(null)}
          revision={activeRevision}
          onCompleteRevision={handleCompleteRevision}
        />
      )}

      {/* AI Autonomous Schedule Engine Modal */}
      <ScheduleSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        subjects={subjects}
        currentPreferences={preferences}
        onApplySimulation={() => {
          const recomputed = adjustScheduleForRemainingDays(subjects, schedule);
          setSchedule(recomputed);
          showToast(
            "AI Schedule Synchronized!",
            "All active subjects rebalanced. Daily subtopics scheduled to finish 2–3 days before each deadline for mock exams.",
            "success"
          );
        }}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        preferences={preferences}
        onSavePreferences={(updated) => {
          setPreferences((prev) => ({ ...prev, ...updated }));
          showToast("Notification Settings Saved", "Your daily reminder schedule is updated.", "info");
        }}
      />

      {/* Student Profile & Credentials Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUserUpdated={(updated) => {
            setCurrentUser(updated);
            saveCurrentUser(updated);
            showToast("Profile Updated", "Your student profile was saved.", "success");
          }}
          onLogout={async () => {
            await userSignOut();
            setCurrentUser(null);
            saveCurrentUser(null);
            setIsProfileModalOpen(false);
            showToast("Signed Out", "You have been logged out of StudySync.", "info");
          }}
        />
      )}

      {/* Global In-App Toast */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="shrink-0 mt-0.5">
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : toastMessage.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.text}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
