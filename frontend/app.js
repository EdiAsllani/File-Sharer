const API_BASE = window.location.origin;
let deviceId = null;
let selectedFiles = [];
let heartbeatInterval = null;

// Initialize app on page load
document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await registerDevice();
  await checkServerStatus();
  await refreshDevices();
  await refreshFiles();

  startHeartbeat();
});

// Event listeners
function setupEventListeners() {
  const fileInput = document.getElementById("file-input");
  fileInput.addEventListener("change", handleFileSelection);

  fileInput.addEventListener("change", updateUploadButton);
  document
    .getElementById("target-device")
    .addEventListener("change", updateUploadButton);
}

// Device registration
async function registerDevice() {
  try {
    // Generate friendly device name based on browser/OS
    const deviceName = getDeviceName();
    const deviceIp = await getLocalIp();

    const response = await fetch(`${API_BASE}/api/register-device`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: deviceName, ip: deviceIp }),
    });

    const data = await response.json();
    deviceId = data.device_id;

    document.getElementById("device-name").textContent = deviceName;

    console.log("Device registered:", deviceName);
  } catch (error) {
    console.error("Failed to register device:", error);
  }
}

function getDeviceName() {
  const ua = navigator.userAgent;
  let deviceType = "Unknown Device";

  if (ua.includes("Android")) deviceType = "Android";
  else if (ua.includes("iPhone")) deviceType = "iPhone";
  else if (ua.includes("iPad")) deviceType = "iPad";
  else if (ua.includes("Windows")) deviceType = "Windows PC";
  else if (ua.includes("Mac")) deviceType = "Mac";
  else if (ua.includes("Linux")) deviceType = "Linux PC";

  return deviceType;
}

async function getLocalIp() {
  // Approximate -- gets public-facing IP
  // In a local network, server can see actual IP from request
  return "auto";
}

