// ============================================================
// auth.js — Supabase client + authentication helpers
// Uses magic-link (OTP) auth — no passwords stored or transmitted
// ============================================================

// Your Supabase project credentials (safe to expose — these are public/anon keys)
const SUPABASE_URL = 'https://kaqezjdfsudmiijvpozt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcWV6amRmc3VkbWlpanZwb3p0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNzE4MzcsImV4cCI6MjA4Nzc0NzgzN30.Ko6etB2AWlc0PGfu7Cm1XqcC3OFS3NiBQOjdKWYd1ww';

// Initialize the Supabase client
const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---- SIGN IN WITH MAGIC LINK ----
// Sends a one-time login link to the user's email.
// New users are auto-created; existing users just get a login link.
async function signInWithMagicLink(email) {
  const { data, error } = await sbClient.auth.signInWithOtp({
    email: email,
  });

  if (error) throw error;
  return data;
}

// ---- SIGN OUT ----
async function signOut() {
  const { error } = await sbClient.auth.signOut();
  if (error) throw error;
}

// ---- GET CURRENT USER ----
async function getCurrentUser() {
  const { data: { user } } = await sbClient.auth.getUser();
  return user;
}

// ---- GET PROFILE ----
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
function onAuthChange(callback) {
  sbClient.auth.onAuthStateChange(callback);
}

// ---- REQUIRE AUTH (redirect if not logged in) ----
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

// ---- CHECK IF LOGGED IN ----
async function isLoggedIn() {
  const user = await getCurrentUser();
  return !!user;
}
