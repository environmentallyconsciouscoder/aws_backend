import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

export const main = (event, context, callback) => {

    const companyName = event.queryStringParameters.companyName;
    const companyNumber = event.queryStringParameters.companyNumber;

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    const params = {
        TableName: `${companyNumber}_${companyName}_allReports`,
        KeyConditionExpression: "site = :usersLoginTime",
        ExpressionAttributeValues: {
          ":usersLoginTime": `sites_usersLoginTime`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        const result = data.Items;
        console.log("result",result);
        return callback(null,success(result));
    }).catch((err) => {
        return failure(err);
    });
};