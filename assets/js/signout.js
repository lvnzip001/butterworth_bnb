import supabase from './supabase-client.js';

document.getElementById('signout-btn').addEventListener('click', async () => {
  // Sign out the user from Supabase
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Sign-out failed:', error.message);
    return;
  }

  // Clear the session token from localStorage
  localStorage.removeItem('supabase.auth.token');

  // Redirect to the login page
  window.location.href = 'login.html';
});