// Firebase 專案設定
const firebaseConfig = {
  apiKey: "AIzaSyDJ6BBh8h36WM45F4tGAZOzzv5r_7nwRic",
  authDomain: "matcha-trip-2026.firebaseapp.com",
  databaseURL: "https://matcha-trip-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "matcha-trip-2026",
  storageBucket: "matcha-trip-2026.firebasestorage.app",
  messagingSenderId: "529570143324",
  appId: "1:529570143324:web:a6d06f26207052b6635a99"
};

// 初始化 Firebase（使用 compat 版本）
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// 當前使用者
let currentUser = null;

// 匿名登入
function signInAnonymously() {
  return auth.signInAnonymously()
    .then((userCredential) => {
      currentUser = userCredential.user;
      console.log('[Firebase Auth] Signed in anonymously:', currentUser.uid);
      return currentUser;
    })
    .catch((error) => {
      console.error('[Firebase Auth] Sign in error:', error);
      throw error;
    });
}

// 監聽登入狀態變化
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = user;
    console.log('[Firebase Auth] User:', user.uid);
    // 觸發自訂事件，通知應用程式已登入
    window.dispatchEvent(new CustomEvent('firebase-auth-ready', { detail: { user } }));
  } else {
    currentUser = null;
    // 自動匿名登入
    signInAnonymously();
  }
});

console.log('[Firebase] Initialized successfully');
