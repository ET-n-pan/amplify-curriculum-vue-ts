// amplify/functions/csv-reader/handler.ts
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import crypto from 'crypto';

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: S3Event) => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    const jobId = crypto.randomUUID();
    
    try {
      const getObjectResponse = await s3Client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key })
      );
      
      const csvContent = await getObjectResponse.Body?.transformToString();
      if (!csvContent) throw new Error('Empty CSV file');

      const rows = csvContent.split('\n').filter(row => row.trim());
      const headers = rows[0].split(',').map(h => h.trim());
      const dataRows = rows.slice(1);
      const totalBatches = Math.ceil(dataRows.length / 10);

      console.log(`Processing ${key}: ${dataRows.length} orders, ${totalBatches} batches`);

      // Create job record in DynamoDB
      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.PROCESSING_JOB_TABLE!,
        Item: {
          id: { S: jobId },
          fileName: { S: key },
          totalRows: { N: String(dataRows.length) },
          totalBatches: { N: String(totalBatches) },
          processedRows: { N: '0' },
          processedBatches: { N: '0' },
          successfulOrders: { N: '0' },
          failedOrders: { N: '0' },
          status: { S: 'PROCESSING' },
          startTime: { S: new Date().toISOString() },
          createdAt: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() },
          __typename: { S: 'ProcessingJob' }
        }
      }));

      // Send batches to SQS
      const batchSize = 10;
      for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        
        const orders = batch.map((row, index) => {
          const rowData = row.split(',').map(cell => cell.trim());
          
          return {
            rowIndex: i + index,
            orderData: {
              ID: rowData[headers.indexOf('ID')] || `order_${Date.now()}_${i + index}`,
              customer_code: rowData[headers.indexOf('customer_code')],
              product_code: rowData[headers.indexOf('product_code')],
              estimated_cost: parseFloat(rowData[headers.indexOf('estimated_cost')] || '0'),
              quantity: parseInt(rowData[headers.indexOf('quantity')] || '1'),
              unit_price: parseFloat(rowData[headers.indexOf('unit_price')] || '0'),
              delivery_date: rowData[headers.indexOf('delivery_date')]?.split('T')[0],
              status: rowData[headers.indexOf('status')] || 'PENDING',
              created_at: rowData[headers.indexOf('created_at')]?.replace('Z', '')
            }
          };
        });

        await sqsClient.send(new SendMessageCommand({
          QueueUrl: process.env.QUEUE_URL!,
          MessageBody: JSON.stringify({
            jobId,
            fileName: key,
            batchNumber,
            totalBatches,
            orders,
            action: 'CREATE_ORDERS_BATCH'
          })
        }));
        
        console.log(`Queued batch ${batchNumber}/${totalBatches}`);
      }

      console.log(`Successfully queued all batches for job ${jobId}`);
      
    } catch (error) {
      console.error(`Error processing ${key}:`, error);
      
      // Update job status to FAILED
      await dynamoClient.send(new PutItemCommand({
        TableName: process.env.PROCESSING_JOB_TABLE!,
        Item: {
          id: { S: jobId },
          fileName: { S: key },
          status: { S: 'FAILED' },
          errorMessage: { S: error instanceof Error ? error.message : String(error) },
          endTime: { S: new Date().toISOString() },
          updatedAt: { S: new Date().toISOString() },
          __typename: { S: 'ProcessingJob' }
        }
      }));
    }
  }
};