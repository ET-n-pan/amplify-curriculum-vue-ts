import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a Todo database table with a "content" field. Try
adding a new "isDone" field as a boolean. The authorization rule below
specifies that any unauthenticated user can "create", "read", "update", 
and "delete" any "Todo" records.
=========================================================================*/
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
      created_at: a.string()
    }),

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
      .returns(a.ref("Order").array())
      .authorization(allow => [allow.publicApiKey()]) // APIキー認証を許可
      .handler(
        a.handler.custom({
          dataSource: "OdataDataSource",
          entry:"./getOrder.js"
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

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
