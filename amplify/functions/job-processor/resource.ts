import { defineFunction } from '@aws-amplify/backend';

export const jobProcessor = defineFunction({
  name: 'job-processor',
  entry: './handler.ts',
  timeoutSeconds: 300, // 5 minutes
  memoryMB: 512,
  resourceGroupName: 'data'
});