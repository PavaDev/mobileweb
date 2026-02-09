import { auth } from "@/firebase";
import { signInAnonymously, onAuthStateChanged } from "firebase/auth";

/**
 * Ensure user is authenticated before app starts
 */
export function initAuth(): Promise<void> {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        unsub();
        resolve();
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth failed:", err);
        reject(err);
      }
    });
  });
}
