// stores/sales-form-store.ts
import { defineStore } from "pinia";

export const useSalesFormStore = defineStore("salesForm", {
	state: () => ({
		// フォームデータ初期化
		customerCode: "15112009",
		productCode: "PROD001",
		productName: "商品A",
		quantity: "1",
		unitPrice: "1",
		salesDate: new Date().toISOString().split('T')[0],
		orderStatus: "pending",
		paymentStatus: "unpaid",

		// ページネーション
		page: 1,
		pageSize: 10,
		pageCount: 10,
	}),
  
  	// アクション定義
	actions: {
		// フォームバリデーション
		validateForm() {
			const errors = [];
			
			if (!this.customerCode.trim()) {
				errors.push("顧客コードは必須です");
			}
			
			if (!this.productCode) {
				errors.push("商品を選択してください");
			}
			
			if (!this.quantity || parseInt(this.quantity) <= 0) {
				errors.push("数量は1以上の数値を入力してください");
			}

			if (!this.unitPrice || parseInt(this.unitPrice) <= 0) {
				errors.push("単価は1以上の数値を入力してください");
			}
			
			if (!this.salesDate) {
				errors.push("売上日は必須です");
			}

			return errors;
		},
	}
});