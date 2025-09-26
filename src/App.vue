<template>
  <loading :active="globalStore.isLoading" :is-full-page="false"></loading>
  <router-view />
</template>

<script setup>
import Loading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/css/index.css';
import { useGlobalStore } from "./stores/global-store";
const globalStore = useGlobalStore();

</script>