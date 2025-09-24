<template>
  <div class="mx-5 my-5">
    
    <!-- 売上入力フォーム -->
    <div id="container" style="max-width: 1500px; margin-bottom: 10px">
      <ui5-panel header-text="売上入力">
        <ui5-form>
          <ui5-form-item>
            <ui5-label slot="labelContent" required>年:</ui5-label>
            <ui5-input v-model="salesStore.sales_year" type="Number"></ui5-input>
          </ui5-form-item>

          <ui5-form-item>
            <ui5-label slot="labelContent" required>月:</ui5-label>
            <ui5-select v-model="salesStore.sales_month">
              <ui5-option v-for="month in 12" :key="month" :value="month.toString()">
                {{ month }}月
              </ui5-option>
            </ui5-select>
          </ui5-form-item>


          <ui5-form-item>
            <ui5-label slot="labelContent" required>顧客コード:</ui5-label>
            <ui5-input v-model="salesStore.customer_code"></ui5-input>
          </ui5-form-item>

          <ui5-form-item>
            <ui5-label slot="labelContent" required>商品:</ui5-label>
            <ui5-select v-model="salesStore.product_code">
              <ui5-option value="">選択してください</ui5-option>
              <ui5-option value="PROD001">ノートパソコン</ui5-option>
              <ui5-option value="PROD002">マウス</ui5-option>
              <ui5-option value="PROD003">キーボード</ui5-option>
            </ui5-select>
          </ui5-form-item>

          <ui5-form-item>
            <ui5-label slot="labelContent" required>数量:</ui5-label>
            <ui5-input v-model="salesStore.quantity" type="Number"></ui5-input>
          </ui5-form-item>

		<ui5-form-item>
            <ui5-label slot="labelContent">単価:</ui5-label>
            <ui5-input v-model="salesStore.unit_price" type="Number"></ui5-input>
          </ui5-form-item>
		  
          <ui5-form-item>
            <ui5-label slot="labelContent" required>注文状況:</ui5-label>
            <ui5-select v-model="salesStore.order_status">
              <ui5-option value="pending">保留中</ui5-option>
              <ui5-option value="confirmed">確定</ui5-option>
              <ui5-option value="shipped">出荷済</ui5-option>
              <ui5-option value="delivered">配達済</ui5-option>
            </ui5-select>
          </ui5-form-item>

          <ui5-form-item>
            <ui5-label slot="labelContent" required>支払状況:</ui5-label>
            <ui5-select v-model="salesStore.payment_status">
              <ui5-option value="unpaid">未払い</ui5-option>
              <ui5-option value="paid">支払済</ui5-option>
              <ui5-option value="refunded">返金済</ui5-option>
            </ui5-select>
          </ui5-form-item>
        </ui5-form>
        
        <!-- アクションボタン -->
        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
          <ui5-button design="Emphasized" @click="addSale()" style="min-width: 70px;">追加</ui5-button>
          <ui5-button @click="salesStore.reset()" style="min-width: 70px;">クリア</ui5-button>
          <ui5-button @click="deleteSale()" style="min-width: 70px;">削除</ui5-button>
        </div>
      </ui5-panel>
    </div>

    <ui5-panel header-text="チャート分析" style="max-width: 1500px; margin-bottom: 10px;">
      <SalesChart 
        :data="salesStore.filteredSales"
        :height="400"
        chartId="mainSalesChart"
      />
    </ui5-panel>

    <!-- フィルタリングパネル -->
    <ui5-panel header-text="フィルタ・ソート" style="max-width: 1500px; margin-bottom: 10px;">
      <ui5-form>
        <ui5-form-item>
          <ui5-label slot="labelContent">年:</ui5-label>
          <ui5-input v-model="filters.year" @input="applyFilters" type="Number" placeholder="2025"></ui5-input>
        </ui5-form-item>

        <ui5-form-item>
          <ui5-label slot="labelContent">月:</ui5-label>
          <ui5-select v-model="filters.month" @change="applyFilters">
            <ui5-option value="">すべて</ui5-option>
            <ui5-option v-for="month in 12" :key="month" :value="month.toString()">
              {{ month }}月
            </ui5-option>
          </ui5-select>
        </ui5-form-item>
        
        <ui5-form-item>
          <ui5-label slot="labelContent">顧客コード:</ui5-label>
          <ui5-input v-model="filters.customer_code" @input="applyFilters" placeholder="フィルタ..."></ui5-input>
        </ui5-form-item>
        
        <ui5-form-item>
          <ui5-label slot="labelContent">商品:</ui5-label>
          <ui5-select v-model="filters.product_code" @change="applyFilters">
            <ui5-option value="">すべて</ui5-option>
            <ui5-option value="PROD001">ノートパソコン</ui5-option>
            <ui5-option value="PROD002">マウス</ui5-option>
            <ui5-option value="PROD003">キーボード</ui5-option>
          </ui5-select>
        </ui5-form-item>

        <ui5-form-item>
          <ui5-label slot="labelContent">注文状況:</ui5-label>
          <ui5-select v-model="filters.order_status" @change="applyFilters">
            <ui5-option value="">すべて</ui5-option>
            <ui5-option value="pending">保留中</ui5-option>
            <ui5-option value="confirmed">確定</ui5-option>
            <ui5-option value="shipped">出荷済</ui5-option>
            <ui5-option value="delivered">配達済</ui5-option>
          </ui5-select>
        </ui5-form-item>
        
        <ui5-form-item>
          <ui5-label slot="labelContent">ソート:</ui5-label>
          <ui5-select v-model="sortConfig.field" @change="applyFilters">
            <ui5-option value="">なし</ui5-option>
            <ui5-option value="id">ID</ui5-option>
            <ui5-option value="sales_year">年</ui5-option>
            <ui5-option value="sales_month">月</ui5-option>
            <ui5-option value="total_amount">売上金額</ui5-option>
            <ui5-option value="created_at">作成日</ui5-option>
          </ui5-select>
        </ui5-form-item>
      </ui5-form>
      
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
        <ui5-button design="Emphasized" @click="refreshFromServer">更新</ui5-button>
        <ui5-button @click="clearFilters">クリア</ui5-button>
      </div>
      <div style="font-size: 0.875rem; color: #666; text-align: right;">
        表示: {{ salesStore.filteredSales.length }} / 全体: {{ salesStore.totalSalesCount }}
      </div>
    </ui5-panel>

    <!-- ページネーション -->
    <ui5-panel header-text="ページネーション" style="max-width: 1500px; margin-bottom: 10px;">
      <div class="pagination-container">
        <div class="page-size-section">
          <ui5-label>表示件数:</ui5-label>
          <ui5-select :model-value="salesStore.rowsPerPage.toString()" @change="changeRowsPerPage">
            <ui5-option value="10">10件</ui5-option>
            <ui5-option value="20">20件</ui5-option>
            <ui5-option value="50">50件</ui5-option>
          </ui5-select>
        </div>

        <div class="pagination-info">
          <span v-if="salesStore.filteredSales.length > 0">
            {{ salesStore.paginationInfo.startItem }} - {{ salesStore.paginationInfo.endItem }} 
            / {{ salesStore.paginationInfo.totalItems }}件
          </span>
        </div>

        <div class="pagination-controls" v-if="salesStore.totalPages > 1">
          <ui5-button @click="salesStore.goToFirstPage()" :disabled="salesStore.page === 1">≪</ui5-button>
          <ui5-button @click="salesStore.goToPreviousPage()" :disabled="salesStore.page === 1">‹</ui5-button>
          <ui5-button @click="salesStore.goToNextPage()" :disabled="salesStore.page === salesStore.totalPages">›</ui5-button>
          <ui5-button @click="salesStore.goToLastPage()" :disabled="salesStore.page === salesStore.totalPages">≫</ui5-button>
        </div>
      </div>
    </ui5-panel>

    <!-- エラーメッセージ表示用トースト -->
    <ui5-toast id="message" ref="messageRef"></ui5-toast>

    <!-- 売上一覧テーブル -->
    <ui5-table accessible-name-ref="title" style="max-width: 1500px;">
      <ui5-table-selection slot="features" ref="selectionRef"></ui5-table-selection>
      <ui5-table-header-row slot="headerRow" sticky>
        <ui5-table-header-cell>ID</ui5-table-header-cell>
        <ui5-table-header-cell>年月</ui5-table-header-cell>
        <ui5-table-header-cell>顧客</ui5-table-header-cell>
        <ui5-table-header-cell>商品</ui5-table-header-cell>
        <ui5-table-header-cell>数量</ui5-table-header-cell>
        <ui5-table-header-cell>単価</ui5-table-header-cell>
        <ui5-table-header-cell>合計</ui5-table-header-cell>
        <ui5-table-header-cell>注文状況</ui5-table-header-cell>
        <ui5-table-header-cell>支払状況</ui5-table-header-cell>
      </ui5-table-header-row>

      <ui5-table-row v-for="sale in salesStore.paginatedSales" :row-key="sale.ID" :key="sale.ID">
        <ui5-table-cell>{{ sale.ID }}</ui5-table-cell>
        <ui5-table-cell>{{ sale.sales_year }}/{{ sale.sales_month }}</ui5-table-cell>
        <ui5-table-cell>{{ sale.customer_code }}</ui5-table-cell>
        <ui5-table-cell>{{ sale.product_name }}</ui5-table-cell>
        <ui5-table-cell>{{ sale.quantity }}</ui5-table-cell>
        <ui5-table-cell>¥{{ sale.unit_price }}</ui5-table-cell>
        <ui5-table-cell>¥{{ sale.quantity * sale.unit_price }}</ui5-table-cell>
        <ui5-table-cell>{{ getStatusLabel(sale.order_status) }}</ui5-table-cell>
        <ui5-table-cell>{{ getPaymentLabel(sale.payment_status) }}</ui5-table-cell>
      </ui5-table-row>
    </ui5-table>
    
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, nextTick, watch } from "vue";
import { useSalesStore } from "@/stores/sales-store";
import Chart from 'chart.js/auto';
import SalesChart from "@/components/base/SalesChart.vue";
// Store and refs
const salesStore = useSalesStore();
const messageRef = ref<any>(null);
const selectionRef = ref<any>(null);

