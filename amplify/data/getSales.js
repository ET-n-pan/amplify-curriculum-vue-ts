import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    method: "GET",
    resourcePath: "/odata/v4/order/Sales",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }

  if (ctx.result.statusCode === 200) {
    const body = JSON.parse(ctx.result.body);
    let result = body.value;
    result[0].count = body['@odata.count'];
    return result;
  } else {
    return util.appendError(ctx.result.body, `${ctx.result.statusCode}`);
  }
}
