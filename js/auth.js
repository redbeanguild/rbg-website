// ============================================================
// auth.js — Supabase client + authentication helpers
// Handles signup, login, logout, and session management
// ============================================================

// Your Supabase project credentials (safe to expose — these are public/anon keys)
const SUPABASE_URL = 'https://kaqezjdfsudmiijvpozt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcWV6amRmc3VkbWlpanZwb3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzE4MzcsImV4cCI6MjA4Nzc0NzgzN30.Ko6etB2AWlc0PGfu7Cm1XqcC3OFS3NiBQOjdKWYd1ww';

// Initialize the Supabase client
// This is our connection to the database and auth system
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- SIGN UP ----
// Creates a new account with email + password
// Supabase will send a confirmation email by default
async function signUp(email, password) {
  const { data, error } = await sbClient.auth.signUp({
    email: email,
    password: password,
    options: {
      emailRedirectTo: 'https://redbeanguild.com/profile.html',
    },
  });

  if (error) throw error;
  return data;
}

// ---- SIGN IN ----
// Logs in an existing user with email + password
async function signIn(email, password) {
  const { data, error } = await sbClient.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) throw error;
  return data;
}

// ---- SIGN OUT ----
// Ends the current session
async function signOut() {
  const { error } = await sbClient.auth.signOut();
  if (error) throw error;
}

// ---- GET CURRENT USER ----
// Returns the logged-in user (or null if not logged in)
async function getCurrentUser() {
  const { data: { user } } = await sbClient.auth.getUser();
  return user;
}

// ---- GET PROFILE ----
// Fetches the user's profile data from the profiles table
async function getProfile(userId) {
  const { data, error } = await sbClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

// ---- UPDATE PROFILE ----
// Updates specific fields on the user's profile
// Usage: updateProfile(userId, { wallet_address: '0x...', owns_happi: true })
async function updateProfile(userId, updates) {
  const { data, error } = await sbClient
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- AUTH STATE LISTENER ----
// Calls your callback whenever the user logs in or out
// Usage: onAuthChange((event, session) => { ... })
function onAuthChange(callback) {
  sbClient.auth.onAuthStateChange(callback);
}

// ---- REQUIRE AUTH (redirect if not logged in) ----
// Call this at the top of protected pages (like profile.html)
// If user is not logged in, sends them to login.html
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ---- CHECK IF LOGGED IN (for nav updates) ----
// Returns true/false — use this on index.html to show "SIGN IN" vs "PROFILE"
async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}

// ---- RESET PASSWORD ----
// Sends a password-reset email via Supabase.
// The user receives a magic link; clicking it lets them set a new password.
// redirectTo ensures the magic link points to the production domain, not localhost.
async function resetPassword(email) {
  const { error } = await sbClient.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://redbeanguild.com/login.html',
  });
  if (error) throw error;
}
