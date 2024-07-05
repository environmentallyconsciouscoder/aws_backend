import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";

export const main = (event, context, callback) => {

  const dynamoDb = new AWS.DynamoDB.DocumentClient();
  const data = JSON.parse(event.body);

  // console.log("data",data);

  const companyId = data.companyId;
  const companyname = data.companyname;
  const siteID = data.siteID;

  const updateParams = {
    TableName: `${companyId}_${companyname}_allReports`,
    Key: {
      "site": `${siteID}_recommendedTargets`,
    },
    UpdateExpression: `set recommendedTargets = :recommendedTargets`,
    ExpressionAttributeValues: {
      ":recommendedTargets": data
    },
  };

  // console.log("updateParams",updateParams);

  const response = dynamoDb.update(updateParams);

  response.promise().then((data) => {

    const successMessage = "Have successfully updated";

    return callback(null,success(successMessage));
  }).catch((err) => {
    return failure(err);
  });

};
