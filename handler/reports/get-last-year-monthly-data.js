import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";

    const id = event.queryStringParameters.companyNumber;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteID;

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :monthlyData",
        ExpressionAttributeValues: {
          ":monthlyData": `${siteId}_monthlyWaste_${lastYear}`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        console.log("data",data);
        console.log("data.Items",data.Items);
        console.log("data.Items.length",data.Items.length);
        const result = data.Items;
        return callback(null,success(result));
    }).catch((err) => {
        return failure(err);
    });
};