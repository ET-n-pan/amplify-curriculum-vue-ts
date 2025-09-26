<template>
  	<div class="mx-5 my-5">
    
    <!-- 注文入力フォーム -->
    <div id="container" style="max-width: 1500px; margin-bottom: 10px">
		<ui5-panel header-text="注文入力">
		<ui5-form>
			<ui5-form-item>
				<ui5-label slot="labelContent" required>顧客コード:</ui5-label>
				<ui5-input v-model="formStore.customer_code"></ui5-input>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>商品:</ui5-label>
				<ui5-select v-model="formStore.product_code">
					<ui5-option value="">選択してください</ui5-option>
					<ui5-option value="PROD001">商品A</ui5-option>
					<ui5-option value="PROD002">商品B</ui5-option>
					<ui5-option value="PROD003">商品C</ui5-option>
				</ui5-select>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>数量:</ui5-label>
				<ui5-input v-model="formStore.quantity"></ui5-input>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>納期:</ui5-label>
				<ui5-date-picker v-model="formStore.delivery_date" value-format='yyyy-MM-dd' format-pattern="yyyy-MM-dd" ref="formStore.delivery_date"></ui5-date-picker>
			</ui5-form-item>

		</ui5-form>
		
		<!-- アクションボタン -->
		<div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
			<ui5-button design="Emphasized" @click="addOrder()" style="min-width: 70px;">追加</ui5-button>
			<ui5-button @click="formStore.reset()" style="min-width: 70px;">クリア</ui5-button>
			<ui5-button @click="deleteOrder()" style="min-width: 70px;">削除</ui5-button>
		</div>
		</ui5-panel>
    </div>

	<!-- フィルタリング・ソートパネル -->
    <ui5-panel header-text="フィルタ・ソート" style="max-width: 1500px; margin-bottom: 10px;">
        <ui5-form>
            <ui5-form-item>
                <ui5-label slot="labelContent">顧客コード:</ui5-label>
                <ui5-input v-model="filters.customer_code" @input="applyFilters" placeholder="フィルタ..."></ui5-input>
            </ui5-form-item>
            
            <ui5-form-item>
                <ui5-label slot="labelContent">商品:</ui5-label>
                <ui5-select v-model="filters.product_code" @change="applyFilters">
                    <ui5-option value="">すべて</ui5-option>
                    <ui5-option value="PROD001">商品A</ui5-option>
                    <ui5-option value="PROD002">商品B</ui5-option>
                    <ui5-option value="PROD003">商品C</ui5-option>
                </ui5-select>
            </ui5-form-item>
            
            <ui5-form-item>
                <ui5-label slot="labelContent">数量（以上）:</ui5-label>
                <ui5-input v-model="filters.min_quantity" @input="applyFilters" type="Number" placeholder="0"></ui5-input>
            </ui5-form-item>
            
            <ui5-form-item>
                <ui5-label slot="labelContent">ソート:</ui5-label>
                <ui5-select v-model="sortConfig.field" @change="applyFilters">
                    <ui5-option value="">なし</ui5-option>
                    <ui5-option value="ID">注文ID</ui5-option>
                    <ui5-option value="customer_code">顧客コード</ui5-option>
                    <ui5-option value="product_code">商品コード</ui5-option>
                    <ui5-option value="quantity">数量</ui5-option>
                    <ui5-option value="delivery_date">納期</ui5-option>
                    <ui5-option value="created_at">注文日</ui5-option>
                </ui5-select>
            </ui5-form-item>
            
            <ui5-form-item>
                <ui5-label slot="labelContent">順序:</ui5-label>
                <ui5-select v-model="sortConfig.direction" @change="applyFilters">
                    <ui5-option value="asc">昇順</ui5-option>
                    <ui5-option value="desc">降順</ui5-option>
                </ui5-select>
            </ui5-form-item>
        </ui5-form>
        
        <!-- アクションボタンと情報表示 -->
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; flex-direction: row; align-items: flex-end;">
            <ui5-button design="Emphasized" @click="refreshFromServer" style="min-width: 70px;">更新</ui5-button>
			<ui5-button @click="clearFilters" style="min-width: 70px;">クリア</ui5-button>
        </div>
		<div style="font-size: 0.875rem; color: #666; text-align: right;">
                表示: {{ formStore.filteredOrders.length }} / 全体: {{ formStore.ordersCount }}
                <br>
                最終同期: {{ formStore.lastSyncTimeString }}
		</div>
    </ui5-panel>
	<!-- ページネーション情報・コントロール -->
    <ui5-panel header-text="ページネーション" style="max-width: 1500px; margin-bottom: 10px;">
        <div class="pagination-container">
            <!-- ページサイズ選択 -->
            <div class="page-size-section">
                <ui5-label>表示件数:</ui5-label>
                <ui5-select :model-value="formStore.rowsPerPage.toString()" @change="changeRowsPerPage">
                    <ui5-option value="5">5件</ui5-option>
                    <ui5-option value="10" selected>10件</ui5-option>
                    <ui5-option value="20">20件</ui5-option>
                    <ui5-option value="50">50件</ui5-option>
                </ui5-select>
            </div>

            <!-- ページネーション情報 -->
            <div class="pagination-info">
                <span v-if="formStore.filteredOrdersCount > 0">
                    {{ formStore.paginationInfo.startItem }} - {{ formStore.paginationInfo.endItem }} 
                    / {{ formStore.paginationInfo.totalItems }}件
                </span>
                <span v-else>該当するデータがありません</span>
            </div>

            <!-- ページネーションコントロール -->
            <div class="pagination-controls" v-if="formStore.totalPages > 1">
                <!-- 最初のページ -->
                <ui5-button 
                    @click="formStore.goToFirstPage()" 
                    :disabled="formStore.page === 1"
                    design="Transparent">
                    ≪
                </ui5-button>
                
                <!-- 前のページ -->
                <ui5-button 
                    @click="formStore.goToPreviousPage()" 
                    :disabled="formStore.page === 1"
                    design="Transparent">
                    ‹
                </ui5-button>
                
                <!-- ページ番号 -->
                <div class="page-numbers">
                    <ui5-button 
                        v-for="pageNum in getVisiblePageNumbers()" 
                        :key="pageNum"
                        @click="formStore.setCurrentPage(pageNum)"
                        :design="pageNum === formStore.page ? 'Emphasized' : 'Transparent'"
                        class="page-number">
                        {{ pageNum }}
                    </ui5-button>
                </div>
                
                <!-- 次のページ -->
                <ui5-button 
                    @click="formStore.goToNextPage()" 
                    :disabled="formStore.page === formStore.totalPages"
                    design="Transparent">
                    ›
                </ui5-button>
                
                <!-- 最後のページ -->
                <ui5-button 
                    @click="formStore.goToLastPage()" 
                    :disabled="formStore.page === formStore.totalPages"
                    design="Transparent">
                    ≫
                </ui5-button>
            </div>
        </div>
    </ui5-panel>
    <!-- エラーメッセージ表示用トースト -->
    <ui5-toast id="message" ref="messageRef"></ui5-toast>
    
	<!-- オーダー一覧テーブル -->
    <div class="vl-parent" style="max-width: 1500px;">
        <loading :active="formStore.isLoading" :is-full-page="false"></loading>
    
        <ui5-table accessible-name-ref="title" id="table" style="max-width: 1500px;">
            
            <!-- 選択機能の追加 -->
            <ui5-table-selection id="selection" slot="features" ref="selectionRef"></ui5-table-selection>
            <ui5-table-header-row slot="headerRow" sticky>
                <ui5-table-header-cell>注文ID</ui5-table-header-cell>
                <ui5-table-header-cell>顧客コード</ui5-table-header-cell>
                <ui5-table-header-cell>商品コード</ui5-table-header-cell>
                <ui5-table-header-cell>数量</ui5-table-header-cell>
                <ui5-table-header-cell>納期</ui5-table-header-cell>
                <ui5-table-header-cell>注文日</ui5-table-header-cell>
            </ui5-table-header-row>
            <ui5-illustrated-message slot="noData" name="NoData"></ui5-illustrated-message>

            <!-- オーダー一覧 -->
            <ui5-table-row v-for="order in formStore.paginatedOrders" :row-key="order.ID" :key="order.ID">
                <ui5-table-cell><ui5-label>{{ order.ID }}</ui5-label></ui5-table-cell>
                <ui5-table-cell><ui5-label>{{ order.customer_code }}</ui5-label></ui5-table-cell>
                <ui5-table-cell><ui5-label>{{ order.product_code }}</ui5-label></ui5-table-cell>
                <ui5-table-cell><ui5-input  :value="String(order.quantity)" @input="updateOrder(order.ID, {...order, quantity: $event.target.value})"></ui5-input></ui5-table-cell>
                <ui5-table-cell><ui5-label>{{ order.delivery_date }}</ui5-label></ui5-table-cell>
                <ui5-table-cell><ui5-label>{{ order.created_at }}</ui5-label></ui5-table-cell>
            </ui5-table-row>

        </ui5-table>
	</div>
  	</div>
