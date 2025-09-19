import { defineFunction } from '@aws-amplify/backend';

export const csvReader = defineFunction({
  name: 'csv-reader',
  entry: './handler.ts',
  timeoutSeconds: 900,
  memoryMB: 512,
  resourceGroupName: 'storage'
});