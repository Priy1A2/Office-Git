document.addEventListener('DOMContentLoaded', async () => {
  const notConnected = document.getElementById('notConnected');
  const uploadForm = document.getElementById('uploadForm');
  const userInfo = document.getElementById('userInfo');
  const userName = document.getElementById('userName');
  const settingsBtn = document.getElementById('settingsBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const selectedFileEl = document.getElementById('selectedFile');
  const fileNameEl = document.getElementById('fileName');
  const removeFile = document.getElementById('removeFile');
  const uploadBtn = document.getElementById('uploadBtn');
  const statusMessage = document.getElementById('statusMessage');
  const docTitle = document.getElementById('docTitle');
  const commitMessage = document.getElementById('commitMessage');

  let selectedFile = null;

  // Check connection
  const checkConnection = async () => {
    const data = await chrome.storage.local.get(['serverUrl', 'token', 'user']);

    if (!data.serverUrl || !data.token) {
      notConnected.style.display = 'block';
      uploadForm.style.display = 'none';
      userInfo.style.display = 'none';
      return false;
    }

    // Verify token is still valid
    try {
      const response = await fetch(`${data.serverUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.token}` },
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      const result = await response.json();
      notConnected.style.display = 'none';
      uploadForm.style.display = 'block';
      userInfo.style.display = 'flex';
      userName.textContent = `👤 ${result.user.name}`;
      return true;
    } catch {
      notConnected.style.display = 'block';
      uploadForm.style.display = 'none';
      userInfo.style.display = 'none';
      return false;
    }
  };

  await checkConnection();

  // Settings button
  const openOptions = () => chrome.runtime.openOptionsPage();
  settingsBtn.addEventListener('click', openOptions);
  openSettingsBtn.addEventListener('click', openOptions);

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await chrome.storage.local.remove(['token', 'user']);
    await checkConnection();
  });

  // File handling
  const handleFile = (file) => {
    if (!file) return;

    const ext = file.name.toLowerCase();
    if (!ext.endsWith('.txt') && !ext.endsWith('.pdf')) {
      showStatus('Only .txt and .pdf files are allowed', 'error');
      return;
    }

    if (file.size > 1048576) {
      showStatus('File must be less than 1MB', 'error');
      return;
    }

    selectedFile = file;
    fileNameEl.textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    selectedFileEl.style.display = 'flex';
    dropZone.style.display = 'none';
    updateUploadState();
  };

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  removeFile.addEventListener('click', () => {
    selectedFile = null;
    fileInput.value = '';
    selectedFileEl.style.display = 'none';
    dropZone.style.display = 'block';
    updateUploadState();
  });

  const updateUploadState = () => {
    uploadBtn.disabled = !selectedFile || !docTitle.value.trim();
  };

  docTitle.addEventListener('input', updateUploadState);

  // Upload
  uploadBtn.addEventListener('click', async () => {
    if (!selectedFile || !docTitle.value.trim()) return;

    const data = await chrome.storage.local.get(['serverUrl', 'token']);
    if (!data.serverUrl || !data.token) {
      showStatus('Not connected. Please configure settings.', 'error');
      return;
    }

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    showStatus('Uploading document...', 'loading');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', docTitle.value.trim());
      formData.append('message', commitMessage.value.trim() || 'Initial version');

      const response = await fetch(`${data.serverUrl}/api/documents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${data.token}` },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      showStatus('Document uploaded successfully! ✓', 'success');
      // Reset form
      docTitle.value = '';
      commitMessage.value = 'Initial version';
      selectedFile = null;
      fileInput.value = '';
      selectedFileEl.style.display = 'none';
      dropZone.style.display = 'block';
      updateUploadState();
    } catch (err) {
      showStatus(err.message || 'Upload failed', 'error');
    } finally {
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload Document';
      updateUploadState();
    }
  });

  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        statusMessage.style.display = 'none';
      }, 3000);
    }
  }
});
