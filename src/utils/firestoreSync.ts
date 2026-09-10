import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  Subject,
  DailyScheduleItem,
  EbbinghausRevisionItem,
  CommunityPost,
  User,
  UserPreferences,
} from "../types";

// User Profile Firestore Sync
export async function syncUserProfileToCloud(user: User): Promise<void> {
  try {
    const userRef = doc(db, "users", user.id);
    await setDoc(
      userRef,
      {
        ...user,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error("Firestore: Error syncing user profile:", err);
  }
}

export async function fetchUserProfileFromCloud(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as User;
    }
  } catch (err) {
    console.error("Firestore: Error fetching user profile:", err);
  }
  return null;
}

// User Subjects Sync
export async function syncSubjectsToCloud(userId: string, subjects: Subject[]): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        subjects,
        lastSubjectsSync: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore: Sync subjects notice:", err);
  }
}

export async function fetchSubjectsFromCloud(userId: string): Promise<Subject[] | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data().subjects) {
      return snap.data().subjects as Subject[];
    }
  } catch (err) {
    console.warn("Firestore: Fetch subjects notice:", err);
  }
  return null;
}

// User Schedule Sync
export async function syncScheduleToCloud(
  userId: string,
  schedule: DailyScheduleItem[]
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        schedule,
        lastScheduleSync: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore: Sync schedule notice:", err);
  }
}

export async function fetchScheduleFromCloud(userId: string): Promise<DailyScheduleItem[] | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data().schedule) {
      return snap.data().schedule as DailyScheduleItem[];
    }
  } catch (err) {
    console.warn("Firestore: Fetch schedule notice:", err);
  }
  return null;
}

// User Revisions Sync
export async function syncRevisionsToCloud(
  userId: string,
  revisions: EbbinghausRevisionItem[]
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        revisions,
        lastRevisionsSync: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore: Sync revisions notice:", err);
  }
}

export async function fetchRevisionsFromCloud(
  userId: string
): Promise<EbbinghausRevisionItem[] | null> {
  try {
    const userDocRef = doc(db, "users", userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data().revisions) {
      return snap.data().revisions as EbbinghausRevisionItem[];
    }
  } catch (err) {
    console.warn("Firestore: Fetch revisions notice:", err);
  }
  return null;
}

// User Preferences Sync
export async function syncPreferencesToCloud(
  userId: string,
  preferences: UserPreferences
): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await setDoc(
      userDocRef,
      {
        preferences,
        lastPreferencesSync: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore: Sync preferences notice:", err);
  }
}

// Community Posts Real-Time Sync
export async function syncCommunityPostToCloud(post: CommunityPost): Promise<void> {
  try {
    const postRef = doc(db, "communityPosts", post.id);
    await setDoc(postRef, post, { merge: true });
  } catch (err) {
    console.warn("Firestore: Save community post notice:", err);
  }
}

export function subscribeToCommunityPosts(
  onUpdate: (posts: CommunityPost[]) => void
): () => void {
  try {
    const postsCol = collection(db, "communityPosts");
    const q = query(postsCol, limit(50));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: CommunityPost[] = [];
          snapshot.forEach((d) => {
            list.push(d.data() as CommunityPost);
          });
          onUpdate(list);
        }
      },
      (err) => {
        console.warn("Firestore: Community posts listener notice:", err);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}