</template>

<script setup lang="ts">
import { useFormStore } from "@/stores/form-store";
import "@/lib/UI5FormComp";
import { useGlobalStore } from "@/stores/global-store";
import { ref, onMounted, reactive, nextTick } from "vue";
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';

// UIレファレンス
const messageRef = ref<any>(null);
const selectionRef = ref<any>(null);

// DataStoreクライアントの生成
const formStore = useFormStore();
const globalStore = useGlobalStore();

// フィルタリングとソートの状態管理
// reactiveを使用して、オブジェクト内容が変更されたときにリアクティブに反応するようにする
const filters = reactive({
    customer_code: '',
    product_code: '',
    min_quantity: ''
});
const sortConfig = reactive({
    field: '',
    direction: 'asc' as 'asc' | 'desc'
});


// 初期データ取得
onMounted(async () => {
	console.log("Initializing form store...");
	await formStore.initialize();
});

// ページネーション関連の関数
const changeRowsPerPage = (event: any) => {
    const newSize = parseInt(event.target.value);
    formStore.setRowsPerPage(newSize);
};

// 表示するページ番号を計算（最大5個まで表示）
const getVisiblePageNumbers = () => {
    const current = formStore.page;
    const total = formStore.totalPages;
    const visible = [];
    
    if (total <= 5) {
        // 総ページ数が5以下の場合は全て表示
        for (let i = 1; i <= total; i++) {
            visible.push(i);
        }
    } else {
        // 現在のページを中心に5個表示
        let start = Math.max(1, current - 2);
        let end = Math.min(total, start + 4);
        
        // 末尾に寄りすぎた場合の調整
        if (end - start < 4) {
            start = Math.max(1, end - 4);
        }
        
        for (let i = start; i <= end; i++) {
            visible.push(i);
        }
    }
    
    return visible;
};