function startHeartbeat() {
  heartbeatInterval = setInterval(async () => {
    if (deviceId) {
      try {
        await fetch(`${API_BASE}/api/heartbeat/${deviceId}`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Heartbeat failed:", error);
      }
    }
  }, 60000);
}

// Server status check
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/info`);
    const data = await response.json();

    if (data.status === "running") {
      updateStatus(true, "Connected to server");
    }
  } catch (error) {
    updateStatus(false, "Server offline");
  }
}

function updateStatus(online, message) {
  const indicator = document.getElementById("status-indicator");
  const text = document.getElementById("status-text");

  indicator.className = `status-indicator ${online ? "online" : "offline"}`;
  text.textContent = message;
}

// File selection
function handleFileSelection(event) {
  selectedFiles = Array.from(event.target.files);
  displaySelectedFiles();
  updateFileCount();
}

function displaySelectedFiles() {
  const container = document.getElementById("selected-files");

  if (selectedFiles.length === 0) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = selectedFiles
    .map(
      (file, index) => `
        <div class="file-item">
            <div class="file-item-info">
                <div class="file-item-name">${file.name}</div>
                <div class="file-item-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="file-item-remove" onclick="removeFile(${index})">×</button>
        </div>
    `,
    )
    .join("");
}

function removeFile(index) {
  selectedFiles.splice(index, 1);

  const dataTransfer = new DataTransfer();
  selectedFiles.forEach((file) => dataTransfer.items.add(file));
  document.getElementById("file-input").files = dataTransfer.files;

  displaySelectedFiles();
  updateFileCount();
  updateUploadButton();
}

function updateFileCount() {
  const count = selectedFiles.length;
  const text =
    count === 0 ? "" : `${count} file${count > 1 ? "s" : ""} selected`;
  document.getElementById("file-count").textContent = text;
}

// Device Management
async function refreshDevices() {
  try {
    const response = await fetch(`${API_BASE}/api/devices`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Devices response:", data); // Debug log

    const select = document.getElementById("target-device");
    const currentValue = select.value;

    // Clear and repopulate
    select.innerHTML = '<option value="">Select a device...</option>';

    // SAFETY CHECK - Make sure data.devices exists and is an array
    if (!data.devices || !Array.isArray(data.devices)) {
      console.error("Invalid devices data:", data);
      showNotification("Invalid device data received", "error");
      return;
    }

    data.devices.forEach((device) => {
      // Don't show current device in list
      if (device.id !== deviceId) {
        const option = document.createElement("option");
        option.value = device.id;
        option.textContent = `${device.name} (${device.ip})`;
        select.appendChild(option);
      }
    });

    // Restore selection if still available
    if (currentValue) {
      select.value = currentValue;
    }

    console.log(`Loaded ${data.devices.length} devices`); // Debug log
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    showNotification("Failed to load devices: " + error.message, "error");
  }
}

// File upload
async function uploadFiles() {
  if (selectedFiles.length === 0) {
    showNotification("Please select files to upload", "warning");
    return;
  }

  const targetDevice = document.getElementById("target-device").value;
  if (!targetDevice) {
    showNotification("Please select a target device", "error");
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach((file) => {
    formData.append("files", file);
  });

  if (targetDevice) {
    formData.append("target_device", targetDevice);
  }

  showProgress(true);

  try {
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === "success") {
      showNotification(
        `Successfully uploaded ${data.files.length} file(s)`,
        "success",
      );

      // clear section
      selectedFiles = [];
      document.getElementById("file-input").value = "";
      displaySelectedFiles();
      updateFileCount();
      updateUploadButton();

      await refreshFiles();
    } else {
      showNotification("Upload failed", "error");
    }
  } catch (error) {
    console.error("Upload error:", error);
    showNotification("Upload failed: " + error.message, "error");
  } finally {
    showProgress(false);
  }
}

function updateUploadButton() {
  const btn = document.getElementById("upload-btn");
  const hasFiles = selectedFiles.length > 0;
  const hasTarget = document.getElementById("target-device").value !== "";

  btn.disabled = !(hasFiles && hasTarget);
}

// Files list
async function refreshFiles() {
  try {
    const response = await fetch(`${API_BASE}/api/files`);
    const data = await response.json();

    const container = document.getElementById("files-list");

    if (data.files.length === 0) {
      container.innerHTML = '<p class="empty-state">No files available</p>';
      return;
    }

    container.innerHTML = data.files
      .map(
        (file) => `
            <div class="file-card">
                <div class="file-card-info">
                    <h4>${file.original_name}</h4>
                    <div class="file-card-meta">
                        ${formatFileSize(file.size)} • 
                        ${formatTimestamp(file.timestamp)}
                    </div>
                </div>
                <div class="file-card-actions">
                    <button class="btn btn-primary btn-small" onclick="downloadFile('${file.id}', '${file.original_name}')">
                        Download
                    </button>
                    <button class="btn btn-danger btn-small" onclick="deleteFile('${file.id}')">
                        Delete
                    </button>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (error) {
    console.error("Failed to fetch files:", error);
  }
}

async function downloadFile(fileId, filename) {
  try {
    const response = await fetch(`${API_BASE}/api/download/${fileId}`);
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showNotification("Download started", "success");

    // Refresh list (file will be auto-deleted after download)
    setTimeout(refreshFiles, 1000);
  } catch (error) {
    console.error("Download error;", error);
    showNotification("Downnload failed", "error");
  }
}

async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) {
    return;
  }

  try {
    await fetch(`${API_BASE}/api/delete/${fileId}`, {
      method: "Delete",
    });

    showNotification("File deleted", "success");
    await refreshFiles();
  } catch (error) {
    console.error("Delete error:", error);
    showNotification("Delete failed", "error");
  }
}

// UI Helpers
function showProgress(show) {
  const container = document.getElementById("progress-container");
  container.style.display = show ? "block" : "none";

  if (show) {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      updateProgress(progress);
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
  } else {
    updateProgress(0);
  }
}

function updateProgress(percent) {
  document.getElementById("progress-fill").style.width = percent + "%";
  document.getElementById("progress-text").textContent =
    Math.round(percent) + "%";
}

function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.className = `notification ${type} show`;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Utility functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours.ago`;
  return (date, toLocalDateString());
}

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
});
