// composables/useToast.ts
import { ref } from "vue";
import { createSharedComposable } from "@vueuse/core";

export const useToast = createSharedComposable(() => {
  const toastRef = ref();

  function show(message, type = "info") {
    if (toastRef.value) {
      toastRef.value.innerText = message;
      toastRef.value.open = true;
    }
  }

  function success(message) {
    show(message, "Success");
  }

  function error(message) {
    show(message, "Error");
  }

  return {
    toastRef,
    show,
    success,
    error,
  };
});