// トースト表示関数
const showToast = (msg: string) => {
	if (messageRef.value) {
		messageRef.value.innerText = msg;
		messageRef.value.open = true;
	}
}

// 注文追加
const addOrder = async () =>{
    formStore.isLoading = true;
	const result = await formStore.addOrder();
    formStore.isLoading = false;
	showToast(result.message);
	if (result.success) {
		// 追加成功時はフォームクリアと選択解除
		formStore.reset();
	}
}

// 注文削除
const deleteOrder = async () => {
    const selectedRows = selectionRef.value?.selected.split(" ") || [];
	console.log("Selected rows for deletion:", selectedRows);
    formStore.isLoading = true;
    const result = await formStore.deleteSelectedOrders(selectedRows);
    formStore.isLoading = false;
    showToast(result.message);
    
    if (result.success) {
        // Clear selection
        selectionRef.value.selected = "";
		formStore.reset();
    }
};

// 注文更新
const updateOrder = async (orderId: string, updatedOrder: any) => {
    formStore.isLoading = true;
	const result = await formStore.updateOrder(orderId, updatedOrder);
	formStore.isLoading = false;
	showToast(result.message);
	return result.success;
};

// サーバーから最新データを取得
const refreshFromServer = async () => {
    const result = await formStore.syncWithServer();
    showToast(result.message);
    if (result.success) {
        applyFilters(); // Refresh filtered view
    }
};

// フィルタ適用
const applyFilters = async () => {
	await nextTick();
    formStore.applyFiltersAndSort(filters, sortConfig);
};

// フィルタクリア
const clearFilters = () => {
    filters.customer_code = '';
    filters.product_code = '';
    filters.min_quantity = '';
    sortConfig.field = '';
    sortConfig.direction = 'asc';
    applyFilters();
};


</script>

<style scoped>
.pagination-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    padding: 12px 0;
}

.page-size-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.pagination-info {
    font-size: 0.875rem;
    color: #666;
    font-weight: 500;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 4px;
}

.page-numbers {
    display: flex;
    gap: 2px;
    margin: 0 8px;
}

.page-number {
    min-width: 32px;
    height: 32px;
}

</style>