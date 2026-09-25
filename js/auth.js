import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  deleteUser,
  reauthenticateWithPopup
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  deleteField,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const signInBtn = document.getElementById('google-sign-in');
const signOutBtn = document.getElementById('sign-out');
const authCard = document.getElementById('auth-card');
const dashboard = document.getElementById('dashboard');
const avatarEl = document.getElementById('dash-avatar');
const nameEl = document.getElementById('dash-name');
const emailEl = document.getElementById('dash-email');

const authStatus = document.getElementById('auth-status');
const keyForm = document.getElementById('key-form');
const keyInput = document.getElementById('key-input');
const saveKeyBtn = document.getElementById('save-key');
const savedKeyRow = document.getElementById('saved-key-row');
const savedKeyMasked = document.getElementById('saved-key-masked');
const updateKeyBtn = document.getElementById('update-key');
const removeKeyBtn = document.getElementById('remove-key');
const statusLine = document.getElementById('status-line');
const deleteAccountBtn = document.getElementById('delete-account');

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

function setStatus(text) {
  statusLine.textContent = text || '';
}

signInBtn?.addEventListener('click', () => {
  const provider = new GoogleAuthProvider();
  authStatus.textContent = 'Signing in…';
  signInWithPopup(auth, provider)
    .then(() => { authStatus.textContent = ''; })
    .catch((err) => {
      authStatus.textContent = err.code === 'auth/popup-closed-by-user'
        ? 'Sign-in was cancelled.'
        : 'Could not sign in: ' + err.message;
    });
});

signOutBtn?.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    authCard.style.display = 'block';
    dashboard.classList.remove('visible');
    return;
  }

  authCard.style.display = 'none';
  dashboard.classList.add('visible');
  avatarEl.src = user.photoURL || '';
  nameEl.textContent = user.displayName || 'Signed in';
  emailEl.textContent = user.email || '';

  await refreshSavedKey(user.uid);
});

async function refreshSavedKey(uid) {
  setStatus('');
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const data = snap.data();
    if (data && data.groqApiKey) {
      savedKeyMasked.textContent = maskKey(data.groqApiKey);
      savedKeyRow.style.display = 'flex';
      keyForm.style.display = 'none';
    } else {
      savedKeyRow.style.display = 'none';
      keyForm.style.display = 'block';
    }
  } catch (err) {
    setStatus('Could not load your saved key: ' + err.message);
  }
}

keyForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;
  const value = keyInput.value.trim();
  if (!value) {
    setStatus('Paste your Groq API key first.');
    keyInput.focus();
    return;
  }
  saveKeyBtn.disabled = true;
  setStatus('Saving…');
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      { groqApiKey: value, updatedAt: serverTimestamp() },
      { merge: true }
    );
    keyInput.value = '';
    setStatus('Saved.');
    await refreshSavedKey(user.uid);
  } catch (err) {
    setStatus('Could not save: ' + err.message);
  } finally {
    saveKeyBtn.disabled = false;
  }
});

updateKeyBtn?.addEventListener('click', () => {
  savedKeyRow.style.display = 'none';
  keyForm.style.display = 'block';
  keyInput.focus();
});

removeKeyBtn?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  setStatus('Removing…');
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      { groqApiKey: deleteField() },
      { merge: true }
    );
    setStatus('Removed.');
    await refreshSavedKey(user.uid);
  } catch (err) {
    setStatus('Could not remove: ' + err.message);
  }
});

// Self-service deletion: removes the Firestore record, then the Firebase Auth user.
// Firebase requires a recent sign-in to delete a user, so re-prompt once if needed.
deleteAccountBtn?.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return;
  const ok = window.confirm(
    'Delete your saved key and your Bright sign-in record? This cannot be undone.'
  );
  if (!ok) return;

  deleteAccountBtn.disabled = true;
  setStatus('Deleting…');
  try {
    await deleteDoc(doc(db, 'users', user.uid));
    try {
      await deleteUser(user);
    } catch (err) {
      if (err.code !== 'auth/requires-recent-login') throw err;
      await reauthenticateWithPopup(user, new GoogleAuthProvider());
      await deleteUser(user);
    }
    authStatus.textContent = 'Your data has been deleted.';
  } catch (err) {
    setStatus('Could not delete everything: ' + err.message);
  } finally {
    deleteAccountBtn.disabled = false;
  }
});
