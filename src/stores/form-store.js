// stores/form-store.ts
import { defineStore } from "pinia";


// 商品ごとの単価を定義
const productPrices = {
	PROD001: 1000,
	PROD002: 2000,
	PROD003: 3000,
};

// 商品コードに基づいて単価を設定
function updateUnitPrice(productCode) {
	return productPrices[productCode] || 0;
}

export const useFormStore = defineStore("form", {
	state: () => ({
		// フォームデータ初期化
		customerCode: "15112009",
		productCode: "PROD001",
		quantity: "1",
		unitPrice: updateUnitPrice("PROD001").toString(),
		deliveryDate: new Date().toISOString().split('T')[0],

		// 注文リストをlocalStorageから取得
		orders: JSON.parse(localStorage.getItem('orders') || '[]'),

		// ページネーション
		page: 1,
	}),
  
  // アクション定義
	actions: {
		// フォームリセット
		reset() {
		this.customerCode = "15112009";
		this.quantity = "1";
		this.unitPrice = updateUnitPrice(this.productCode).toString();
		this.deliveryDate = new Date().toISOString().split('T')[0];
	},
    
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
		
		if (!this.deliveryDate) {
			errors.push("納期は必須です");
		}
		
		return errors;
    },
    
	// 注文数量更新
	updateOrderQuantity(orderId, newQuantity) {
		const order = this.orders.find(o => o.id === orderId);
		if (order) {
			order.quantity = newQuantity;
			localStorage.setItem('orders', JSON.stringify(this.orders));
		}
	},

	updateOrder(orderId, updatedData) {
		const orderIndex = this.orders.findIndex(o => o.id === orderId);
		if (orderIndex !== -1) {
			this.orders[orderIndex] = { ...this.orders[orderIndex], ...updatedData };
			localStorage.setItem('orders', JSON.stringify(this.orders));
		}
	},

    // 注文追加
    addOrder() {
		const validationErrors = this.validateForm();
		
		if (validationErrors.length > 0) {
			// エラーメッセージ表示
			const errorMessage = validationErrors.join('\n');
			return { success: false, message: errorMessage };
		}
		
		// 新しい注文オブジェクトを作成
		const newOrder = {
			id: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
			customerCode: this.customerCode,
			productCode: this.productCode,
			quantity: this.quantity,
			unitPrice: updateUnitPrice(this.productCode),
			estimatedCost: (parseInt(this.quantity) * parseInt(updateUnitPrice(this.productCode))),
			deliveryDate: this.deliveryDate,
			status: "新規",
			createdAt: new Date().toLocaleString(),
		};
		// 注文リストに追加
		this.orders.push(newOrder);
		// localStorageに保存
		localStorage.setItem('orders', JSON.stringify(this.orders));
		
		// フォームをリセット
		this.reset();
		return { success: true, message: "注文が追加されました。"};
    },
    
	// 全注文クリア
    clearAllOrders() {
		this.orders = [];
		localStorage.removeItem('orders');
    },

	// 選択した注文を削除
    deleteOrder(selectionElement, messageElement) {
        if (!selectionElement) {
			if (messageElement) {
				messageElement.open = true;
				messageElement.innerText = "選択機能が見つかりません。";
			}
			return;
		}
		const selectedRows = selectionElement.selected.split(' ');

		if (selectedRows.length === 0 || (selectedRows.length === 1 && selectedRows[0] === '')) {
			if (messageElement) {
				messageElement.open = true;
				messageElement.innerText = "削除する注文を選択してください。";
			}
			return;
		}
		this.orders = this.orders.filter(order => !selectedRows.includes(order.id));
		localStorage.setItem('orders', JSON.stringify(this.orders));
		selectionElement.selected = '';
		if (messageElement) {
			messageElement.open = true;
			messageElement.innerText = `${selectedRows.length}件の注文を削除しました。`;
		}
    }
  }
});