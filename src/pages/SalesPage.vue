<template>
  	<div class="mx-5 my-5">
    
    <!-- 売上入力フォーム -->
    <div id="container" style="max-width: 1500px; margin-bottom: 10px">
		<ui5-panel header-text="売上入力">
			<ui5-form>
				<ui5-form-item>
					<ui5-label slot="labelContent" required>顧客コード:</ui5-label>
					<ui5-input v-model="salesFormStore.customerCode"></ui5-input>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required>商品:</ui5-label>
					<ui5-select v-model="salesFormStore.productCode">
						<ui5-option value="">選択してください</ui5-option>
						<ui5-option value="PROD001">{{productNames["PROD001"]}}</ui5-option>
						<ui5-option value="PROD002">{{productNames["PROD002"]}}</ui5-option>
						<ui5-option value="PROD003">{{productNames["PROD003"]}}</ui5-option>
					</ui5-select>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required>数量:</ui5-label>
					<ui5-input v-model="salesFormStore.quantity" type="Number"></ui5-input>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required>単価:</ui5-label>
					<ui5-input v-model="salesFormStore.unitPrice" type="Number"></ui5-input>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required>売上日:</ui5-label>
					<ui5-date-picker
						placeholder="yyyy-MM-dd"
						v-model="salesFormStore.salesDate"
						@input="salesFormStore.salesDate = $event.target.value"
						@close="salesFormStore.salesDate = $event.target.value"
						formatPattern="yyyy-MM-dd"
					></ui5-date-picker>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required style="padding-bottom: 13px;">注文状況:</ui5-label>
					<ui5-radio-button checked name="orderGroup" :text="orderStatusNames['pending']" value="pending" @change="salesFormStore.orderStatus = $event.target.value"></ui5-radio-button>
					<ui5-radio-button name="orderGroup" :text="orderStatusNames['confirmed']" value="confirmed" @change="salesFormStore.orderStatus = $event.target.value"></ui5-radio-button>
					<ui5-radio-button name="orderGroup" :text="orderStatusNames['shipped']" value="shipped" @change="salesFormStore.orderStatus = $event.target.value"></ui5-radio-button>
					<ui5-radio-button name="orderGroup" :text="orderStatusNames['delivered']" value="delivered" @change="salesFormStore.orderStatus = $event.target.value"></ui5-radio-button>
				</ui5-form-item>

				<ui5-form-item>
					<ui5-label slot="labelContent" required style="padding-bottom: 13px;">支払状況:</ui5-label>
					<ui5-radio-button checked name="paymentGroup" :text="paymentStatusNames['unpaid']" value="unpaid" @change="salesFormStore.paymentStatus = $event.target.value"></ui5-radio-button>
					<ui5-radio-button name="paymentGroup" :text="paymentStatusNames['paid']" value="paid" @change="salesFormStore.paymentStatus = $event.target.value"></ui5-radio-button>
					<ui5-radio-button name="paymentGroup" :text="paymentStatusNames['refunded']" value="refunded" @change="salesFormStore.paymentStatus = $event.target.value"></ui5-radio-button>
				</ui5-form-item>
			</ui5-form>
			
			<!-- アクションボタン -->
			<div style="display: flex; gap: 10px; justify-content: flex-end;">
				<ui5-button design="Emphasized" @click="addSales()" style="min-width: 70px;">追加</ui5-button>
				<ui5-button @click="deleteSales()" style="min-width: 70px;">削除</ui5-button>
			</div>
		</ui5-panel>
    </div>
	<!-- 売上テーブルフォーム -->
    <div id="container" style="max-width: 1500px; margin-bottom: 10px">
		<ui5-panel header-text="売上テーブル">
			<canvas id="myChart"></canvas>
		</ui5-panel>
    </div>
    <!-- エラーメッセージ表示用トースト -->
    <ui5-toast id="message" ref="messageRef"></ui5-toast>
	<!-- オーダー一覧テーブル -->
    <ui5-table accessible-name-ref="title" id="table" style="max-width: 1500px;">
		<!-- 選択機能の追加 -->
      	<ui5-table-selection id="selection" slot="features" ref="selectionRef"></ui5-table-selection>
        <ui5-table-header-row slot="headerRow" sticky>
          	<ui5-table-header-cell>顧客コード</ui5-table-header-cell>
          	<ui5-table-header-cell>商品コード</ui5-table-header-cell>
          	<ui5-table-header-cell>数量</ui5-table-header-cell>
			<ui5-table-header-cell>単価</ui5-table-header-cell>
			<ui5-table-header-cell>合計金額</ui5-table-header-cell>
          	<ui5-table-header-cell>売上年</ui5-table-header-cell>
			<ui5-table-header-cell>売上月</ui5-table-header-cell>
			<ui5-table-header-cell>売上周</ui5-table-header-cell>
          	<ui5-table-header-cell>注文状況</ui5-table-header-cell>
			<ui5-table-header-cell>支払状況</ui5-table-header-cell>
        </ui5-table-header-row>
        <ui5-illustrated-message slot="noData" name="NoData"></ui5-illustrated-message>

		<!-- オーダー一覧 -->
		<ui5-table-row v-for="sales in salesList" :row-key="sales.ID" :key="sales.ID">
			<ui5-table-cell><ui5-label>{{ sales.customer_code }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.product_code }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.quantity }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.unit_price }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.total_amount }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.sales_year }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.sales_month }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ sales.sales_week }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ orderStatusNames[sales.order_status] }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ paymentStatusNames[sales.payment_status] }}</ui5-label></ui5-table-cell>
		</ui5-table-row>

    </ui5-table>

  	</div>
</template>

