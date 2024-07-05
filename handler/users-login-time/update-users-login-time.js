import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const addLoginTime = (result, email, time) => {

    let newArray = [];

    result.map((data) => {
        data.superAdminCreatedUsers.map((item) => {
            // console.log("item.username == email",item.username == email);
            if (item.username === email) {

                if (item.loginTime[1]) {
                    item.loginTime.shift();
                    item.loginTime.push({"time": time});
                    newArray.push(item);
                } else {
                    item.loginTime.push({"time": time});
                    newArray.push(item);
                };

                // console.log("item here",item);
            } else {
                newArray.push(item);
            };
        });
    });

    console.log("newArray",newArray);

    return newArray;
};

export const main = (event, context, callback) => {

    const companyId = decodeURI(event.pathParameters.id);
    const data = JSON.parse(event.body);

    const time = data.time;
    const companyname = data.userDetails.companyname;
    const email = data.userDetails.email;

    const params = {
        TableName: `${companyId}_${companyname}_allReports`,
        KeyConditionExpression: "site = :sites",
        ExpressionAttributeValues: {
            ":sites": `sites_usersLoginTime`,
          },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        const result = data.Items;
        // console.log("result",result);

        const superAdminCreatedUsers = addLoginTime(result, email, time);

        console.log("superAdminCreatedUsers",superAdminCreatedUsers);

        const updateParams = {
            TableName: `${companyId}_${companyname}_allReports`,
            Key: {
            site: `sites_usersLoginTime`,
            },
            UpdateExpression: `set superAdminCreatedUsers = :value`,
            ExpressionAttributeValues: {
            ":value": superAdminCreatedUsers
            },
        };

        const response = dynamoDb.update(updateParams);

        response.promise().then((data) => {
            return callback(null,success(data));
        }).catch((err) => {
            return failure(err);
        });

    }).catch((err) => {
        return failure(err);
    });

};