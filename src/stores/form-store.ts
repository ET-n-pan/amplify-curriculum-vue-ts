// stores/form-store.ts
import { defineStore } from "pinia";
import type { Schema } from "@/amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

// 商品ごとの単価を定義
const productPrices: { [key: string]: number } = {
	PROD001: 1000,
	PROD002: 2000,
	PROD003: 3000,
};

// 商品コードに基づいて単価を設定
function updateUnitPrice(product_code : string): number {
	return productPrices[product_code] || 0;
}

export const useFormStore = defineStore("form", {
	state: () => ({
		// フォームデータ初期化
		ID: "",
		customer_code: "15112009",
		product_code: "PROD001",
		quantity: "1",
		unit_price: updateUnitPrice("PROD001").toString(),
		delivery_date: new Date().toISOString().split('T')[0],
		created_at: new Date(),
		status: "新規",
		estimated_cost: "1000",



		// 注文リストをlocalStorageから取得
		orders: JSON.parse(localStorage.getItem('orders') || '[]'),
		// ページネーション
		page: 1,
	}),
  
  	// アクション定義
	actions: {
		// フォームリセット
		reset() {
			this.customer_code = "15112009";
			this.quantity = "1";
			this.unit_price = updateUnitPrice(this.product_code).toString();
			this.delivery_date = new Date().toISOString().split('T')[0];
			this.product_code = "PROD001";
		},
		setOrders(orders: any) {
			this.orders = []; // 既存の注文をクリア
			this.orders = orders;
			localStorage.setItem('orders', JSON.stringify(this.orders));
		},
		async fetchOrders() {
			const result = await client.queries.getOrders();
			if (result.data) {
				this.setOrders(result.data.items);
				console.log("Orders fetched:", result.data.items);
			}else{
				console.error("Failed to fetch orders");
			}
		},

		// フォームバリデーション
		validateForm() {
			const errors = [];

			if (this.customer_code === null || this.customer_code.trim() === "") {
				errors.push("顧客コードは必須です");
			}
			
			if (this.product_code === null || (this.product_code in productPrices) === false) {
				errors.push("商品を選択してください");
			}
			
			if (this.quantity === null || parseInt(this.quantity) <= 0) {
				errors.push("数量は1以上の数値を入力してください");
			}
			
			if (this.delivery_date == null || this.delivery_date.trim() === "") {
				errors.push("納期は必須です");
			}
			
			return errors;
		},
		
		// 注文数量更新
		async updateOrderQuantity(orderId: any, newQuantity: any) {
			const order = this.orders.find((o: { ID: any; }) => o.ID === orderId);
			console.log(order);
			if (order) {
				order.quantity = newQuantity;
				localStorage.setItem('orders', JSON.stringify(this.orders));
			}

	
			// DB更新
			const result = await client.mutations.updateOrder(order);
			if (result.data) {
				console.log("Order updated:", result.data);
			}else{
				console.error("Failed to update order ID:", orderId);
				this.fetchOrders(); // 再度注文を取得して同期
			}
		},

		updateOrder(orderId: any, updatedData: any) {
			const orderIndex = this.orders.findIndex((o: { ID: any; }) => o.ID === orderId);
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
				ID: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
				customer_code: this.customer_code,
				product_code: this.product_code,
				quantity: this.quantity,
				unit_price: updateUnitPrice(this.product_code),
				estimated_cost: (parseInt(this.quantity) * updateUnitPrice(this.product_code)),
				delivery_date: this.delivery_date,
				status: "新規",
				created_at: new Date().toLocaleString(),
			};
			
			// 注文リストに追加
			this.orders.push(newOrder);
			// localStorageに保存
			localStorage.setItem('orders', JSON.stringify(this.orders));
			
			// フォームをリセット
			this.reset();
			return { success: true, message: "注文が追加されました。", order: newOrder };
		},
		
		// 全注文クリア
		clearAllOrders() {
			this.orders = [];
			localStorage.removeItem('orders');
		},

		// 選択した注文を削除
		async deleteOrder(selectionElement: { selected: string; } | null, messageElement: { open: boolean; innerText: string; } | null) {
			if (selectionElement == null) {
				if (messageElement != null) {
					messageElement.open = true;
					messageElement.innerText = "選択機能が見つかりません。";
				}
				return;
			}
			const selectedRows = selectionElement.selected.split(" ");
			console.log("Selected rows to delete:", selectedRows);
			if (selectedRows.length === 0 || (selectedRows.length === 1 && selectedRows[0] === '')) {
				if (messageElement != null) {
					messageElement.open = true;
					messageElement.innerText = "削除する注文を選択してください。";
				}
				return;
			}
			this.orders = this.orders.filter((order: { ID: any; }) => !selectedRows.includes(order.ID));
			localStorage.setItem('orders', JSON.stringify(this.orders));
			selectionElement.selected = '';



			// 削除リクエストを送信
			for (let orderId of selectedRows) {
				console.log("Deleting order ID:", orderId);
				try {
					const result = await client.mutations.deleteOrder({ ID: orderId });
					if (result.data) {
						console.log("Order deleted:", result.data);
					}else{
						console.error("Failed to delete order ID:", orderId);
						this.fetchOrders(); // 再度注文を取得して同期
					}
				} catch (error) {
					console.error("Error deleting order ID:", orderId, error);
					this.fetchOrders(); // 再度注文を取得して同期
				}
			}
			if (messageElement != null) {
				messageElement.open = true;
				messageElement.innerText = `${selectedRows.length}件の注文を削除しました。`;
			}
			return;
		}
  }
});