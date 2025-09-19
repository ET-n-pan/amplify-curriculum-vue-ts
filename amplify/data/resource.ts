import { type ClientSchema, a, defineData, secret } from '@aws-amplify/backend';
import { count } from 'console';

const schema = a.schema({
  Order: a.customType({
      ID: a.string(),
      customer_code: a.string(),
      product_code: a.string(),
      estimated_cost: a.float(),
      quantity: a.integer(),
      unit_price: a.float(),
      delivery_date: a.string(),
      status: a.string(),
      created_at: a.string(),
      count: a.integer()
    }),
    OrderResponse: a.customType({
      data: a.ref("Order").array(),
      count: a.integer()
    }),
    ProcessingJob: a.model({
      fileName: a.string().required(),
      totalRows: a.integer().required(),
      processedRows: a.integer().default(0),
      totalBatches: a.integer(),
      processedBatches: a.integer().default(0),
      successfulOrders: a.integer().default(0),
      failedOrders: a.integer().default(0),
      status: a.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
      startTime: a.datetime().required(),
      endTime: a.datetime(),
      errorMessage: a.string()
    })
    .authorization((allow) => [allow.publicApiKey()]),
    // 
    getOrder: a
      .query()
      .arguments({
        orderby: a.string(),
        filter: a.string(),
        top: a.integer(),
        skip: a.integer(),
        select: a.string(),
        search: a.string(),
      })
      .returns(a.ref("OrderResponse"))
      .authorization(allow => [allow.publicApiKey()]) // APIキー認証を許可
      .handler(
        a.handler.custom({
          dataSource: "OdataDataSource",
          entry:"./getOrder.js"
        })
      ),

    createOrder: a
      .mutation()
      .arguments({
        ID: a.string(),
        customer_code: a.string(),
        product_code: a.string(),
        estimated_cost: a.float(),
        quantity: a.integer(),
        unit_price: a.float(),
        delivery_date: a.string(),
        status: a.string(),
        created_at: a.string()
      })
      .returns(a.ref("Order"))
      .authorization(allow => [allow.publicApiKey()]) // APIキー認証を許可
      .handler(
        a.handler.custom({
          dataSource: "OdataDataSource",
          entry:"./createOrder.js"
        })
      ),

    updateOrder: a
      .mutation()
      .arguments({
        ID: a.string().required(),
        customer_code: a.string(),
        product_code: a.string(),
        estimated_cost: a.float(),
        quantity: a.integer(),
        unit_price: a.float(),
        delivery_date: a.string(),
        status: a.string(),
        created_at: a.string()
      })
      .returns(a.ref("Order"))
      .authorization(allow => [allow.publicApiKey()]) // APIキー認証を許可
      .handler(
        a.handler.custom({
          dataSource: "OdataDataSource",
          entry:"./updateOrder.js"
        })
      ),
      
    deleteOrder: a
      .mutation()
      .arguments({
        ID: a.string().required(),
      })
      .returns(a.boolean())
      .authorization(allow => [allow.publicApiKey()]) // APIキー認証を許可
      .handler(
        a.handler.custom({
          dataSource: "OdataDataSource",
          entry:"./deleteOrder.js"
        })
      ),
      
    

    
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});