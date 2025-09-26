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
      .returns(a.ref("OrderResponse")) // リスポンス型をOrderResponseに変更
      .authorization(allow => [allow.publicApiKey()]) 
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
      
  Sales: a.customType({
      ID: a.string(),
      sales_year: a.integer(),
      sales_month: a.integer(),
      sales_week: a.integer(),
      customer_code: a.string(),
      product_code: a.string(),
      product_name: a.string(),
      quantity: a.integer(),
      unit_price: a.float(),
      total_amount: a.float(),
      order_status: a.string(),
      payment_status: a.string(),
      created_at: a.datetime(),
      updated_at: a.datetime(),
      count: a.integer(),
  }),
  
  getSales: a
    .query()
    .arguments({
      orderby: a.string(),
        filter: a.string(),
        top: a.integer(),
        skip: a.integer(),
        select: a.string(),
        search: a.string(),
    })
    .returns(a.ref("salesResponse"))
    .authorization(allow => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: "OdataDataSource",
        entry: "./getSales.js",
      })
    ),

  createSale: a
    .mutation()
    .arguments({
        ID: a.string(),
        customer_code: a.string(),
        product_code: a.string(),
        product_name: a.string(),
        quantity: a.integer(),
        unit_price: a.float(),
        total_amount: a.float(),
        order_status: a.string(),
        payment_status: a.string(),
        sales_year: a.integer(),
        sales_month: a.integer(),
        sales_week: a.integer(),
        created_at: a.datetime(),
        updated_at: a.datetime(),
    })
    .returns(a.ref("Sales"))
    .authorization(allow => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: "OdataDataSource",
        entry: "./createSale.js",
      })
    ),

  deleteSale: a
    .mutation()
    .arguments({ ID: a.string().required() })
    .returns(a.boolean())
    .authorization(allow => [allow.publicApiKey()])
    .handler(
      a.handler.custom({
        dataSource: "OdataDataSource",
        entry: "./deleteSale.js",
      })
    ),
  salesResponse: a.customType({
    data: a.ref("Sales").array(),
    count: a.integer()
  }),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
  },
});