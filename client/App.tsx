import { auth } from './lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

console.log("Starting authenticated URL Shortener app...");

// Global state
let currentView = 'shortener';
let currentUser: User | null = null;
let urls = [];

// Base styles for glassmorphism
const glassBase = `
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const buttonBase = `
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
`;

const inputBase = `
  width: 100%;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 16px;
  box-sizing: border-box;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transition: border-color 0.2s;
`;

const activeTabStyle = `
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: bold;
`;

const inactiveTabStyle = `
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  font-weight: normal;
`;

// Create main container
const createMainContainer = () => {
  // Fix for the white margin by styling the body element
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.backgroundColor = '#121212';
  document.body.style.fontFamily = `'Segoe UI', Arial, sans-serif`;
  document.body.style.color = 'white';

  return `
    <div id="app-content" style="max-width: 1200px; margin: 0 auto; padding: 40px 20px;">
    </div>
  `;
};

// Authentication View
const createAuthView = () => {
  return `
    <div style="text-align: center; max-width: 400px; margin: 0 auto;">
      <div style="${glassBase} padding: 40px; border-radius: 20px;">
        <h1 style="font-size: 2.5em; margin: 0 0 20px 0; color: white;">Welcome</h1>
        <p style="margin-bottom: 30px; color: rgba(255, 255, 255, 0.8);">Sign in to access your personal URL shortener</p>

        <div id="authTabs" style="display: flex; margin-bottom: 20px; border-radius: 12px; overflow: hidden; ${glassBase}">
          <button id="loginTab" style="flex: 1; padding: 12px; ${inactiveTabStyle} border: none; cursor: pointer; border-right: 1px solid rgba(255, 255, 255, 0.2);">
            Sign In
          </button>
          <button id="registerTab" style="flex: 1; padding: 12px; ${inactiveTabStyle} border: none; cursor: pointer;">
            Sign Up
          </button>
        </div>

        <div id="authForm">
          <input type="email" id="authEmail" placeholder="Email" style="${inputBase} margin-bottom: 15px;">
          <input type="password" id="authPassword" placeholder="Password" style="${inputBase} margin-bottom: 20px;">

          <button id="authSubmit" style="${buttonBase} width: 100%; background: #007bff; color: white; font-size: 16px;">
            Sign In
          </button>
        </div>

        <div id="authError" style="background: rgba(255, 0, 0, 0.3); color: #ffcccc; padding: 10px; border-radius: 8px; display: none; margin-top: 15px;"></div>
        <div id="authLoading" style="display: none; margin-top: 15px; color: rgba(255, 255, 255, 0.7);">
          <div>Processing...</div>
        </div>
      </div>
    </div>
  `;
};

// URL Shortener View
const createURLShortenerView = () => {
  return `
    <div style="max-width: 800px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap;">
        <div>
          <h1 style="font-size: 3em; margin: 0;">URL Shortener</h1>
          <p style="font-size: 1.2em; margin: 0; color: rgba(255, 255, 255, 0.8);">Welcome, ${currentUser?.email || 'User'}</p>
        </div>
        <button
          id="signOutBtn"
          style="${buttonBase} background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3);"
        >
          Sign Out
        </button>
      </div>
      <p style="font-size: 1.2em; margin-bottom: 30px; color: rgba(255, 255, 255, 0.8);">Transform long URLs into short, manageable links</p>

      <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 30px; flex-wrap: wrap;">
        <button
          id="toggleAdmin"
          style="${buttonBase} background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3);"
        >
          Personal Dashboard
        </button>
        <button
          id="refreshUrls"
          style="${buttonBase} background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3);"
        >
       Refresh Data
        </button>
      </div>

      <div style="${glassBase} padding: 30px; border-radius: 12px;">
        <div style="margin-bottom: 20px;">
          <input
            type="text"
            id="urlInput"
            placeholder="https://example.com/very-long-url-that-needs-shortening"
            style="${inputBase} margin-bottom: 15px;"
          />
          <button
            id="shortenBtn"
            style="${buttonBase} width: 100%; background: #007bff; color: white; font-size: 16px;"
          >
            Shorten URL
          </button>
        </div>

        <div id="errorDiv" style="background: rgba(255, 0, 0, 0.3); color: #ffcccc; padding: 10px; border-radius: 8px; margin-bottom: 20px; display: none;"></div>

        <div id="resultDiv" style="${glassBase} padding: 20px; border-radius: 8px; margin-top: 20px; display: none;">
          <h3 style="margin: 0 0 10px 0; color: #87CEEB;">Your shortened URL:</h3>
          <div style="display: flex; align-items: center; background: rgba(255, 255, 255, 0.1); padding: 10px; border-radius: 5px;">
            <code id="shortUrlCode" style="flex: 1; font-size: 14px; word-break: break-all; margin-right: 10px; color: #87CEEB;"></code>
            <button
              id="copyBtn"
              style="${buttonBase} padding: 8px 16px; background: rgba(255, 255, 255, 0.15); color: white; font-size: 12px;"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 30px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
        Fast • Secure • Universal Access
      </div>
    </div>
  `;
};

// Admin Dashboard View
const createAdminDashboardView = () => {
  const totalVisits = urls.reduce((sum, url) => sum + url.visitCount, 0);
  const avgVisits = urls.length > 0 ? (totalVisits / urls.length).toFixed(1) : '0';

  return `
    <div style="max-width: 1000px; margin: 0 auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; flex-wrap: wrap;">
        <div>
          <h1 style="font-size: 2.5em; margin: 0;">Personal Dashboard</h1>
          <p style="margin: 5px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 14px;">Logged in as: ${currentUser?.email || 'Unknown'}</p>
        </div>
        <div>
          <button
            id="refreshBtn"
            style="${buttonBase} background: rgba(255, 255, 255, 0.1); color: white; border: 1px solid rgba(255, 255, 255, 0.3); margin-right: 10px;"
          >
            Refresh
          </button>
          <button
            id="backBtn"
            style="${buttonBase} background: #007bff; color: white;"
          >
            Back to Shortener
          </button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
        <div style="${glassBase} padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 2em; color: #87CEEB;">${urls.length}</h3>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8);">Total URLs</p>
        </div>
        <div style="${glassBase} padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 2em; color: #87CEEB;">${totalVisits}</h3>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8);">Total Visits</p>
        </div>
        <div style="${glassBase} padding: 20px; border-radius: 12px; text-align: center;">
          <h3 style="margin: 0 0 10px 0; font-size: 2em; color: #87CEEB;">${avgVisits}</h3>
          <p style="margin: 0; color: rgba(255, 255, 255, 0.8);">Avg Visits/URL</p>
        </div>
      </div>

      <div style="background: rgba(0, 255, 0, 0.1); border: 1px solid rgba(0, 255, 0, 0.3); border-radius: 8px; padding: 15px; margin-bottom: 20px; color: #90EE90;">
        <h3 style="margin: 0 0 10px 0; color: #90EE90;">Privacy Protected</h3>
        <p style="margin: 0; font-size: 14px; color: rgba(255, 255, 255, 0.8);">This dashboard shows only YOUR shortened URLs. Other users cannot see your data, and you cannot see theirs.</p>
      </div>

      <div style="${glassBase} border-radius: 12px; overflow: hidden; padding: 20px;">
        <h2 style="margin: 0 0 20px 0;">Your Personal URLs</h2>

        <div id="adminError" style="background: rgba(255, 0, 0, 0.3); color: #ffcccc; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: none;"></div>

        <div id="adminLoading" style="text-align: center; padding: 40px; display: none; color: rgba(255, 255, 255, 0.7);">
          <div style="font-size: 18px;">Loading URLs...</div>
        </div>

        <div id="adminEmpty" style="text-align: center; padding: 40px; display: ${urls.length === 0 ? 'block' : 'none'}; color: rgba(255, 255, 255, 0.7);">
          <div style="font-size: 18px;">No URLs found. Create some shortened URLs first!</div>
        </div>

        <div id="adminTable" style="overflow-x: auto; display: ${urls.length > 0 ? 'block' : 'none'};">
          <style>
            .url-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
              color: white;
            }
            .url-table th, .url-table td {
              padding: 15px;
              text-align: left;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            .url-table th {
              background: rgba(255, 255, 255, 0.1);
            }
            .url-table tbody tr:nth-child(odd) {
              background: rgba(255, 255, 255, 0.05);
            }
            .url-table a {
              color: #87CEEB;
              text-decoration: none;
              word-break: break-all;
            }
            .url-table a:hover {
              text-decoration: underline;
            }
            .visits-badge {
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
            }
            .visits-badge-positive {
              background: rgba(0, 255, 0, 0.2);
              color: #90EE90;
            }
            .visits-badge-zero {
              background: rgba(255, 255, 255, 0.15);
              color: rgba(255, 255, 255, 0.6);
            }
            .delete-btn {
              padding: 6px 12px;
              background: rgba(255, 0, 0, 0.2);
              color: #ffcccc;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 12px;
            }
            .delete-btn:hover {
              background: rgba(255, 0, 0, 0.3);
            }
          </style>
          <table class="url-table">
            <thead>
              <tr>
                <th>Original URL</th>
                <th>Short Code</th>
                <th>Visits</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="urlTableBody">
              ${urls.map((url, index) => `
                <tr>
                  <td>
                    <a href="${url.originalUrl}" target="_blank" rel="noopener noreferrer">
                      ${url.originalUrl.length > 50 ? url.originalUrl.substring(0, 50) + '...' : url.originalUrl}
                    </a>
                  </td>
                  <td>
                    <code style="background: rgba(255, 255, 255, 0.15); padding: 4px 8px; border-radius: 4px; font-size: 12px;">${url.shortCode}</code>
                  </td>
                  <td>
                    <span class="visits-badge ${url.visitCount > 0 ? 'visits-badge-positive' : 'visits-badge-zero'}">${url.visitCount}</span>
                  </td>
                  <td>${new Date(url.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button onclick="deleteUrl('${url.shortCode}')" class="delete-btn">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
};

// Render function
const render = () => {
  const appContent = document.getElementById('app-content');
  if (!appContent) return;

  if (!currentUser) {
    appContent.innerHTML = createAuthView();
    setupAuthEvents();
  } else if (currentView === 'shortener') {
    appContent.innerHTML = createURLShortenerView();
    setupShortenerEvents();
  } else {
    appContent.innerHTML = createAdminDashboardView();
    setupAdminEvents();
  }
};

// Authentication event handlers
const setupAuthEvents = () => {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const authSubmit = document.getElementById('authSubmit');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');

  let isLogin = true;

  // Set initial active state
  loginTab.style.cssText = `${buttonBase} flex: 1; padding: 12px; border-right: 1px solid rgba(255, 255, 255, 0.2); ${activeTabStyle}`;
  registerTab.style.cssText = `${buttonBase} flex: 1; padding: 12px; ${inactiveTabStyle}`;
  authSubmit.textContent = 'Sign In';

  loginTab?.addEventListener('click', () => {
    isLogin = true;
    loginTab.style.cssText = `${buttonBase} flex: 1; padding: 12px; border-right: 1px solid rgba(255, 255, 255, 0.2); ${activeTabStyle}`;
    registerTab!.style.cssText = `${buttonBase} flex: 1; padding: 12px; ${inactiveTabStyle}`;
    authSubmit!.textContent = 'Sign In';
  });

  registerTab?.addEventListener('click', () => {
    isLogin = false;
    registerTab.style.cssText = `${buttonBase} flex: 1; padding: 12px; ${activeTabStyle}`;
    loginTab!.style.cssText = `${buttonBase} flex: 1; padding: 12px; border-right: 1px solid rgba(255, 255, 255, 0.2); ${inactiveTabStyle}`;
    authSubmit!.textContent = 'Sign Up';
  });

  authSubmit?.addEventListener('click', () => handleAuth(isLogin));

  [authEmail, authPassword].forEach(input => {
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleAuth(isLogin);
    });
  });
};

// Event handlers for shortener
const setupShortenerEvents = () => {
  const toggleBtn = document.getElementById('toggleAdmin');
  const shortenBtn = document.getElementById('shortenBtn');
  const urlInput = document.getElementById('urlInput');
  const copyBtn = document.getElementById('copyBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const refreshBtn = document.getElementById('refreshUrls');

  toggleBtn?.addEventListener('click', async () => {
    console.log('Switching to admin dashboard...');
    currentView = 'admin';
    await fetchUrls();
    render();
  });

  refreshBtn?.addEventListener('click', async () => {
    console.log('Manual refresh requested...');
    try {
      await fetchUrls();
      alert(`Refreshed! Found ${urls.length} URLs for your account.`);
      if (currentView === 'admin') {
        render(); // Re-render if in admin view
      }
    } catch (error) {
      alert('Failed to refresh data: ' + error.message);
    }
  });

  shortenBtn?.addEventListener('click', handleShorten);
  urlInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleShorten();
  });
  copyBtn?.addEventListener('click', handleCopy);
  signOutBtn?.addEventListener('click', handleSignOut);
};

// Event handlers for admin
const setupAdminEvents = () => {
  const backBtn = document.getElementById('backBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  backBtn?.addEventListener('click', () => {
    currentView = 'shortener';
    render();
  });

  refreshBtn?.addEventListener('click', () => {
    fetchUrls().then(render);
  });
};

// Authentication functions
const handleAuth = async (isLogin: boolean) => {
  const emailInput = document.getElementById('authEmail') as HTMLInputElement;
  const passwordInput = document.getElementById('authPassword') as HTMLInputElement;
  const authError = document.getElementById('authError');
  const authLoading = document.getElementById('authLoading');
  const authSubmit = document.getElementById('authSubmit');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!email || !password) {
    showAuthError('Please fill in all fields');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    return;
  }

  authLoading!.style.display = 'block';
  authSubmit!.style.display = 'none';
  hideAuthError();

  try {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
    }
    // User state will be updated by onAuthStateChanged
  } catch (error: any) {
    console.error('Auth error:', error);
    showAuthError(getAuthErrorMessage(error.code));
  } finally {
    authLoading!.style.display = 'none';
    authSubmit!.style.display = 'block';
  }
};

const handleSignOut = async () => {
  try {
    await signOut(auth);
    // User state will be updated by onAuthStateChanged
  } catch (error) {
    console.error('Sign out error:', error);
  }
};

const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'Email is already registered';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later';
    default:
      return 'Authentication failed. Please try again';
  }
};

const showAuthError = (message: string) => {
  const authError = document.getElementById('authError');
  if (authError) {
    authError.textContent = message;
    authError.style.display = 'block';
  }
};

const hideAuthError = () => {
  const authError = document.getElementById('authError');
  if (authError) {
    authError.style.display = 'none';
  }
};

// API functions with authentication
const getAuthHeaders = async () => {
  console.log('Getting auth headers...');
  console.log('Current user:', currentUser ? {
    uid: currentUser.uid,
    email: currentUser.email,
    emailVerified: currentUser.emailVerified
  } : 'Not authenticated');

  if (!currentUser) {
    throw new Error('User not authenticated');
  }

  const token = await currentUser.getIdToken();

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-User-Id': currentUser.uid,
    'X-User-Email': currentUser.email || ''
  };

  console.log('Sending headers:', {
    hasToken: !!token,
    userId: headers['X-User-Id'],
    userEmail: headers['X-User-Email']
  });

  return headers;
};

const handleShorten = async () => {
  const urlInput = document.getElementById('urlInput') as HTMLInputElement;
  const shortenBtn = document.getElementById('shortenBtn');
  const errorDiv = document.getElementById('errorDiv');
  const resultDiv = document.getElementById('resultDiv');
  const shortUrlCode = document.getElementById('shortUrlCode');

  if (!urlInput?.value.trim()) {
    showError('Please enter a URL to shorten');
    return;
  }

  if (shortenBtn) shortenBtn.textContent = 'Shortening...';
  hideError();

  try {
    const headers = await getAuthHeaders();

    const response = await fetch('/api/shorten', {
      method: 'POST',
      headers,
      body: JSON.stringify({ originalUrl: urlInput.value })
    });

    if (response.ok) {
      const data = await response.json();
      const shortUrl = window.location.origin + '/' + data.shortCode;
      if (shortUrlCode) shortUrlCode.textContent = shortUrl;
      if (resultDiv) resultDiv.style.display = 'block';
      urlInput.value = '';
    } else {
      const error = await response.json();
      showError(error.error || 'Failed to shorten URL');
    }
  } catch (err) {
    showError('Error: ' + (err as Error).message);
  } finally {
    if (shortenBtn) shortenBtn.textContent = 'Shorten URL';
  }
};

const handleCopy = async () => {
  const shortUrlCode = document.getElementById('shortUrlCode');
  if (!shortUrlCode || !shortUrlCode.textContent) return;

  const textToCopy = shortUrlCode.textContent;

  try {
    // Try modern clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(textToCopy);
      alert('Copied to clipboard!');
      return;
    }
  } catch (err) {
    console.log('Clipboard API failed, trying fallback method:', err);
  }

  // Fallback method using temporary textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      alert('Copied to clipboard!');
    } else {
      // If all else fails, show the URL for manual copying
      prompt('Copy this URL manually (Ctrl+C):', textToCopy);
    }
  } catch (err) {
    console.error('All copy methods failed:', err);
    // Final fallback - show the URL for manual copying
    prompt('Copy this URL manually (Ctrl+C):', textToCopy);
  }
};

const fetchUrls = async () => {
  try {
    console.log('Fetching URLs for current user...');
    console.log('Current user info:', {
      email: currentUser?.email,
      uid: currentUser?.uid,
      isAuthenticated: !!currentUser
    });

    if (!currentUser) {
      console.log('No current user, cannot fetch URLs');
      urls = [];
      return;
    }

    const headers = await getAuthHeaders();

    console.log('Making request to /api/admin/urls');
    const response = await fetch('/api/admin/urls', { headers });

    console.log('Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      urls = data.urls || [];
      console.log('Fetched URLs successfully:', {
        count: urls.length,
        userEmails: [...new Set(urls.map(url => url.userEmail))],
        currentUserEmail: currentUser?.email,
        debug: data.debug,
        urlSamples: urls.slice(0, 3).map(url => ({
          shortCode: url.shortCode,
          originalUrl: url.originalUrl.substring(0, 50) + '...',
          userId: url.userId
        }))
      });

      // Also fetch debug info to understand storage state
      try {
        const debugResponse = await fetch('/api/debug/urls');
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('Storage debug info:', debugData.stats);
        }
      } catch (debugError) {
        console.log('Could not fetch debug info:', debugError);
      }

    } else {
      const errorText = await response.text();
      console.log('Failed to fetch URLs:', errorText);
      throw new Error('Failed to fetch URLs: ' + errorText);
    }
  } catch (err) {
    console.error('Error fetching URLs:', err);
    urls = []; // Reset on error
    throw err; // Re-throw for caller handling
  }
};

const deleteUrl = async (shortCode: string) => {
  if (!confirm(`Delete URL with code "${shortCode}"?`)) return;

  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`/api/urls/${shortCode}`, {
      method: 'DELETE',
      headers
    });

    if (response.ok) {
      urls = urls.filter(url => url.shortCode !== shortCode);
      render();
      alert('URL deleted successfully!');
    } else {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete URL');
    }
  } catch (err) {
    alert('Error: ' + (err as Error).message);
  }
};

// Helper functions
const showError = (message: string) => {
  const errorDiv = document.getElementById('errorDiv');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
};

const hideError = () => {
  const errorDiv = document.getElementById('errorDiv');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
};

// Make deleteUrl globally available
(window as any).deleteUrl = deleteUrl;

// Initialize app with authentication
const initializeApp = () => {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    rootElement.innerHTML = createMainContainer();

    // Set up authentication state listener
    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.email}` : 'User logged out');
      currentUser = user;
      currentView = 'shortener'; // Reset to shortener view on auth change

      if (user) {
        // User just logged in - fetch their URLs
        console.log('User authenticated, fetching URLs...');
        try {
          await fetchUrls();
          console.log('URLs fetched after login:', urls.length);
        } catch (error) {
          console.log('Could not fetch URLs after login:', error);
          urls = []; // Reset on error
        }
      } else {
        // User logged out - clear URLs
        urls = [];
      }

      render();
    });

    // Initial render (will show auth screen if not logged in)
    render();

    console.log('Authenticated URL Shortener app loaded successfully!');
  } else {
    console.error("Root element not found!");
  }
};

// Start the app
initializeApp();