import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

import {
    getCurrentWeekNumberInTheYear,
} from '../../utils/common';

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    const siteId = event.queryStringParameters.siteId;
    const id = event.queryStringParameters.id;
    const companyName = event.queryStringParameters.companyName;
    const currentYear = new Date().getFullYear();
    // const siteId = "1_STANNARY";
    // const id = "1000";
    // const companyName = "falmouthUniversity";

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :survey",
        ExpressionAttributeValues: {
          ":survey": `${siteId}_weeklySurveyResults_${currentYear}`,
        },
    };
    // console.log("params",params);

    const response = dynamoDb.query(params);

    const results = response.promise();

    results.then((data) => {
        const result = data.Items;
        // console.log("result",result);

        const date = new Date();
        const currentWeekNumberInTheYear = getCurrentWeekNumberInTheYear(date);

        const weeklySurvey = result.map((data) => {
            // console.log("data",data.weeklySurvey);
            return data.weeklySurvey.filter((weeklyData) => {
                return weeklyData.weekOfYear == currentWeekNumberInTheYear;
            });
        });

        const questions = weeklySurvey[0][0].questions;
        // console.log("questions",questions);

        return callback(null,success(questions));
    }).catch((err) => {
        return failure(err);
    });
};