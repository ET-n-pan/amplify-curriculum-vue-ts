import { defineStore } from "pinia";

export const useGlobalStore = defineStore("global", {
  state: () => ({
    // ユーザー情報 (Cognitoから)
    username: "",
    email: "",
    avatar: "",
    idToken: "",
    
    // アプリの状態
    isLoading: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.username,
  },
  actions: {
    setUser(user: any, clientId:any) {
      this.username = user.userId || "";
      this.email = user.signInDetails.loginId || "";
      this.avatar = "https://ui5.sap.com/resources/sap/m/themes/base/img/Person.png";

      // IDトークンを取得
      this.idToken = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${this.username}.idToken`) || "";
    },
    
    showLoading() {
      this.isLoading = true;
    },
    
    hideLoading() {
      this.isLoading = false;
    }
  }
});