// Chart instance
let chartInstance: Chart | null = null;

// Filter state
const filters = reactive({
  year: '',
  month: '',
  customer_code: '',
  product_code: '',
  order_status: ''
});

const sortConfig = reactive({
  field: '',
  direction: 'asc' as 'asc' | 'desc'
});

// Chart configuration
const chartConfig = reactive({
  type: 'bar',
  dataAxis: 'monthly',
  aggregation: 'sum'
});

// Status labels
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '保留中',
    confirmed: '確定',
    shipped: '出荷済',
    delivered: '配達済'
  };
  return labels[status] || status;
};

const getPaymentLabel = (status: string) => {
  const labels: Record<string, string> = {
    unpaid: '未払い',
    paid: '支払済',
    refunded: '返金済'
  };
  return labels[status] || status;
};

// Initialize
onMounted(async () => {
  await salesStore.initialize();
  initChart();
  updateChart();
});

// Watch for data changes
watch(() => salesStore.filteredSales, () => {
  updateChart();
}, { deep: true });

// Chart functions
const initChart = () => {
  const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
  if (ctx) {
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: '売上分析' }
        }
      }
    });
  }
};

const updateChart = () => {
  if (!chartInstance) return;

  const data = prepareChartData();
  chartInstance.data = data;
  chartInstance.config.type = chartConfig.type as any;
  
  // Special handling for pie/doughnut charts
  if (chartConfig.type === 'pie' || chartConfig.type === 'doughnut') {
    chartInstance.options!.scales = {};
  } else {
    chartInstance.options!.scales = {
      y: { beginAtZero: true }
    };
  }
  
  chartInstance.update();
};

