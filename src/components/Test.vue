<script setup lang="ts">
import { ref } from 'vue'

const test = ref('')
</script>

<template>
  <div class="flex flex-col gap-2">
    <textarea v-model="test" type="text" class="border-2 border-gray-300 rounded-md p-1 max-w-md" />

    <div v-if="test" class="text-sm text-gray-500 shadow-md p-2 rounded-md border border-gray-300">
      <pre>{{ test }}</pre>
    </div>
  </div>
</template>
