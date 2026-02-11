// Firebase 初始化（設定值來自 window.TRIP_DATA.firebase）
let db = null;
let auth = null;
let currentUser = null;
let isFirebaseInitialized = false;
let hasAuthListener = false;

function getFirebaseConfigFromTripData() {
  return window.TRIP_DATA && window.TRIP_DATA.firebase;
}

function signInAnonymously() {
  if (!auth) {
    return Promise.reject(new Error('Firebase Auth 尚未初始化'));
  }

  return auth.signInAnonymously()
    .then((userCredential) => {
      currentUser = userCredential.user;
      window.currentUser = currentUser;
      console.log('[Firebase Auth] Signed in anonymously:', currentUser.uid);
      return currentUser;
    })
    .catch((error) => {
      console.error('[Firebase Auth] Sign in error:', error);
      throw error;
    });
}

function setupAuthListener() {
  if (hasAuthListener || !auth) return;
  hasAuthListener = true;

  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      window.currentUser = user;
      console.log('[Firebase Auth] User:', user.uid);
      window.dispatchEvent(new CustomEvent('firebase-auth-ready', { detail: { user } }));
    } else {
      currentUser = null;
      window.currentUser = null;
      signInAnonymously();
    }
  });
}

function initializeFirebaseFromTripData() {
  if (isFirebaseInitialized) {
    return true;
  }

  const firebaseConfig = getFirebaseConfigFromTripData();
  if (!firebaseConfig) {
    return false;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  db = firebase.database();
  auth = firebase.auth();
  window.db = db;
  window.auth = auth;

  setupAuthListener();

  isFirebaseInitialized = true;
  window.dispatchEvent(new CustomEvent('firebase-config-ready', { detail: { db, auth } }));
  console.log('[Firebase] Initialized successfully from TRIP_DATA');
  return true;
}

window.addEventListener('trip-data-loaded', initializeFirebaseFromTripData);
initializeFirebaseFromTripData();