const prepareChartData = () => {
  const salesData = salesStore.filteredSales;
  
  switch (chartConfig.dataAxis) {
    case 'monthly':
      return prepareMonthlyData(salesData);
    case 'product':
      return prepareProductData(salesData);
    case 'customer':
      return prepareCustomerData(salesData);
    case 'status':
      return prepareStatusData(salesData);
    default:
      return { labels: [], datasets: [] };
  }
};

const prepareMonthlyData = (sales: any[]) => {
  const monthlyData: Record<string, number> = {};
  
  sales.forEach(sale => {
    const key = `${sale.sales_year}/${sale.sales_month}`;
    if (!monthlyData[key]) monthlyData[key] = 0;
    
    if (chartConfig.aggregation === 'sum') {
      monthlyData[key] += sale.total_amount;
    } else if (chartConfig.aggregation === 'count') {
      monthlyData[key] += 1;
    }
  });

  return {
    labels: Object.keys(monthlyData),
    datasets: [{
      label: chartConfig.aggregation === 'sum' ? '売上金額' : '件数',
      data: Object.values(monthlyData),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };
};

const prepareProductData = (sales: any[]) => {
  const productData: Record<string, number> = {};
  
  sales.forEach(sale => {
    const key = sale.product_name || sale.product_code;
    if (!productData[key]) productData[key] = 0;
    
    if (chartConfig.aggregation === 'sum') {
      productData[key] += sale.total_amount;
    } else if (chartConfig.aggregation === 'count') {
      productData[key] += 1;
    }
  });

  return {
    labels: Object.keys(productData),
    datasets: [{
      label: chartConfig.aggregation === 'sum' ? '売上金額' : '件数',
      data: Object.values(productData),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1
    }]
  };
};

const prepareCustomerData = (sales: any[]) => {
  const customerData: Record<string, number> = {};
  
  sales.forEach(sale => {
    if (!customerData[sale.customer_code]) customerData[sale.customer_code] = 0;
    
    if (chartConfig.aggregation === 'sum') {
      customerData[sale.customer_code] += sale.total_amount;
    } else if (chartConfig.aggregation === 'count') {
      customerData[sale.customer_code] += 1;
    }
  });

  return {
    labels: Object.keys(customerData),
    datasets: [{
      label: chartConfig.aggregation === 'sum' ? '売上金額' : '件数',
      data: Object.values(customerData),
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };
};

const prepareStatusData = (sales: any[]) => {
  const statusData: Record<string, number> = {};
  
  sales.forEach(sale => {
    const key = getStatusLabel(sale.order_status);
    if (!statusData[key]) statusData[key] = 0;
    
    if (chartConfig.aggregation === 'sum') {
      statusData[key] += sale.total_amount;
    } else if (chartConfig.aggregation === 'count') {
      statusData[key] += 1;
    }
  });

  return {
    labels: Object.keys(statusData),
    datasets: [{
      label: chartConfig.aggregation === 'sum' ? '売上金額' : '件数',
      data: Object.values(statusData),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)'
      ]
    }]
  };
};

// Toast function
const showToast = (msg: string) => {
  if (messageRef.value) {
    messageRef.value.innerText = msg;
    messageRef.value.open = true;
  }
};

// CRUD operations
const addSale = async () => {
  const result = await salesStore.addSale();
  showToast(result.message);
  if (result.success) {
    updateChart();
  }
};

const deleteSale = async () => {
	console.log("selectionRef:", selectionRef.value.selected);
  const selectedRows = selectionRef.value?.selected.split(" ") || [];
  console.log("Selected Rows for Deletion:", selectedRows);
  const result = await salesStore.deleteSelectedSales(selectedRows);
  showToast(result.message);
  if (result.success) {
    updateChart();
  }
};

const refreshFromServer = async () => {
  const result = await salesStore.syncWithServer();
  showToast(result.message);
  if (result.success) {
    applyFilters();
    updateChart();
  }
};

// Filter functions
const applyFilters = async () => {
  await nextTick();
  salesStore.applyFiltersAndSort(filters, sortConfig);
  updateChart();
};

const clearFilters = () => {
  filters.year = '';
  filters.month = '';
  filters.customer_code = '';
  filters.product_code = '';
  filters.order_status = '';
  sortConfig.field = '';
  sortConfig.direction = 'asc';
  applyFilters();
};

// Pagination
const changeRowsPerPage = (event: any) => {
  const newSize = parseInt(event.target.value);
  salesStore.setRowsPerPage(newSize);
};
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
</style>