import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // const id = "1000";
    // const companyName = "falmouthUniversity";
    // const siteId = "1_STANNARY";

    const id = event.queryStringParameters.id;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteName;

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :content",
        ExpressionAttributeValues: {
            ":content": `${siteId}_liveFeedContent`,
        },
    };

    const response = dynamoDb.query(params);
    const results = response.promise();

    results.then((data) => {
        const result = data.Items;
        // console.log("result",result);

        const res = result.map((data) => {
            return data.content;
        });

        const content = res;
        // console.log("content",content);

        return callback(null,success(content));
    }).catch((err) => {
        return failure(err);
    });

};