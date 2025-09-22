// Vue Router: ページ遷移を管理するライブラリのインポート
import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";

// TypeScript: ルート設定の型定義
const routes: RouteRecordRaw[] = [
  {
    path: "/",                                           // ルートパス: ホームページのURL
    name: "home",                                        // ルート名: プログラムでナビゲーション時に使用
    component: () => import("@/layout/MainLayout.vue"), // 遅延読み込み: 必要時にコンポーネントを読み込み
  },
  {
    path: "/ui5-table",                                    // 注文ページのパス
    component: () => import("@/layout/MainLayout.vue"), // 親レイアウト: 共通のヘッダー・フッターを表示
    children: [                                          // 子ルート: 親レイアウト内に表示されるページ
      {
        path: "",                                        // 空パス: /ui5-table にアクセス時に表示される子コンポーネント
        name: "ui5-table",                                 // ルート名: プログラムでナビゲーション時に使用
        component: () => import("@/pages/Orders2Page.vue"), // 実際の注文ページコンポーネント
      },
    ],
  },
  {
    path: "/aggrid",                                    // アップロードページのパス
    component: () => import("@/layout/MainLayout.vue"), // 同じレイアウトを使用
    children: [
      {
        path: "",                                        // plan3 アクセス時の子コンポーネント
        name: "aggrid",
        component: () => import("@/pages/AgGridPage.vue"), // AgGridPage コンポーネントを表示
      },
    ],
  },
  {
    path: "/upload",                                    // アップロードページのパス
    component: () => import("@/layout/MainLayout.vue"), // 同じレイアウトを使用
    children: [
      {
        path: "",
        name: "upload",
        component: () => import("@/pages/UploadPage.vue"), // UploadPage コンポーネントを表示
      },
    ],
  },
  {
    path: "/sales",                                    // 売上ページのパス
    component: () => import("@/layout/MainLayout.vue"), // 親レイアウト: 共通のヘッダー・フッターを表示
    children: [                                          // 子ルート: 親レイアウト内に表示されるページ
      {
        path: "",                                        // 空パス: /sales にアクセス時に表示される子コンポーネント
        name: "sales",                                 // ルート名: プログラムでナビゲーション時に使用
        component: () => import("@/pages/SalesPage.vue"), // 実際の売上ページコンポーネント
      },
    ],
  },
];

// ルーター作成: 上記のルート設定でルーターインスタンスを作成
const router = createRouter({
  history: createWebHashHistory(), // ハッシュモード: URL に # が付く (例: domain.com/#/orders2)
  routes, // ルート設定を適用
});

export default router; // 他のファイルで使用できるようにエクスポート