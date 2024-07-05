import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";

export const main = (event, context, callback) => {

  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const dataFromFrontEnd = event.queryStringParameters;

  // const companyId = "1000";
  // const companyname = "falmouthUniversity";
  // const siteID = "1_STANNARY";

  const companyId = dataFromFrontEnd.id;
  const companyname = dataFromFrontEnd.company;
  const siteID = dataFromFrontEnd.site;

  const params = {
    TableName: `${companyId}_${companyname}_allReports`,
    KeyConditionExpression: "site = :cappingValue",
    ExpressionAttributeValues: {
      ":cappingValue": `${siteID}_capping`
    },
  };

  // console.log("updateParams",updateParams);

  const response = dynamoDb.query(params);

  response.promise().then((data) => {

    // console.log("data",data);

    return callback(null,success(data));
  }).catch((err) => {
    return failure(err);
  });

};

