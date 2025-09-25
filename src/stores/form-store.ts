// stores/form-store.ts
import { defineStore } from "pinia";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

// 商品ごとの単価を定義
const productPrices: { [key: string]: number } = {
	PROD001: 89800,
	PROD002: 2500,
	PROD003: 8900,
};

// // 商品名を定義
// const productNames: { [key: string]: string } = {
// 	PROD001: "ノートパソコン",
// 	PROD002: "マウス",
// 	PROD003: "キーボード",
// };

// 商品コードに基づいて単価を設定
function updateUnitPrice(product_code : string): number {
	return productPrices[product_code] || 5000;
}

// localStorageキー
const ORDERS_KEY = 'orders';
// キャッシュタイムスタンプキー
const CACHE_TIMESTAMP_KEY = 'orders_cache_timestamp';

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

		// 注文データ
		allOrders: [] as Array<Schema['Order']["type"]>,
		// フィルタリングされた注文データ
		filteredOrders: [] as Array<Schema['Order']["type"]>,

		
		count: 0,
		// ローディング状態
		isLoading: false,
		// 最後の同期時間
		lastSyncTime: null as Date | null,

		// ページネーション
		page: 1,
		// 1ページあたりの表示件数
		rowsPerPage: 10,
	}),
	getters: {
		// 注文数を取得
		ordersCount: (state) => {
			return Math.max(state.count, state.allOrders.length);
		},

		// 最後の同期時間を文字列で取得
		lastSyncTimeString: (state) => {
			return state.lastSyncTime ? state.lastSyncTime.toLocaleString() : "未同期";
		},
		
		filteredOrdersCount: (state) => state.filteredOrders.length,

		totalPages: (state) => {
			return Math.ceil(state.filteredOrders.length / state.rowsPerPage);
		},

		paginatedOrders: (state) => {
			const start = (state.page - 1) * state.rowsPerPage;
			return state.filteredOrders.slice(start, start + state.rowsPerPage);
		},

		// ページネーション情報
		paginationInfo: (state) => {
			const startItem = (state.page - 1) * state.rowsPerPage + 1;
			const endItem = Math.min(state.page * state.rowsPerPage, state.filteredOrders.length);
			return {
				startItem,
				endItem,
				totalItems: state.filteredOrders.length,
				currentPage: state.page,
				totalPages: Math.ceil(state.filteredOrders.length / state.rowsPerPage)
			};
		},
	},
  	// アクション定義
	actions: {
		// localStorage操作
		saveOrdersToLocalStorage() {
			localStorage.setItem(ORDERS_KEY, JSON.stringify(this.allOrders));
			localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString());
		},
		loadOrdersFromLocalStorage() {
			const stored = localStorage.getItem(ORDERS_KEY);
			return stored ? JSON.parse(stored) : [];
		},

		getCacheTimestamp(): Date | null {
			const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
			return timestamp ? new Date(timestamp) : null;
		},

		// ページネーション関連
		setCurrentPage(page: number) {
			if (page >= 1 && page <= this.totalPages) {
				this.page = page;
			}
		},

		setRowsPerPage(rows: number) {
			this.rowsPerPage = rows;
			this.page = 1; // ページをリセット
		},

		goToFirstPage() {
			this.page = 1;
		},

		goToLastPage() {
			this.page = this.totalPages;
		},

		goToNextPage() {
			if (this.page < this.totalPages) {
				this.page++;
			}
		},

		goToPreviousPage() {
			if (this.page > 1) {
				this.page--;
			}
		},

		// キャッシュクリア
		clearCache() {
			localStorage.removeItem(ORDERS_KEY);
			localStorage.removeItem(CACHE_TIMESTAMP_KEY);
			this.allOrders = [];
			this.filteredOrders = [];
			this.lastSyncTime = null;
		},

		// 初期化: キャッシュから読み込み、必要に応じて同期
		async initialize() {
			// キャッシュから読み込み
			this.allOrders = this.loadOrdersFromLocalStorage();
			this.lastSyncTime = this.getCacheTimestamp();
			this.filteredOrders = [...this.allOrders];

			console.log("lastSyncTime:", this.lastSyncTime);
			// 必要に応じてサーバーと同期（例: 最後の同期から1時間以上経過している場合、またはキャッシュがない場合）
			if (!this.lastSyncTime || (new Date().getTime() - this.lastSyncTime.getTime()) > 3600000) {
				console.log("Syncing with server...");
				await this.syncWithServer();
			}

			this.page = 1;

		},
		// サーバーと同期
		async syncWithServer(): Promise<{ success: boolean; message: string }> {
			try{
				this.isLoading = true;
				const result = await client.queries.getOrder({});
				console.log("Sync result:", result);
				if (result.data?.count) {
					this.count = result.data.count;
				}
				if (result.data?.data) {
					this.allOrders = result.data.data as Array<Schema['Order']["type"]>;
					this.filteredOrders = [...this.allOrders];
					this.lastSyncTime = new Date();
					this.saveOrdersToLocalStorage();

					while (this.allOrders.length < this.count) {
						const nextResult = await client.queries.getOrder({
							skip: this.allOrders.length
						});
						if (nextResult.data?.data) {
							this.allOrders = this.allOrders.concat(nextResult.data.data as Array<Schema['Order']["type"]>);
							this.filteredOrders = [...this.allOrders];
							this.saveOrdersToLocalStorage();
						} else {
							break;
						}

					}

					return { success: true, message: "同期に成功しました" };
				} else {
					return { success: false, message: "データ取得に失敗しました" };
				}
			} catch (error) {
				console.error("Sync error:", error);
				return { success: false, message: "同期中にエラーが発生しました" };
			} finally {
				this.isLoading = false;
			}
		},

		// フィルタリング機能
		applyFiltersAndSort(filters: {
			customer_code: string;
			product_code: string;
			min_quantity: string;
		}, sort: {
			field: string;
			direction: 'asc' | 'desc';
		}) {
			let result = [...this.allOrders];
			
			// フィルタリング
			if (filters.customer_code.trim()) {
				result = result.filter(order => 
					order.customer_code?.toLowerCase().includes(filters.customer_code.toLowerCase())
				);
			}
			
			if (filters.product_code) {
				result = result.filter(order => order.product_code === filters.product_code);
			}
			
			if (filters.min_quantity && !isNaN(Number(filters.min_quantity))) {
				result = result.filter(order => 
					Number(order.quantity) >= Number(filters.min_quantity)
				);
			}
			
			// ソート
			if (sort.field) {
				result.sort((a, b) => {
					const aVal = (a as any)[sort.field];
					const bVal = (b as any)[sort.field];

					const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
					return sort.direction === 'asc' ? comparison : -comparison;
				});
			}
			
			this.filteredOrders = result;
			this.page = 1; // ページをリセット
		},


		// フォームリセット
		reset() {
			this.customer_code = "15112009";
			this.quantity = "1";
			this.unit_price = updateUnitPrice(this.product_code).toString();
			this.delivery_date = new Date().toISOString().split('T')[0];
			this.product_code = "PROD001";
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
		async updateOrder(orderId: any, orderData: any) {
			if (!orderId) {
				return { success: false, message: "無効な注文IDです" };
			}
			if (!orderData || typeof orderData !== 'object') {
				return { success: false, message: "無効な注文データです" };
			}
			// 数量と単価を更新
			const quantity = parseInt(orderData.quantity);
			const unit_price = orderData.unit_price ? parseInt(orderData.unit_price) : updateUnitPrice(orderData.product_code);
			const estimated_cost = quantity * unit_price;
			if (isNaN(quantity) || quantity <= 0) {
				return { success: false, message: "数量は1以上の数値を入力してください" };
			}
			if (isNaN(unit_price) || unit_price <= 0) {
				return { success: false, message: "無効な商品コードです" };
			}
			const updatedOrder = {
				...orderData,
				quantity: quantity,
				unit_price: unit_price,
				estimated_cost: estimated_cost,
			};
			try {
				//localデータ更新
				const index = this.allOrders.findIndex((o) => o.ID === orderId);
				if (index !== -1) {
					this.allOrders[index] = updatedOrder;
					this.filteredOrders = [...this.allOrders];
					this.saveOrdersToLocalStorage();
				} else {
					return { success: false, message: "注文が見つかりません" };
				}
				// DB更新
				const result = await client.mutations.updateOrder(updatedOrder);
				if (result.data) {
					return { success: true, message: "注文が更新されました", order: result.data };
				}
				return { success: false, message: "更新に失敗しました" };
			} catch (error) {
				console.error("Update order error:", error);
				return { success: false, message: "更新中にエラーが発生しました" };
			}	
		},

		// 注文追加	
		async addOrder(): Promise<{ success: boolean; message: string; order?: any }> {
			console.log('date: ', (document.getElementById('date') as HTMLInputElement)?.value);
			console.log("Adding order...", this.customer_code, this.product_code, this.quantity, this.delivery_date);
			const validationErrors = this.validateForm();
			
			if (validationErrors.length > 0) {
				const errorMessage = validationErrors.join('\n');
				return { success: false, message: errorMessage };
			}
			
			// 新しい注文オブジェクトを作成
			const newOrder = {
				ID: Date.now().toString(36) + Math.random().toString(36).substring(2, 8),
				customer_code: this.customer_code,
				product_code: this.product_code,
				quantity: parseInt(this.quantity),
				unit_price: updateUnitPrice(this.product_code),
				estimated_cost: (parseInt(this.quantity) * updateUnitPrice(this.product_code)),
				delivery_date: this.delivery_date,
				status: "新規",
				created_at: new Date().toISOString(),
			};

			try {
				// DBに追加
				const result = await client.mutations.createOrder(newOrder);
				if (result.data) {
					// ローカルデータに追加
					this.allOrders.push(result.data);
					this.filteredOrders.push(result.data);
					this.saveOrdersToLocalStorage();
					
					// フォームをリセット
					this.reset();
					return { success: true, message: "注文が追加されました", order: result.data };
				}
				return { success: false, message: "追加に失敗しました" };
			} catch (error) {
				console.error("Add order error:", error);
				return { success: false, message: "追加中にエラーが発生しました" };
			}
		},
		// 注文削除
		async deleteSelectedOrders(selectedOrderIds: string[]): Promise<{ success: boolean; message: string }> {
			if (selectedOrderIds.length === 0) {
				return { success: false, message: "削除する注文を選択してください" };
			}
			try {
				// ローカルデータから削除
				this.allOrders = this.allOrders.filter((order) => 
					order.ID && !selectedOrderIds.includes(order.ID)
				);
				this.filteredOrders = this.filteredOrders.filter((order) => 
					order.ID && !selectedOrderIds.includes(order.ID)
				);

				this.saveOrdersToLocalStorage();

				// DBから削除
				for (const orderId of selectedOrderIds) {
					await client.mutations.deleteOrder({ ID: orderId });
				}
				
				return { 
					success: true, 
					message: `${selectedOrderIds.length}件の注文を削除しました` 
				};
			} catch (error) {
				console.error("Delete orders error:", error);
				return { success: false, message: "削除中にエラーが発生しました" };
			}
		},
  }
});