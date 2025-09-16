import { util } from "@aws-appsync/utils";

export function request(ctx) {
  const args = ctx.arguments || {};
  const queryParams = {};
  
  // ページネーション
  if (args.top) {
    queryParams["$top"] = args.top;
  }

  // スキップ
  if (args.skip) {
    queryParams["$skip"] = args.skip;
  }

  // フィルタリング
  if (args.filter) {
    queryParams["$filter"] = args.filter;
  }

  // ソート
  if (args.orderby) {
    queryParams["$orderby"] = args.orderby;
  }
  
  //　フィールド選択
  if (args.select) {
    queryParams["$select"] = args.select;
  }

  // フルテキスト検索
  if (args.search) {
    queryParams["$search"] = args.search;
  }
  
  console.log("Query params:", JSON.stringify(queryParams, null, 2));
  return {
    method: "GET",
    resourcePath: "/odata/v4/order/OrderData",
    params: {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      query: queryParams,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  if (ctx.result.statusCode === 200) {
    const body = JSON.parse(ctx.result.body);
    return body.value;
  } else {
    return util.appendError(ctx.result.body, `${ctx.result.statusCode}`);
  }
}