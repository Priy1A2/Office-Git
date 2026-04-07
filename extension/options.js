document.addEventListener('DOMContentLoaded', async () => {
  const serverUrl = document.getElementById('serverUrl');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const status = document.getElementById('status');
  const connectedInfo = document.getElementById('connectedInfo');

  // Load saved settings
  const saved = await chrome.storage.local.get(['serverUrl', 'user', 'token']);

  if (saved.serverUrl) {
    serverUrl.value = saved.serverUrl;
  }

  if (saved.user && saved.token) {
    connectedInfo.style.display = 'block';
    connectedInfo.textContent = `✓ Connected as ${saved.user.name} (${saved.user.role})`;
  }

  loginBtn.addEventListener('click', async () => {
    const url = serverUrl.value.trim().replace(/\/$/, '');
    const emailVal = email.value.trim();
    const passwordVal = password.value;

    if (!url) {
      showStatus('Server URL is required', 'error');
      return;
    }

    if (!emailVal || !passwordVal) {
      showStatus('Email and password are required', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Connecting...';

    try {
      const response = await fetch(`${url}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save to storage
      await chrome.storage.local.set({
        serverUrl: url,
        token: data.token,
        user: data.user,
      });

      showStatus('Connected successfully!', 'success');
      connectedInfo.style.display = 'block';
      connectedInfo.textContent = `✓ Connected as ${data.user.name} (${data.user.role})`;

      // Clear password
      password.value = '';
    } catch (err) {
      showStatus(err.message || 'Connection failed', 'error');
      connectedInfo.style.display = 'none';
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Connect & Login';
    }
  });

  function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;

    if (type === 'success') {
      setTimeout(() => {
        status.className = 'status';
      }, 3000);
    }
  }
});
