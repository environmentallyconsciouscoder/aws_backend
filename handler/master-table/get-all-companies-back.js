import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";

export async function main() {

    const params = {
        TableName: "company_identifier_master",
    };

    try {

        const result = await dynamoDbLib.call("scan", params);
        console.log("result", result);
        return success(result);

    } catch (e) {
        return failure({ status: false });
    }
}
