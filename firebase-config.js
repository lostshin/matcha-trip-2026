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

console.log('[Firebase] Initialized successfully');
