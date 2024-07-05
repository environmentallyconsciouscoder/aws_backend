import { verifyEmail } from "../../utils/verifyEmail";
import { success, failure } from "../../libs/response-lib";

export async function main(event, context) {
    const response = JSON.parse(event.body);
    const email = response.email;
    console.log("email",email);
    try {
      await verifyEmail(email);
      return context.succeed(success(event));
    } catch (e) {
      console.log("e",e);
      return failure({ status: false });
    };
  };