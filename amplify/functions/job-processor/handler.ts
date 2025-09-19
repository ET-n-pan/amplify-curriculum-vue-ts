// amplify/functions/job-processor/handler.ts
import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = new DynamoDBClient({});

export const handler = async (event: SQSEvent) => {
  // Process each message individually for atomic updates
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { jobId, batchNumber, totalBatches, orders } = message;
      
      console.log(`Processing batch ${batchNumber}/${totalBatches} for job ${jobId}`);
      
      // Build OData batch request
      const batchRequests = orders.map((order: any) => ({
        id: String(order.rowIndex),
        method: "POST",
        url: "OrderData",
        headers: { "Content-Type": "application/json" },
        body: order.orderData
      }));

      // Send to OData endpoint
      const response = await fetch(`${process.env.SQL_ENDPOINT}/$batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'OData-Version': '4.0'
        },
        body: JSON.stringify({ requests: batchRequests })
      });

      if (!response.ok) {
        throw new Error(`OData batch failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Count successes and failures
      let successful = 0;
      let failed = 0;
      
      if (result.responses) {
        result.responses.forEach((resp: any) => {
          if (resp.status < 400) {
            successful++;
          } else {
            failed++;
            console.error(`Order failed:`, resp.status, resp.body);
          }
        });
      }
      
      console.log(`Batch ${batchNumber}: ${successful} successful, ${failed} failed`);
      
      // ATOMIC UPDATE - Use ADD for counters to avoid race conditions
      const updateResult = await dynamoClient.send(new UpdateItemCommand({
        TableName: process.env.PROCESSING_JOB_TABLE!,
        Key: { id: { S: jobId } },
        UpdateExpression: `
          ADD processedBatches :one,
              processedRows :rows,
              successfulOrders :success,
              failedOrders :failed
          SET updatedAt = :now,
              #status = if_not_exists(#status, :processing)
        `,
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':one': { N: '1' },
          ':rows': { N: String(orders.length) },
          ':success': { N: String(successful) },
          ':failed': { N: String(failed) },
          ':processing': { S: 'PROCESSING' },
          ':now': { S: new Date().toISOString() }
        },
        ReturnValues: 'ALL_NEW'
      }));
      
      
      console.log(`Job ${jobId} updated:`, updateResult.Attributes);

      // Check if this was the last batch
      const updatedItem = updateResult.Attributes;
      if (updatedItem) {
        const processedBatches = parseInt(updatedItem.processedBatches.N || '0');
        const totalBatchesCount = parseInt(updatedItem.totalBatches?.N || totalBatches);
        
        if (processedBatches === totalBatchesCount) {
          // Final update when all batches are complete
          await dynamoClient.send(new UpdateItemCommand({
            TableName: process.env.PROCESSING_JOB_TABLE!,
            Key: { id: { S: jobId } },
            UpdateExpression: 'SET #status = :completed, endTime = :endTime, updatedAt = :now',
            ExpressionAttributeNames: {
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':completed': { S: 'COMPLETED' },
              ':endTime': { S: new Date().toISOString() },
              ':now': { S: new Date().toISOString() }
            }
          }));
          
          console.log(`Job ${jobId} completed! All ${totalBatchesCount} batches processed.`);
        }
      }
      
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error; // Keep in queue for retry
    }
  }
};