import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";

export async function main(event) {

  const params = {
    TableName: "company_identifier_master",
  };

  try {
    const result = await dynamoDbLib.call("scan", params);
    const numberOfCompaniesInMasterTable = result.Items.length;
    console.log("numberOfCompaniesInMasterTable", numberOfCompaniesInMasterTable);

    return success(numberOfCompaniesInMasterTable);

  } catch (e) {
    return failure({ status: false });
  }
}