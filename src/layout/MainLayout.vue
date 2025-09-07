<template>
  <authenticator>
    <template v-slot="{ user, signOut }">
        <!-- UI5のシェルバーを追加 -->

        <!-- UI5のナビゲーションレイアウトを追加 -->
        <ui5-navigation-layout>
            <!-- シェルバーの設定: 通知数、通知表示、プロフィールクリックイベント -->
            <ui5-shellbar notifications-count="5" show-notifications @ui5-profile-click="">
                <!-- メニューボタン -->
                <ui5-button icon="menu2" slot="startButton"></ui5-button>
                <!-- 戻るボタン、クリックでサインアウト -->
                <ui5-button icon="nav-back" slot="startButton" @click="signOut"></ui5-button>
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
        </ui5-navigation-layout>
        <main style="padding: 20px;">
            <router-view />
        </main>
    </template>
    </authenticator>
</template>

<script setup lang="ts">
import "../lib/UI5FormComp.js";
import { Authenticator } from "@aws-amplify/ui-vue";
import { I18n } from "aws-amplify/utils";
import {translations} from "@aws-amplify/ui";
import '@aws-amplify/ui-react/styles.css';

// 多言語対応設定
I18n.putVocabularies(translations);
// 日本語に設定
I18n.setLanguage("ja");
// デフォルトアバター画像URL
const defaultAvatar = "https://ui5.sap.com/resources/sap/m/themes/base/img/Person.png";
</script>