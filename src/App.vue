<template>
  <loading :active="globalStore.isLoading" :is-full-page="true"></loading>
  <router-view />
</template>

<script setup>
import { useGlobalStore } from "./stores/global-store";
const globalStore = useGlobalStore();

</script>