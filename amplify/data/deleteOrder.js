import { util } from "@aws-appsync/utils";

export function request(ctx) {
  return {
    method: "DELETE",
    resourcePath: "/odata/v4/order/OrderData(ID='" + ctx.arguments.ID +"')",
    params: {
      headers: {
        "Content-Type": "application/json",
      },
    },
  };
}

export function response(ctx) {
  if (ctx.result.statusCode == 204) {
    return true;
  } else {
    return false;
  }
}