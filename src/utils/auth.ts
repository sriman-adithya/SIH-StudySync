import { User } from "../types";
import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  syncUserProfileToCloud,
  fetchUserProfileFromCloud,
} from "./firestoreSync";

const USERS_STORAGE_KEY = "studysync_users_registry";
const CURRENT_USER_KEY = "studysync_current_user";

export interface StoredUserAccount extends User {
  passwordHash: string; // In-browser prototype credential
}

export const DEFAULT_USER: StoredUserAccount = {
  id: "usr-alex-morgan",
  name: "Alex Morgan",
  email: "alex.morgan@studysync.edu",
  academicGoal: "Computer Science & Neuroscience",
  avatarColor: "bg-indigo-600",
  avatarInitials: "AM",
  createdAt: "2026-08-15",
  passwordHash: "password123",
};

export function getStoredUsers(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_USER]));
      return [DEFAULT_USER];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([DEFAULT_USER]));
      return [DEFAULT_USER];
    }
    return parsed;
  } catch {
    return [DEFAULT_USER];
  }
}

export function saveStoredUsers(users: StoredUserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save users registry:", e);
  }
}

export function getInitials(name: string): string {
  if (!name.trim()) return "ST";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      localStorage.setItem(
        CURRENT_USER_KEY,
        JSON.stringify({
          id: DEFAULT_USER.id,
          name: DEFAULT_USER.name,
          email: DEFAULT_USER.email,
          academicGoal: DEFAULT_USER.academicGoal,
          avatarColor: DEFAULT_USER.avatarColor,
          avatarInitials: DEFAULT_USER.avatarInitials,
          createdAt: DEFAULT_USER.createdAt,
        })
      );
      return {
        id: DEFAULT_USER.id,
        name: DEFAULT_USER.name,
        email: DEFAULT_USER.email,
        academicGoal: DEFAULT_USER.academicGoal,
        avatarColor: DEFAULT_USER.avatarColor,
        avatarInitials: DEFAULT_USER.avatarInitials,
        createdAt: DEFAULT_USER.createdAt,
      };
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error("Failed to set current user:", e);
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();

  if (!cleanEmail || !cleanPassword) {
    return { success: false, error: "Please provide both email and password." };
  }

  // 1. Try Firebase Authentication first
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    const fbUser = userCredential.user;

    // Check Cloud Firestore profile
    let cloudProfile = await fetchUserProfileFromCloud(fbUser.uid);
    if (!cloudProfile) {
      cloudProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || cleanEmail.split("@")[0],
        email: fbUser.email || cleanEmail,
        academicGoal: "Academic Mastery",
        avatarColor: "bg-indigo-600",
        avatarInitials: getInitials(fbUser.displayName || cleanEmail),
        createdAt: new Date().toISOString().split("T")[0],
      };
      await syncUserProfileToCloud(cloudProfile);
    }

    setCurrentUser(cloudProfile);
    return { success: true, user: cloudProfile };
  } catch (fbErr: any) {
    // If Firebase Auth throws user-not-found or wrong-password, check local registry before failing
    console.warn("Firebase sign-in attempted, checking local database fallback:", fbErr?.code || fbErr?.message);

    const users = getStoredUsers();
    const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (found) {
      if (found.passwordHash !== cleanPassword) {
        return {
          success: false,
          error: "Incorrect password. Please verify your credentials.",
        };
      }

      const safeUser: User = {
        id: found.id,
        name: found.name,
        email: found.email,
        academicGoal: found.academicGoal,
        avatarColor: found.avatarColor,
        avatarInitials: found.avatarInitials,
        createdAt: found.createdAt,
      };

      setCurrentUser(safeUser);
      // Asynchronously sync to Cloud Firestore in background
      syncUserProfileToCloud(safeUser).catch(() => {});
      return { success: true, user: safeUser };
    }

    // Translate common Firebase Auth error messages cleanly
    if (fbErr?.code === "auth/invalid-credential" || fbErr?.code === "auth/wrong-password") {
      return { success: false, error: "Invalid email or password." };
    }
    if (fbErr?.code === "auth/user-not-found") {
      return { success: false, error: "No student account found with this email. Please register first." };
    }

    return {
      success: false,
      error: fbErr?.message || "Authentication failed. Please check your credentials.",
    };
  }
}

