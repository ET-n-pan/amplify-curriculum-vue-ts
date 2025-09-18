<template>
  <div class="mt-20 mx-5">
    <ui5-title level="H2" size="H2">AgGridTable</ui5-title>
    <ag-grid-vue
      :columnDefs="columnDefs"
      :headerHeight="30"
      :rowHeight="35"
      :rowData="formStore.allOrders"
      :defaultColDef="defaultColDef"
      :theme="theme"
      style="height: 66vh"
    ></ag-grid-vue>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { AgGridVue } from "ag-grid-vue3";
import { themeAlpine, AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "@ui5/webcomponents/dist/Title.js";
import { useFormStore } from "@/stores/form-store";

onMounted(async () => {
  console.log("Initializing form store...");
  await formStore.initialize();
});

// コミュニティ版のモジュール登録
ModuleRegistry.registerModules([AllCommunityModule]);
const theme = ref(themeAlpine);

// フォームストアの使用
const formStore = useFormStore();

// Emits for parent component
const emit = defineEmits(['selection-changed']);

// デフォルトのカラム定義
const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  editable: true
};

// 通貨文字列を数値に変換する関数
const parseCurrency = (val: any) => {
  if (typeof val === "string") {
    return parseFloat(val.replace(/[¥,]/g, "")) || 0;
  }
  return val || 0;
};

// 数値を通貨形式の文字列に変換する関数
const formatCurrency = (val: any) => {
  const num = parseFloat(val);
  if (isNaN(num)) return "";
  return `¥${num.toLocaleString()}`;
};

const recalculateEstimateCost = (params: any) => {
  const data = params.data;
  const quantity = parseCurrency(data.quantity);
  const unitPrice = parseCurrency(data.unit_price);
  data.estimated_cost = quantity * unitPrice;
  // テーブルとストアの両方を更新
  params.api.applyTransaction({ update: [data] });
  formStore.updateOrder(data.ID, data);
};

const columnDefs = ref([
  {
    headerName: "注文ID",
    field: "ID",
    flex: 1,
    minWidth: 120
  },
  {
    headerName: "顧客コード",
    field: "customer_code",
    flex: 1,
  },
  {
    headerName: "商品コード",
    field: "product_code",
    flex: 1,
  },
  {
    headerName: "数量",
    field: "quantity",
    flex: 1,
    editable: true,
    type: 'numericColumn',
    onCellValueChanged: recalculateEstimateCost,
  },
  {
    headerName: "単価",
    field: "unit_price",
    flex: 1,
    editable:true,
    type: 'numericColumn',
    valueFormatter: (params: any) => formatCurrency(params.value),
    valueParser: (params: any) => parseCurrency(params.newValue),
    onCellValueChanged: recalculateEstimateCost,
  },
  {
    headerName: "見積り",
    field: "estimated_cost",
    flex: 1,
    type: 'numericColumn',
    valueFormatter: (params: any) => formatCurrency(params.value),
    valueParser: (params: any) => parseCurrency(params.newValue),
    onCellValueChanged: recalculateEstimateCost,
  },
  {
    headerName: "納期",
    field: "delivery_date",
    flex: 1,
  },
  {
    headerName: "作成日時",
    field: "created_at",
    flex: 1,
  }
]);

</script>
