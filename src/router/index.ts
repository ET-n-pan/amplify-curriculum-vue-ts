import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/', // ルートパス：ホームページ
        name: 'Home', // ルート名
        component: () => import("../layout/MainLayout.vue"), 
    }
    // 他のルートをここに追加できます
];

const router = createRouter({
    history: createWebHistory(), // HTML5の履歴モードを使用
    routes, // ルート定義を設定
});

// 認証ガードの例（必要に応じて有効化）
// router.beforeEach((to, from, next) => {
//     const isAuthenticated = false; // ここで認証状態を確認
//     if (to.name !== 'Login' && !isAuthenticated) next({ name: 'Login' });
//     else next();
// });

export default router; // ルーターをエクスポート