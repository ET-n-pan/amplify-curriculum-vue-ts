import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { csvReader } from './functions/csv-reader/resource';
import { jobProcessor } from './functions/job-processor/resource';
import { Stack, Duration } from 'aws-cdk-lib';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

const backend = defineBackend({
  auth,
  data,
  storage,
  csvReader,
  jobProcessor
});

// Your existing OData setup
const odataDataSource = backend.data.addHttpDataSource(
  "OdataDataSource",
  "https://8q5zg2p8tj.us-east-1.awsapprunner.com"
);

// Get the storage stack (where functions are now located)
const storageStack = Stack.of(backend.storage.resources.bucket);

// Use the storage bucket
const csvBucket = backend.storage.resources.bucket;

// Create SQS queue in the storage stack
const processingQueue = new Queue(storageStack, 'ProcessingQueue', {
  visibilityTimeout: Duration.seconds(300),
  receiveMessageWaitTime: Duration.seconds(20)
});

// Configure S3 trigger for CSV reader
csvBucket.addEventNotification(
  EventType.OBJECT_CREATED,
  new LambdaDestination(backend.csvReader.resources.lambda),
  { prefix: 'public/csv-uploads/', suffix: '.csv' }
);

// Configure SQS trigger for job processor
backend.jobProcessor.resources.lambda.addEventSource(
  new SqsEventSource(processingQueue, {
    batchSize: 10,
    maxBatchingWindow: Duration.seconds(5)
  })
);

// Grant permissions
csvBucket.grantRead(backend.csvReader.resources.lambda);
processingQueue.grantSendMessages(backend.csvReader.resources.lambda);
processingQueue.grantConsumeMessages(backend.jobProcessor.resources.lambda);

// Environment variables
backend.csvReader.addEnvironment('QUEUE_URL', processingQueue.queueUrl);
backend.csvReader.addEnvironment('BUCKET_NAME', csvBucket.bucketName);
backend.csvReader.addEnvironment('SQL_ENDPOINT', 'https://8q5zg2p8tj.us-east-1.awsapprunner.com/odata/v4/order');

backend.jobProcessor.addEnvironment('SQL_ENDPOINT', 'https://8q5zg2p8tj.us-east-1.awsapprunner.com/odata/v4/order');

backend.addOutput({
  custom: {
    bucketName: csvBucket.bucketName,
    queueUrl: processingQueue.queueUrl,
    queueArn: processingQueue.queueArn
  }
});