// amplify/backend.ts
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
  jobProcessor,
});

const odataDataSource = backend.data.addHttpDataSource(
  "OdataDataSource",
  "https://8q5zg2p8tj.us-east-1.awsapprunner.com"
);

// ProcessingJobテーブルを取得
const processingJobTable = backend.data.resources.tables['ProcessingJob'];

// Lambda関数にテーブルへの書き込み権限を付与
processingJobTable.grantWriteData(backend.csvReader.resources.lambda);
processingJobTable.grantWriteData(backend.jobProcessor.resources.lambda);

// Lambda関数にテーブルへの書き込み権限を付与
processingJobTable.grantWriteData(backend.csvReader.resources.lambda);
processingJobTable.grantWriteData(backend.jobProcessor.resources.lambda);

// Data stackを取得
const dataStack = Stack.of(backend.data.resources.graphqlApi); 

// S3バケットを取得
const csvBucket = backend.storage.resources.bucket;

// SQSキューを作成
const processingQueue = new Queue(dataStack, 'ProcessingQueue', { 
  visibilityTimeout: Duration.seconds(300),
  receiveMessageWaitTime: Duration.seconds(20)
});

// S3バケットの特定のプレフィックスにファイルがアップロードされたときにLambdaをトリガー
csvBucket.addEventNotification(
  EventType.OBJECT_CREATED,
  new LambdaDestination(backend.csvReader.resources.lambda),
  { prefix: 'public/csv-uploads/', suffix: '.csv' }
);

// Lambda関数にSQSイベントソースを追加
backend.jobProcessor.resources.lambda.addEventSource(
  new SqsEventSource(processingQueue, {
    batchSize: 10,
    maxBatchingWindow: Duration.seconds(5)
  })
);

// Lambda関数にS3バケットとSQSキューへのアクセス権限を付与
csvBucket.grantRead(backend.csvReader.resources.lambda);
processingQueue.grantSendMessages(backend.csvReader.resources.lambda);
processingQueue.grantConsumeMessages(backend.jobProcessor.resources.lambda);

// 環境変数
backend.csvReader.addEnvironment('QUEUE_URL', processingQueue.queueUrl);
backend.csvReader.addEnvironment('BUCKET_NAME', csvBucket.bucketName);
backend.csvReader.addEnvironment('SQL_ENDPOINT', 'https://8q5zg2p8tj.us-east-1.awsapprunner.com/odata/v4/order');
backend.csvReader.addEnvironment('PROCESSING_JOB_TABLE', processingJobTable.tableName);

backend.jobProcessor.addEnvironment('SQL_ENDPOINT', 'https://8q5zg2p8tj.us-east-1.awsapprunner.com/odata/v4/order');
backend.jobProcessor.addEnvironment('PROCESSING_JOB_TABLE', processingJobTable.tableName);

// バックエンドの出力を定義
backend.addOutput({
  custom: {
    bucketName: csvBucket.bucketName,
    queueUrl: processingQueue.queueUrl,
    queueArn: processingQueue.queueArn,
    processingJobTable: processingJobTable.tableName
  }
});