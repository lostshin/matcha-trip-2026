# 抹茶山旅遊 PWA

三天兩夜登山溫泉之旅的離線應用程式。

## ✨ 功能特色

### 📲 PWA 體驗
- 可安裝到主畫面，擁有 App 圖示
- 全螢幕顯示（無瀏覽器網址列）
- 抹茶綠主題色，日系手帳風設計
- 離線優先，山區無訊號也能查看

### 📅 行程總覽
- **三天行程分頁切換**：Day 1~3 一目瞭然
- **登山隊 vs 青花瓷隊**：Day2 分開行程清楚標示
- **一鍵導航**：所有地點可直接開啟 Google Maps

### 🗺️ 宜蘭旅遊推薦
- 分頁式設計：美食 / 景點 / 伴手禮
- 已訂位餐廳標示
- Google 評分參考
- 雨天備案建議

### ⛰️ 抹茶山登山攻略
- 分頁式設計：路線 / 安全 / 生態
- 時間點檢查表（附撤退時間）
- **登山安全知識**：新手防傷指南、下坡技巧
- **生態介紹**：抹茶山植物辨識（按海拔分層）

### 🏨 住宿資訊
- 兩晚飯店完整資訊
- 訂單編號、取消期限
- 房型分配說明

### 💰 預算摘要
- 分攤計算明細
- 登山隊 vs 非登山隊費用

### 🧮 分帳計算器（Firebase 即時同步）
- 5 人分帳記錄
- 誰付的 / 分攤誰
- 即時計算結算金額
- 有網路時同步，離線時本地暫存

### 🎒 裝備清單
- 可勾選的 Checklist
- 必備裝備分類

### ☎️ 緊急聯絡
- 隊員聯絡資訊
- 緊急電話

### 🚀 快速導覽
- 浮動漢堡選單
- 一鍵跳轉任意區塊
- 自動展開摺疊區塊

## 📁 專案檔案

```
pwa/
├── index.html              # 主要 HTML 檔案（單檔 PWA）
├── manifest.json           # PWA 設定
├── sw.js                   # Service Worker（離線快取）
├── firebase-config.js      # Firebase 設定
├── icons/                  # App 圖示
│   ├── generate-icons.html # 圖示產生工具
│   ├── icon.svg            # SVG 原始檔
│   ├── icon-192.png        # 小圖示
│   └── icon-512.png        # 大圖示
└── README.md               # 本檔案
```

## 🛠️ 程式碼架構

### 共用函式
- `expandSection(section)` - 展開摺疊的區塊
- `showSectionTab(sectionId, tabIndex)` - 通用分頁切換器
- `scrollToSection(event, sectionId)` - 平滑滾動至指定區塊
- `toggleSection(header)` - 手風琴式區塊展開/收合
- `showDay(day)` / `showGuideTab(tab)` / `showHikeTab(tab)` - 各區塊分頁切換

### 效能優化
- 使用 `loading="lazy"` 延遲載入圖片
- CSS 變數統一管理主題色彩（`--matcha-*`, `--cream-*`）
- 模組化 JavaScript 減少重複程式碼
- 單一 HTML 檔案架構，無需建置工具

### UI/UX 設計
- 可摺疊區塊（accordion）節省空間
- 分頁式內容組織（tabs）
- Google Maps 導航按鈕整合
- 響應式設計，手機優先

## 🚀 部署步驟

### 步驟 1：產生 App 圖示

1. 在瀏覽器中開啟 `icons/generate-icons.html`
2. 點選「下載」按鈕，分別下載兩個尺寸的圖示
3. 將下載的 `icon-192.png` 和 `icon-512.png` 放到 `icons/` 資料夾

### 步驟 2：建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點選「新增專案」
3. 專案名稱：`matcha-trip-2026`
4. 停用 Google Analytics（不需要）
5. 點選「Realtime Database」→「建立資料庫」
6. 選擇「測試模式」→「啟用」
7. 複製專案設定：
   - 點選專案設定（齒輪圖示）
   - 向下捲動到「你的應用程式」
   - 選擇「網頁」（`</>`圖示）
   - 複製 `firebaseConfig` 物件

### 步驟 3：更新 Firebase 設定

1. 開啟 `firebase-config.js`
2. 將 `TODO_YOUR_API_KEY` 等佔位符替換成你的 Firebase 設定
3. 儲存檔案

### 步驟 4：設定 Firebase 安全規則

在 Firebase Console 的 Realtime Database → 規則，貼上：

```json
{
  "rules": {
    "matcha-trip-2026": {
      "expenses": {
        ".read": true,
        ".write": true,
        "$expenseId": {
          ".validate": "newData.hasChildren(['id', 'name', 'amount', 'payer', 'splitWith', 'timestamp'])"
        }
      }
    }
  }
}
```

點選「發布」。

### 步驟 5：建立 GitHub Repository

```bash
cd pwa
git init
git add .
git commit -m "Initial PWA setup"
git branch -M main
git remote add origin https://github.com/你的使用者名稱/matcha-trip-2026.git
git push -u origin main
```

### 步驟 6：啟用 GitHub Pages

1. 前往 GitHub repo 的 Settings
2. 左側選單點選「Pages」
3. Source 選擇「main」branch
4. 資料夾選擇「/ (root)」
5. 點選「Save」
6. 等待 1-2 分鐘，網址會顯示在上方

### 步驟 7：分享給隊員

**網址**：`https://你的使用者名稱.github.io/matcha-trip-2026/`

**使用方式**：
1. 用手機瀏覽器開啟網址
2. 點選瀏覽器選單的「加入主畫面」
3. 桌面會出現抹茶綠圖示 🥾
4. 點開後就是離線 App！

## 🔧 開發測試

### 本地測試

```bash
cd pwa
python3 -m http.server 8000
# 或
npx http-server -p 8000
```

開啟 `http://localhost:8000`

### Chrome DevTools 測試

1. 開啟開發者工具（F12）
2. Application → Manifest（檢查 PWA 設定）
3. Application → Service Workers（檢查註冊狀態）
4. Application → Cache Storage（檢查快取檔案）
5. Network → 勾選 Offline（測試離線功能）

## ⚠️ 注意事項

1. **圖示必須產生**：沒有圖示會導致「加入主畫面」失敗
2. **Firebase 設定必須填入**：否則分帳功能無法使用
3. **需要 HTTPS**：GitHub Pages 自動提供，本地測試用 localhost 也可以
4. **iOS 限制**：Safari 對 PWA 支援較有限，但基本功能都可用

## 🐛 疑難排解

### PWA 無法安裝
- 確認圖示已產生並放到正確位置
- 確認 manifest.json 路徑正確
- 檢查 Chrome DevTools → Application → Manifest 是否有錯誤

### 分帳無法同步
- 確認 firebase-config.js 已填入正確設定
- 確認 Firebase Realtime Database 已啟用
- 檢查瀏覽器 Console 是否有 Firebase 錯誤訊息

### Service Worker 未註冊
- 確認是透過 HTTPS 或 localhost 訪問
- 清除瀏覽器快取後重新載入
- 檢查 Console 是否有註冊失敗訊息

## 📞 支援

如有問題，請聯絡：盧均林

---

**最後更新**：2026-01-15