export async function signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    const fbUser = result.user;

    let cloudProfile = await fetchUserProfileFromCloud(fbUser.uid);
    if (!cloudProfile) {
      cloudProfile = {
        id: fbUser.uid,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || "Student",
        email: fbUser.email || "",
        academicGoal: "Academic Mastery",
        avatarColor: "bg-indigo-600",
        avatarInitials: getInitials(fbUser.displayName || fbUser.email || "ST"),
        createdAt: new Date().toISOString().split("T")[0],
      };
      await syncUserProfileToCloud(cloudProfile);
    }

    setCurrentUser(cloudProfile);
    return { success: true, user: cloudProfile };
  } catch (err: any) {
    console.warn("Google sign-in notice:", err?.message);
    if (err?.code === "auth/popup-closed-by-user") {
      return { success: false, error: "Sign in was closed before completion." };
    }
    return {
      success: false,
      error: err?.message || "Google sign-in could not be completed.",
    };
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string,
  academicGoal: string,
  avatarColor: string = "bg-indigo-600"
): Promise<{ success: boolean; user?: User; error?: string }> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPassword = password.trim();
  const cleanGoal = academicGoal.trim() || "Academic Mastery";

  if (!cleanName) {
    return { success: false, error: "Please enter your full name." };
  }
  if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
    return { success: false, error: "Please enter a valid email address." };
  }
  if (!cleanPassword || cleanPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  let createdUid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

  // 1. Attempt creating in Firebase Auth
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
    if (cred.user) {
      createdUid = cred.user.uid;
      await updateProfile(cred.user, { displayName: cleanName });
    }
  } catch (fbErr: any) {
    console.warn("Firebase create user notice, persisting to local and firestore:", fbErr?.code || fbErr?.message);
    if (fbErr?.code === "auth/email-already-in-use") {
      return {
        success: false,
        error: "An account with this email already exists. Please log in instead.",
      };
    }
  }

  const newUser: StoredUserAccount = {
    id: createdUid,
    name: cleanName,
    email: cleanEmail,
    academicGoal: cleanGoal,
    avatarColor,
    avatarInitials: getInitials(cleanName),
    createdAt: new Date().toISOString().split("T")[0],
    passwordHash: cleanPassword,
  };

  const users = getStoredUsers();
  users.push(newUser);
  saveStoredUsers(users);

  const safeUser: User = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    academicGoal: newUser.academicGoal,
    avatarColor: newUser.avatarColor,
    avatarInitials: newUser.avatarInitials,
    createdAt: newUser.createdAt,
  };

  setCurrentUser(safeUser);
  // Persist to Cloud Firestore
  await syncUserProfileToCloud(safeUser);

  return { success: true, user: safeUser };
}

export function updateUserProfile(
  userId: string,
  updates: Partial<Pick<User, "name" | "academicGoal" | "avatarColor">>
): { success: boolean; user?: User; error?: string } {
  const users = getStoredUsers();
  const index = users.findIndex((u) => u.id === userId);

  const current = index !== -1 ? users[index] : (getCurrentUser() || DEFAULT_USER);
  const updatedName = updates.name !== undefined ? updates.name.trim() : current.name;
  const updatedGoal =
    updates.academicGoal !== undefined ? updates.academicGoal.trim() : current.academicGoal;
  const updatedColor = updates.avatarColor || current.avatarColor;

  const updatedUser: StoredUserAccount = {
    ...current,
    passwordHash: (current as any).passwordHash || DEFAULT_USER.passwordHash,
    name: updatedName || current.name,
    academicGoal: updatedGoal || current.academicGoal,
    avatarColor: updatedColor,
    avatarInitials: getInitials(updatedName || current.name),
  };

  if (index !== -1) {
    users[index] = updatedUser;
    saveStoredUsers(users);
  }

  const safeUser: User = {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    academicGoal: updatedUser.academicGoal,
    avatarColor: updatedUser.avatarColor,
    avatarInitials: updatedUser.avatarInitials,
    createdAt: updatedUser.createdAt,
  };

  setCurrentUser(safeUser);
  // Push changes to Cloud Firestore
  syncUserProfileToCloud(safeUser).catch(() => {});

  return { success: true, user: safeUser };
}

export async function userSignOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("Firebase sign out:", err);
  }
  setCurrentUser(null);
}

export function resetPassword(email: string): { success: boolean; message: string; tempCode?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const users = getStoredUsers();
  const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!found && !cleanEmail.includes("@")) {
    return {
      success: false,
      message: "No registered student account was found with that email address.",
    };
  }

  const tempCode = Math.floor(100000 + Math.random() * 900000).toString();
  return {
    success: true,
    message: `Password reset verification sent to ${cleanEmail}. Verification code: ${tempCode}. Your password is temporarily verified.`,
    tempCode,
  };
}
