import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";

export const main = (event, context, callback) => {

  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const data = JSON.parse(event.body);

  // const companyId = "1000";
  // const companyname = "falmouthUniversity";
  // const siteID = "1_STANNARY";

  const companyId = data.companyId;
  const companyname = data.companyName;
  const siteID = data.siteId;

  // console.log("data",data);

  const updateParams = {
    TableName: `${companyId}_${companyname}_allReports`,
    Key: {
      "site": `${siteID}_capping`,
    },
    UpdateExpression: `set cappingValue = :cappingValue`,
    ExpressionAttributeValues: {
      ":cappingValue": data
    },
  };

  const response = dynamoDb.update(updateParams);
  // console.log("response",response);

  response.promise().then((data) => {

    // console.log("data",data);
    const successMessage = "Have successfully updated";
    // return callback(null,success(data));
    return callback(null,success(successMessage));
  }).catch((err) => {
    console.log("err",err);
    return failure(err);
  });

};
