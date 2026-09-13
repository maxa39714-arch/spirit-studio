// ---------- Shared auth logic ----------
import { auth, googleProvider, ADMIN_EMAILS } from "./firebase-config.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export function isAdmin(user){
  if (!user || !user.email) return false;
  const email = user.email.toLowerCase();
  return ADMIN_EMAILS.some(e => e.toLowerCase() === email);
}

// Sign in with Google, then route based on whether it's the admin account.
export async function signInWithGoogle(onError){
  try{
    const result = await signInWithPopup(auth, googleProvider);
    if (isAdmin(result.user)){
      window.location.href = "admin.html";
    } else {
      window.location.href = "home.html";
    }
  } catch (err){
    console.error("Google sign-in failed:", err);
    if (onError) onError(err);
  }
}

export function signOutUser(){
  return signOut(auth);
}

// Guard for admin.html — call this at the top of the admin page.
// Redirects non-admins away instead of showing them the panel.
export function guardAdminPage(){
  onAuthStateChanged(auth, (user) => {
    if (!isAdmin(user)){
      window.location.href = "index.html";
    }
  });
}

// Lets any page react to sign-in state (e.g. header showing avatar vs Sign In).
export function watchAuthState(callback){
  onAuthStateChanged(auth, callback);
}
