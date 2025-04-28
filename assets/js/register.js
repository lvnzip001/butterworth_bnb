import supabase from './supabase-client.js';

document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('signup-error');
  const successDiv = document.getElementById('signup-success');

  if (!email || !password) {
    errorDiv.textContent = 'Please enter email and password.';
    errorDiv.classList.remove('d-none');
    return;
  }

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    errorDiv.textContent = 'Sign-up failed: ' + error.message;
    errorDiv.classList.remove('d-none');
    return;
  }

  // Add the user to the admins table with approved = FALSE
  const { error: adminError } = await supabase
    .from('admins')
    .insert([
      { id: data.user.id, email: data.user.email, approved: false }
    ]);

  if (adminError) {
    errorDiv.textContent = 'Error registering admin: ' + adminError.message;
    errorDiv.classList.remove('d-none');
    return;
  }

  successDiv.textContent = 'Account created! Waiting for admin approval.';
  successDiv.classList.remove('d-none');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
});