// stores/sales-store.ts
import { defineStore } from "pinia";
import type { Schema } from "../../amplify/data/resource";
import { generateClient } from "aws-amplify/data";


const client = generateClient<Schema>();

// Product prices and names
const productPrices: Record<string, number> = {
  PROD001: 89800,
  PROD002: 2500,
  PROD003: 8900,
};

const productNames: Record<string, string> = {
  PROD001: "ノートパソコン",
  PROD002: "マウス",
  PROD003: "キーボード",
};

// LocalStorage keys
const SALES_KEY = 'sales';
const SALES_CACHE_TIMESTAMP_KEY = 'sales_cache_timestamp';

interface Sale {
  ID: string;
  sales_year: number;
  sales_month: number;
  sales_week?: number;
  customer_code: string;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  order_status: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

export const useSalesStore = defineStore("sales", {
  state: () => ({
    // Form data
    sales_year: new Date().getFullYear().toString(),
    sales_month: (new Date().getMonth() + 1).toString(),
    sales_week: "",
    customer_code: "15112009",
    product_code: "PROD001",
    quantity: "1",
	  unit_price: productPrices["PROD001"].toString(),
    order_status: "pending",
    payment_status: "unpaid",

	  count: 0,
    // Sales data
    allSales: [] as Sale[],
    filteredSales: [] as Sale[],

    // State management
    isLoading: false,
    lastSyncTime: null as Date | null,

    // Pagination
    page: 1,
    rowsPerPage: 10,
  }),

  getters: {
    totalSalesCount: (state) => {
      return Math.max(state.allSales.length, state.count);
    },
    totalPages: (state) => {
      return Math.ceil(state.filteredSales.length / state.rowsPerPage);
    },

    paginatedSales: (state) => {
      const start = (state.page - 1) * state.rowsPerPage;
      return state.filteredSales.slice(start, start + state.rowsPerPage);
    },

    paginationInfo: (state) => {
      const startItem = (state.page - 1) * state.rowsPerPage + 1;
      const endItem = Math.min(state.page * state.rowsPerPage, state.filteredSales.length);
      return {
        startItem,
        endItem,
        totalItems: state.filteredSales.length,
        currentPage: state.page,
        totalPages: Math.ceil(state.filteredSales.length / state.rowsPerPage)
      };
    },
  },

  actions: {
    // LocalStorage operations
    saveSalesToLocalStorage() {
      localStorage.setItem(SALES_KEY, JSON.stringify(this.allSales));
      localStorage.setItem(SALES_CACHE_TIMESTAMP_KEY, new Date().toISOString());
    },

    loadSalesFromLocalStorage(): Sale[] {
      const stored = localStorage.getItem(SALES_KEY);
      return stored ? JSON.parse(stored) : [];
    },

    getCacheTimestamp(): Date | null {
      const timestamp = localStorage.getItem(SALES_CACHE_TIMESTAMP_KEY);
      return timestamp ? new Date(timestamp) : null;
    },

    // Pagination
    setCurrentPage(page: number) {
      if (page >= 1 && page <= this.totalPages) {
        this.page = page;
      }
    },

    setRowsPerPage(rows: number) {
      this.rowsPerPage = rows;
      this.page = 1;
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

    // Initialize
    async initialize() {
      this.allSales = this.loadSalesFromLocalStorage();
      this.lastSyncTime = this.getCacheTimestamp();
      this.filteredSales = [...this.allSales];

      // Sync if cache is old or empty
      if (!this.lastSyncTime || (new Date().getTime() - this.lastSyncTime.getTime()) > 3600000) {
        await this.syncWithServer();
      }

      this.page = 1;
      this.rowsPerPage = 10;
      this.count = this.allSales.length;
    },

    // Sync with server
    async syncWithServer(): Promise<{ success: boolean; message: string }> {
      try {
        this.isLoading = true;
        const result = await client.queries.getSales({});
        if (result.data?.data) {
          console.log("Fetched sales data:", result.data);
          this.allSales = result.data.data as Sale[];
          this.filteredSales = [...this.allSales];
          this.count = result.data.count ?? 0;
          this.lastSyncTime = new Date();
          this.saveSalesToLocalStorage();
          
          while (this.allSales.length < this.count) {
            const nextResult = await client.queries.getSales(
              {
                skip: this.allSales.length
              }
				);
        console.log("Fetched next page of sales data:", nextResult.data);
				if (nextResult.data?.data) {
					this.allSales = this.allSales.concat(nextResult.data.data as Sale[]);
					this.filteredSales = [...this.allSales];
					this.saveSalesToLocalStorage();
				} else {
					break;
				}
			}
			
			console.log("Total sales after pagination fetch:", this.allSales.length);
			
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

    // Apply filters and sort
    applyFiltersAndSort(filters: {
      year: string;
      month: string;
      customer_code: string;
      product_code: string;
      order_status: string;
    }, sort: {
      field: string;
      direction: 'asc' | 'desc';
    }) {
      let result = [...this.allSales];
      
      // Filtering
      if (filters.year) {
        result = result.filter(sale => 
          sale.sales_year === parseInt(filters.year)
        );
      }
      
      if (filters.month) {
        result = result.filter(sale => 
          sale.sales_month === parseInt(filters.month)
        );
      }
      
      if (filters.customer_code.trim()) {
        result = result.filter(sale => 
          sale.customer_code.toLowerCase().includes(filters.customer_code.toLowerCase())
        );
      }
      
      if (filters.product_code) {
        result = result.filter(sale => sale.product_code === filters.product_code);
      }
      
      if (filters.order_status) {
        result = result.filter(sale => sale.order_status === filters.order_status);
      }
      
      // Sorting
      if (sort.field) {
        result.sort((a, b) => {
          const aVal = a[sort.field as keyof Sale];
          const bVal = b[sort.field as keyof Sale];
          
          if (aVal === undefined && bVal === undefined) return 0;
          if (aVal === undefined) return 1;
          if (bVal === undefined) return -1;
          
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return sort.direction === 'asc' ? comparison : -comparison;
        });
      }
      
      this.filteredSales = result;
      this.page = 1;
    },

    // Form reset
    reset() {
    //   this.sales_year = new Date().getFullYear().toString();
    //   this.sales_month = (new Date().getMonth() + 1).toString();
    //   this.sales_week = "";
    //   this.customer_code = "15112009";
    //   this.product_code = "PROD001";
    //   this.quantity = "1";
    //   this.order_status = "pending";
    //   this.payment_status = "unpaid";
    },

    // Form validation
    validateForm() {
      const errors = [];

      if (!this.sales_year || parseInt(this.sales_year) < 2000 || parseInt(this.sales_year) > 2100) {
        errors.push("有効な年を入力してください");
      }
      
      if (!this.sales_month || parseInt(this.sales_month) < 1 || parseInt(this.sales_month) > 12) {
        errors.push("有効な月を選択してください");
      }
      
      if (this.sales_week && (parseInt(this.sales_week) < 1 || parseInt(this.sales_week) > 5)) {
        errors.push("週は1-5の範囲で入力してください");
      }
      
      if (!this.customer_code.trim()) {
        errors.push("顧客コードは必須です");
      }
      
      if (!this.product_code || !(this.product_code in productPrices)) {
        errors.push("商品を選択してください");
      }
      
      if (!this.quantity || parseInt(this.quantity) <= 0) {
        errors.push("数量は1以上の数値を入力してください");
      }
      
      return errors;
    },

    // Add sale
    async addSale(): Promise<{ success: boolean; message: string; sale?: Sale }> {
      const validationErrors = this.validateForm();
      
      if (validationErrors.length > 0) {
        return { success: false, message: validationErrors.join('\n') };
      }
      
      const quantity = parseInt(this.quantity);
      const unitPrice = productPrices[this.product_code];
      
      const newSale = {
		ID: null,
        sales_year: parseInt(this.sales_year),
        sales_month: parseInt(this.sales_month),
        sales_week: this.sales_week ? parseInt(this.sales_week) : undefined,
        customer_code: this.customer_code,
        product_code: this.product_code,
        product_name: productNames[this.product_code],
        quantity: quantity,
        unit_price: unitPrice,
        total_amount: quantity * unitPrice,
        order_status: this.order_status,
        payment_status: this.payment_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
	  console.log("New sale to add:", newSale);
      try {
        // Add to DB
        const result = await client.mutations.createSale(newSale);
		console.log("Add sale result:", result);
        if (result.data) {
          // Add to local data
          this.allSales.push(result.data as Sale);
          this.filteredSales.push(result.data as Sale);
          this.saveSalesToLocalStorage();
          
          // Reset form
          this.reset();
          return { success: true, message: "売上データが追加されました", sale: result.data as Sale };
        }
        return { success: false, message: "追加に失敗しました" };
      } catch (error) {
        console.error("Add sale error:", error);
        return { success: false, message: "追加中にエラーが発生しました" };
      }
    },

    // Delete sales
    async deleteSelectedSales(selectedSaleIds: string[]): Promise<{ success: boolean; message: string }> {
      if (selectedSaleIds.length === 0) {
        return { success: false, message: "削除する売上データを選択してください" };
      }
      
      try {
        // Remove from local data
        this.allSales = this.allSales.filter(sale => 
          !selectedSaleIds.includes(sale.ID)
        );
        this.filteredSales = this.filteredSales.filter(sale => 
          !selectedSaleIds.includes(sale.ID)
        );
        
        this.saveSalesToLocalStorage();
        
        // Delete from DB
        for (const saleId of selectedSaleIds) {
			console.log("Deleting sale ID:", saleId);
          await client.mutations.deleteSale({ ID: saleId });
        }
        
        return { 
          success: true, 
          message: `${selectedSaleIds.length}件の売上データを削除しました` 
        };
      } catch (error) {
        console.error("Delete sales error:", error);
        return { success: false, message: "削除中にエラーが発生しました" };
      }
    },

    // // Update sale
    // async updateSale(saleId: string, saleData: Partial<Sale>): Promise<{ success: boolean; message: string }> {
    //   if (!saleId) {
    //     return { success: false, message: "無効な売上IDです" };
    //   }
      
    //   try {
    //     // Update local data
    //     const index = this.allSales.findIndex(s => s.ID === saleId);
    //     if (index !== -1) {
    //       const updatedSale = { ...this.allSales[index], ...saleData, updated_at: new Date().toISOString() };
    //       this.allSales[index] = updatedSale;
    //       this.filteredSales = [...this.allSales];
    //       this.saveSalesToLocalStorage();
          
    //       // Update DB
    //       const result = await client.mutations.updateSale(updatedSale);
    //       if (result.data) {
    //         return { success: true, message: "売上データが更新されました" };
    //       }
    //     }
        
    //     return { success: false, message: "売上データが見つかりません" };
    //   } catch (error) {
    //     console.error("Update sale error:", error);
    //     return { success: false, message: "更新中にエラーが発生しました" };
    //   }
    // },
  }
});