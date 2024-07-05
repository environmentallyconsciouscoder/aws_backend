import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const loginTime = [];

const mapUserDetailsToArray = (username, name, result) => {

    let newObject = result.map((data) => {
        data.superAdminCreatedUsers.push({username, name, loginTime});
        return data.superAdminCreatedUsers;
    });

    return newObject[0];
};

export const main = (event, context, callback) => {

    const coversInput = JSON.parse(event.body);

    const companyId = coversInput.companyID;
    const company = coversInput.company;
    const username = coversInput.username;
    const name = coversInput.name;

    // const companyId = "1000";
    // const company = "falmouthUniversity";
    // const username = "jamestangdeveloper@gmail.com";
    // const name = "james tang";

    const params = {
        TableName: `${companyId}_${company}_allReports`,
        KeyConditionExpression: "site = :sites",
        ExpressionAttributeValues: {
            ":sites": `sites_usersLoginTime`,
          },
    };

    console.log("params",params);

    const response = dynamoDb.query(params);

    const res = response.promise();

    console.log("res",res);

    res.then((data) => {
        const result = data.Items;
        // console.log("result",result);

        const superAdminCreatedUsers = mapUserDetailsToArray(username, name, result);

        console.log("superAdminCreatedUsers",superAdminCreatedUsers);

        const params = {
            TableName: `${companyId}_${company}_allReports`,
            Key: {
            site: `sites_usersLoginTime`,
            },
            UpdateExpression: `set superAdminCreatedUsers = :value`,
            ExpressionAttributeValues: {
            ":value": superAdminCreatedUsers
            },
        };

        const response = dynamoDb.update(params);

        response.promise().then((data) => {
            return callback(null,success(data));
        }).catch((err) => {
            return failure(err);
        });


    }).catch((err) => {
        return failure(err);
    });

};