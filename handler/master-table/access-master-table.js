import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";

export async function main(event) {

  // const companyName = event.pathParameters.id;

  const companyName = event.queryStringParameters.companyName;
  const companyId = event.queryStringParameters.companyId;

  const params = {
    TableName: "company_identifier_master",
    KeyConditionExpression: "company = :companyName and id = :companyId",
    ExpressionAttributeValues: {
      ":companyId": companyId,
      ":companyName": companyName,
    },
  };

  // const params = {
  //   TableName: "company_identifier_master",
  //   KeyConditionExpression: "company = :companyName",
  //   ExpressionAttributeValues: {
  //     ":companyName": companyName,
  //   },
  // };

  try {
    const result = await dynamoDbLib.call("query", params);

    // console.log("result",result);
    // console.log("result.Items",result.Items);
    // console.log("result.Items.length",result.Items.length);

    if (result.Items.length > 0) {
      const masterTableData = {
        startDate: result.Items[0].date.startDate,
        companyId: result.Items[0].id,
        sites: result.Items[0].sites,
        carbonMunicipalValue: result.Items[0].CarbonMunicipalValue
      };

      return success(masterTableData);
    } else {
      const masterTableDataTwo = {
        startDate: "",
        companyId: "",
        sites: {}
      };

      return success(masterTableDataTwo);
    };

  } catch (e) {
    return failure({ status: false });
  }
}
