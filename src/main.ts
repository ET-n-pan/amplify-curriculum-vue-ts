import { createApp } from 'vue'
import './style.scss'
import App from './App.vue'
import router from "./router/index.ts"; 
import { createPinia } from "pinia";
import { Amplify } from "aws-amplify";
import { parseAmplifyConfig } from "aws-amplify/utils";
import outputs from "../amplify_outputs.json";

// Amplify設定: AWSサービスとの接続情報を設定
const amplifyConfig = parseAmplifyConfig(outputs);
Amplify.configure({
  Auth: amplifyConfig.Auth, // Cognito認証設定のみ適用
  Storage: amplifyConfig.Storage, // S3ストレージ設定を追加
});

// Vueアプリケーション作成
const app = createApp(App);
// Pinia設定: 状態管理ライブラリをアプリに追加
const pinia = createPinia();

// グローバルプロパティ: アプリ全体でCognitoクライアントIDにアクセス可能
app.config.globalProperties.$clientId = amplifyConfig.Auth?.Cognito.userPoolClientId;

// ルーター設定: ページ遷移機能を追加
app.use(router);
// Piniaをアプリに組み込み
app.use(pinia);

// DOM要素にマウント: アプリケーションを画面に表示
app.mount('#app');