import supabase from './supabase-client.js';

document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');

  if (!email || !password) {
    errorDiv.textContent = 'Please enter both email and password.';
    errorDiv.classList.remove('d-none');
    return;
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    errorDiv.textContent = 'Login failed: ' + error.message;
    errorDiv.classList.remove('d-none');
    return;
  }

  // Store the session token in localStorage for auth checks
  localStorage.setItem('supabase.auth.token', data.session.access_token);
  window.location.href = 'managebookings.html'; // Redirect to dashboard
});