<template>
  	<div class="mx-5 my-5">
    
    <!-- 注文入力フォーム -->
    <div id="container" style="max-width: 1500px; margin-bottom: 10px">
		<ui5-panel header-text="注文入力">
		<ui5-form>
			<ui5-form-item>
				<ui5-label slot="labelContent" required>顧客コード:</ui5-label>
				<ui5-input v-model="formStore.customerCode"></ui5-input>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>商品:</ui5-label>
				<ui5-select v-model="formStore.productCode">
					<ui5-option value="">選択してください</ui5-option>
					<ui5-option value="PROD001">商品A</ui5-option>
					<ui5-option value="PROD002">商品B</ui5-option>
					<ui5-option value="PROD003">商品C</ui5-option>
				</ui5-select>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>数量:</ui5-label>
				<ui5-input v-model="formStore.quantity" type="Number"></ui5-input>
			</ui5-form-item>

			<ui5-form-item>
				<ui5-label slot="labelContent" required>納期:</ui5-label>
				<ui5-date-picker v-model="formStore.deliveryDate"></ui5-date-picker>
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
    <!-- エラーメッセージ表示用トースト -->
    <ui5-toast id="message" ref="messageRef"></ui5-toast>
	<!-- オーダー一覧テーブル -->
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
		<ui5-table-row v-for="order in formStore.orders" :row-key="order.id" :key="order.id">
			<ui5-table-cell><ui5-label>{{ order.id }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ order.customerCode }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ order.productCode }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-input :value="order.quantity" @input="formStore.updateOrderQuantity(order.id, $event.target.value)"></ui5-input></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ order.deliveryDate }}</ui5-label></ui5-table-cell>
			<ui5-table-cell><ui5-label>{{ order.createdAt }}</ui5-label></ui5-table-cell>
		</ui5-table-row>

    </ui5-table>
  	</div>
</template>

<script setup>
import { useFormStore } from "../stores/form-store";
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
import { ref } from "vue";

const messageRef = ref(null);
const selectionRef = ref(null);
const formStore = useFormStore();

// トースト表示関数
const showToast = (msg) => {
	if (messageRef.value) {
		messageRef.value.innerText = msg;
		messageRef.value.open = true;
	}
}

// 注文追加関数
const addOrder = () => {
	const {success, errorMessage} = formStore.addOrder();
	if (!success){
		showToast(errorMessage);
	}else{
		showToast("注文が追加されました。");
	}
}

// 注文削除関数
const deleteOrder = () => {
	formStore.deleteOrder(selectionRef.value, messageRef.value);
}

</script>