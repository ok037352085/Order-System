# 點餐系統交接清單

## 一、建立新的 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/) 並登入**客戶的 Google 帳號**
2. 建立新專案
3. 依序啟用以下服務：
   - **Firestore Database**（選 Production mode）
   - **Authentication**（啟用 Email/Password 登入）
   - **Storage**（選預設規則即可）
   - **Hosting**

---

## 二、更新 Firebase 設定

取得新專案的 `firebaseConfig`（專案設定 → 你的應用程式），更新以下檔案：

**`src/firebase.js`**
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

---

## 三、建立管理員帳號

在新 Firebase 專案的 **Authentication → 使用者** 中新增一筆帳號：
- Email：客戶指定的信箱
- 密碼：自訂（建議至少 8 碼）

---

## 四、部署 Firestore 規則與索引

```bash
firebase login
firebase use --add   # 選擇新專案
firebase deploy --only firestore
```

---

## 五、更換品牌資訊

### 餐廳名稱
**`src/views/customer/MenuView.vue`** 第 71 行：
```html
<h1 class="text-lg font-bold">早餐店</h1>  <!-- 改成客戶店名 -->
```

### Header 顏色（橘色漸層）
**`src/style.css`**：
```css
.admin-header { background: linear-gradient(90deg, ...); }
.user-header  { background: linear-gradient(90deg, ...); }
```
可至 [cssgradient.io](https://cssgradient.io/) 產生新的漸層色碼。

### 網站 Icon
將新 icon 放到 `public/favicon.png`，並確認 `index.html` 中的路徑正確：
```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

### 預設商品 Emoji（無圖片時的佔位圖）
搜尋專案中的 `🍳`，依店家類型替換成適合的 emoji。

---

## 六、部署網站

```bash
firebase deploy
```

部署完成後會得到一個 `*.web.app` 網址，記下來供後續使用。

---

## 七、重新產生 QR Code

1. 登入後台 → **QR Code 管理**
2. 確認網域已自動更新為新的 `*.web.app` 網址
3. 依桌號列印新的 QR Code

---

## 八、輸入菜單資料

登入後台 → **菜單管理**：
1. 新增分類（例：早餐、飲料、套餐）
2. 在各分類下新增商品（名稱、價格、圖片、選項）

---

## 九、移交後確認清單

| 項目 | 確認 |
|------|------|
| 客戶可用自己帳號登入後台 | ☐ |
| Firebase 專案擁有者為客戶 Google 帳號 | ☐ |
| 餐廳名稱已更換 | ☐ |
| 品牌顏色已更換 | ☐ |
| Icon 已更換 | ☐ |
| 菜單資料已輸入 | ☐ |
| QR Code 已列印並貼於桌上 | ☐ |
| 客戶了解如何新增/修改商品 | ☐ |
| 客戶了解如何操作訂單管理 | ☐ |

---

## 附註

- Firebase Blaze（隨用隨付）方案：小型餐廳日常用量幾乎不會產生費用，但建議客戶設定**預算警示**（Firebase Console → 專案設定 → 用量與計費）
- 訂單資料永久保存在 Firestore，不會自動刪除
- 如需將開發期間的測試資料清除，至 Firestore Console 手動刪除 `orders` 集合中的文件即可
