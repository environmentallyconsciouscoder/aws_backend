import AWS from "aws-sdk";
const dynamoDb = new AWS.DynamoDB.DocumentClient();

import {
    getCurrentWeekNumberInTheYear,
} from '../utils/common';

/**
 * updateQuestionsForSurveyData
 * @param {String} id
 * @param {String} companyName
 * @param {String} siteId
 * @returns
 */
 export const updateQuestionsForSurveyData = (id, companyName, siteId, currYear, contentResponses) => {
    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :content",
        ExpressionAttributeValues: {
            ":content": `${siteId}_weeklySurveyResults_${currYear}`,
        },
       };

       const responses = dynamoDb.query(params);
       const results = responses.promise();

       const date = new Date();
       const currentWeekNumberInTheYear = getCurrentWeekNumberInTheYear(date);
    //    console.log("currentWeekNumberInTheYear",currentWeekNumberInTheYear);

       results.then((data) => {
        const res = data.Items;
        res.map((item) => {
            // console.log("weeklySurvey",item.weeklySurvey);
            item.weeklySurvey.map((data) => {
                if (data.weekOfYear == currentWeekNumberInTheYear) {
                    data.questions = [contentResponses.surveyOneContent, contentResponses.surveyTwoContent, contentResponses.surveyThreeContent, contentResponses.surveyFourContent];
                };
            });
        });

        const updateRes = res.map((data) => {
            return data.weeklySurvey;
        });

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_weeklySurveyResults_${currYear}`,
            },
            UpdateExpression: `set weeklySurvey = :weeklySurvey`,
            ExpressionAttributeValues: {
              ":weeklySurvey": updateRes[0]
            },
          };

        const updateDB = dynamoDb.update(updateParams);
         updateDB.promise().then((data) => {
            return data;
          });
       });
};