import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    const id = event.queryStringParameters.companyNumber;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteID;
    const currentYear = new Date().getFullYear();
    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :coverInput",
        ExpressionAttributeValues: {
          ":coverInput": `${siteId}_weeklyCoversInput_${currentYear}`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        const result = data.Items;
        return callback(null,success(result));
    }).catch((err) => {
        return failure(err);
    });
};