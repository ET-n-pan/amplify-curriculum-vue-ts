<template>
  <authenticator>
    <template v-slot="{ user, signOut }">
        <!-- ユーザーデータをセット -->
        {{ setUserData(user) }}

        <!-- UI5のナビゲーションレイアウトを追加 -->
        <ui5-navigation-layout ref="layoutRef">
            
            <!-- シェルバーの設定: 通知数、通知表示、プロフィールクリックイベント -->
            <ui5-shellbar notifications-count="5" show-notifications @ui5-profile-click="onProfileClick">
                
                <!-- メニューボタン -->
                <ui5-button icon="menu2" slot="startButton" @click="toggleSidebar"></ui5-button>
                
                <!-- 戻るボタン -->
                <ui5-button icon="nav-back" slot="startButton" ></ui5-button>
                
                <!-- ブランドロゴとタイトル -->
                <ui5-shellbar-branding slot="branding">
                    <img slot="logo" src="https://ui5.github.io/webcomponents/images/sap-logo-svg.svg" />
                </ui5-shellbar-branding>
                
                <!-- トライアルタグ -->
                <ui5-tag color-scheme="7" slot="content" design="Information">Trial</ui5-tag>
                
                <!-- スペーサー -->
                <ui5-shellbar-spacer slot="content"></ui5-shellbar-spacer>
                
                <!-- 検索フィールド -->
                <ui5-input placeholder="Instructions" slot="searchField"></ui5-input>
                
                <!-- ユーザーアバター -->
                <ui5-avatar slot="profile">
                    <img :src="defaultAvatar" />
                </ui5-avatar>
            </ui5-shellbar>
        
        <!-- ユーザーメニュー、サインアウトイベント -->
        <ui5-user-menu ref="userMenuRef" @sign-out-click="signOut">
            <!-- ユーザーアカウント情報 -->
            <ui5-user-menu-account
                slot="accounts"
                :avatar-src="globalStore.avatar || defaultAvatar"
                :title-text="globalStore.username || 'User Name'"
                :subtitle-text="globalStore.email || 'Email Address'"
                description="Delivery Manager, SAP SE"
                selected
            ></ui5-user-menu-account>
            <!-- ユーザーメニューアイテム -->
            <ui5-user-menu-item icon="person-placeholder" text="Profile" data-id="setting" @click="profile"></ui5-user-menu-item>
            <ui5-user-menu-item icon="action-settings" text="Setting" data-id="setting"></ui5-user-menu-item>
            <ui5-user-menu-item icon="palette" text="テーマ">
            <ui5-menu-item
              v-for="(themeLabel, themeKey) in themes"
              :key="themeKey"
              :text="themeLabel"
              :icon="themeKey === currentTheme ? 'accept' : ''"
              icon-color="Positive"
              @click="changeTheme(themeKey)"
            />
            </ui5-user-menu-item>
        </ui5-user-menu>

        <ui5-side-navigation slot="sideContent" @selection-change="changeMenu">
            <ui5-side-navigation-item v-for="item in navItems" :key="item.path" :text="item.label" :icon="item.icon" :data-route="item.path" />
        </ui5-side-navigation>


        <main style="padding: 20px;">
            <router-view />
        </main>
        </ui5-navigation-layout>
        
    </template>
    </authenticator>
</template>

<script setup>
import "../lib/UI5FormComp.js";
import { Authenticator } from "@aws-amplify/ui-vue";
import { I18n } from "aws-amplify/utils";
import {translations} from "@aws-amplify/ui";
import '@aws-amplify/ui-vue/styles.css';
import { ref, getCurrentInstance } from "vue";
import { useRouter } from "vue-router";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";
import NavigationLayoutMode from "@ui5/webcomponents-fiori/dist/types/NavigationLayoutMode.js";
import { useGlobalStore } from "../stores/global-store";

const globalStore = useGlobalStore();
const layoutRef = ref(null);
const userMenuRef = ref(null);
const currentTheme = ref("sap_horizon");
const router = useRouter();


// 多言語対応設定
I18n.putVocabularies(translations);
// 日本語に設定
I18n.setLanguage("ja");
// デフォルトアバター画像URL
const defaultAvatar = "https://ui5.sap.com/resources/sap/m/themes/base/img/Person.png";
const themes = {
  sap_horizon: "Horizon",
  sap_horizon_dark: "Horizon Dark",
  sap_fiori_3: "Quartz",
  sap_fiori_3_dark: "Quartz Dark",
  sap_fiori_3_hcw: "Belize",
  sap_fiori_3_hcb: "Belize Dark",
};

const instance = getCurrentInstance();
const clientId = instance?.appContext.config.globalProperties.$clientId;
const setUserData = async (user) => {
  if (user) {
    await globalStore.setUser(user, clientId);
  }
};

// プロフィールクリックイベントハンドラ
const onProfileClick = (event) => {
    const target = event.detail.targetRef;
    // if文でuserMenuRefが存在するか確認し、存在する場合はopenerを設定してメニューを開く
    if (userMenuRef.value) {
        userMenuRef.value.opener = target;
        userMenuRef.value.open = true;
    }
};
// ナビゲーションアイテム
const navItems = [
  { path: "/plan3", label: "テーブル案３", icon: "menu" },
  { path: "/orders2", label: "案５単票入力画面", icon: "my-sales-order" },
];
// サイドバーの表示・非表示を切り替える関数
const toggleSidebar = () => {
  if (layoutRef.value) {
    layoutRef.value.mode = layoutRef.value.isSideCollapsed() ? NavigationLayoutMode.Expanded : NavigationLayoutMode.Collapsed;
  }
};
// メニュー選択変更イベントハンドラ
const changeMenu = (event) => {
  const selectedItem = event.detail.item;
  const route = selectedItem.getAttribute("data-route");
  if (route) {
    router.push(route);
  }
};

// テーマ変更関数
const changeTheme = (themeKey) => {
  setTheme(themeKey);
  currentTheme.value = themeKey;
};

// プロフィールページへ遷移する関数
const profile = () => {
  router.push({ name: "Profile" });
};
</script>