<script setup lang="ts">
import "@ui5/webcomponents/dist/Panel.js";
import "@ui5/webcomponents/dist/Form.js";
import "@ui5/webcomponents/dist/FormGroup.js";
import "@ui5/webcomponents/dist/FormItem.js";
import "@ui5/webcomponents/dist/Bar.js";
import "@ui5/webcomponents/dist/Table.js";
import "@ui5/webcomponents/dist/TableRow.js";
import "@ui5/webcomponents/dist/TableCell.js";
import "@ui5/webcomponents/dist/Label.js";
import "@ui5/webcomponents/dist/Toast.js";
import "@ui5/webcomponents/dist/TableHeaderRow.js";
import "@ui5/webcomponents/dist/TableHeaderCell.js";
import "@ui5/webcomponents/dist/TableSelection.js";
import "@ui5/webcomponents-fiori/dist/IllustratedMessage.js";
import "@ui5/webcomponents-fiori/dist/illustrations/NoData.js";
import "@ui5/webcomponents/dist/Input.js";
import "@ui5/webcomponents/dist/ComboBox.js";
import "@ui5/webcomponents/dist/ComboBoxItem.js";
import "@ui5/webcomponents/dist/DatePicker.js";
import "@ui5/webcomponents/dist/TextArea.js";
import "@ui5/webcomponents/dist/RadioButton.js";
import { Chart } from 'chart.js/auto';
import { onMounted, ref } from 'vue';
import type { Schema } from '../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { useGlobalStore } from "@/stores/global-store";
import { useSalesFormStore } from "@/stores/sales-form-store";

const globalStore = useGlobalStore();
const salesFormStore = useSalesFormStore();
const selectionRef = ref(null);
const messageRef = ref(null);
const client = generateClient<Schema>();
const salesList = ref<Array<Schema['Sales']["type"]>>([]);
let maxId = 0;
let myChart;

// 商品ごとの名称を定義
const productNames = {
	PROD001: "商品A",
	PROD002: "商品B",
	PROD003: "商品C",
};

// 注文状況ごとの名称を定義
const orderStatusNames = {
	pending: "保留中",
	confirmed: "確認済",
	shipped: "発送済",
	delivered: "配達済",
};

// 支払状況ごとの名称を定義
const paymentStatusNames = {
	unpaid: "未払い",
	paid: "支払済",
	refunded: "返金済",
};

onMounted(() => {
  	fetchSales();
});

async function fetchSales() {
	globalStore.showLoading();
	const result = await client.queries.getSales();
	salesList.value = result.data;

	let chartLabels = [];
	let chartData = [];
	if (result.data?.length > 0) {
		for (let sale of result.data) {
			let intId = parseInt(sale.ID)
			if (intId > maxId) {
				maxId = intId;
			}
		}

		const totalSales = result.data.reduce((total, sale) => {
			if (total[sale?.customer_code]) {
				total[sale?.customer_code] = total[sale?.customer_code] + sale?.total_amount;
			} else {
				total[sale?.customer_code] = sale?.total_amount;
			}
			return total;
		}, {});

		chartLabels = Object.keys(totalSales);
		chartData = Object.values(totalSales);

		const ctx = document.getElementById('myChart');
		if (myChart) {
			myChart.destroy();
		}
		myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: chartLabels,
				datasets: [{
					label: '顧客の合計売上金額',
					data: chartData,
					borderWidth: 1
				}]
			},
			options: {
				scales: {
					y: {
						beginAtZero: true
					}
				}
			}
		});
	}

	globalStore.hideLoading();
}

// トースト表示関数
const showToast = (msg) => {
	if (messageRef.value) {
		messageRef.value.innerText = msg;
		messageRef.value.open = true;
	}
}

// 売上追加関数
async function addSales() {
	const validationErrors = salesFormStore.validateForm();
	
	if (validationErrors.length > 0) {
		// エラーメッセージ表示
		const errorMessage = validationErrors.join('\n');
		showToast(errorMessage);
		return;
	}
  	const salesDateSplit = salesFormStore.salesDate.split('-');
	let newSales = {
		ID: (maxId+1).toString(),
		customer_code: salesFormStore.customerCode,
		product_code: salesFormStore.productCode,
		product_name: productNames[salesFormStore.productCode],
		quantity: salesFormStore.quantity,
		unit_price: salesFormStore.unitPrice,
		total_amount: parseInt(salesFormStore.quantity) * parseInt(salesFormStore.unitPrice),
		order_status: salesFormStore.orderStatus,
		payment_status: salesFormStore.paymentStatus,
		sales_year: parseInt(salesDateSplit[0]),
		sales_month: parseInt(salesDateSplit[1]),
		sales_week: Math.ceil((parseInt(salesDateSplit[2]) + 1) / 7),
		created_at: new Date(),
		updated_at: new Date(),
	}

	const result = await client.mutations.addSales(newSales);
	if (result.data) {
		showToast("売上が追加されました。");
	} else {
		showToast(result.errors[0].message)
	}

	fetchSales();
}

// 売上削除関数
async function deleteSales() {
	let selectionElement = selectionRef.value;
	let messageElement = messageRef.value;
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
			messageElement.innerText = "削除する売上を選択してください。";
		}
		return;
	}
	let deleteList = selectionRef.value.selected.split(' ');
	for (let delID of deleteList) {
		await client.mutations.deleteSales({
			ID: delID,
		});
	}
	selectionElement.selected = '';
	if (messageElement) {
		messageElement.open = true;
		messageElement.innerText = `${selectedRows.length}件の売上を削除しました。`;
	}

	fetchSales();
}

</script>

<style scoped>
#myChart {
  width: 100% !important;
  height: 600px !important;
}
</style>