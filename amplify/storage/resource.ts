import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'csvProcessingStorage',
  access: (allow) => ({
    'public/csv-uploads/*': [
      allow.guest.to(['read', 'write', 'delete']),
      allow.authenticated.to(['read', 'write', 'delete'])
    ]
  })
});