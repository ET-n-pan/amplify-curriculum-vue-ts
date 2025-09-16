import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';


const backend = defineBackend({
  auth,
  data,
});

const odataDataSource = backend.data.addHttpDataSource(
  "OdataDataSource",
  "https://8q5zg2p8tj.us-east-1.awsapprunner.com"
);