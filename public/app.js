const form = document.querySelector('#login-form');
const message = document.querySelector('#message');
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    message.textContent = 'Signing in...';
    const button = form.querySelector('button');
    button.disabled = true;
    try {
      const response = await fetch('/api/login', { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: document.querySelector('#email').value,
          password: document.querySelector('#password').value }) });
      if (!response.ok) throw new Error((await response.json()).error || 'Sign-in failed');
      window.location.assign('/events');
    } catch (error) {
      message.textContent = error.message;
      button.disabled = false;
    }
  });
}
