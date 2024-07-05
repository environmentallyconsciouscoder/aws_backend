import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

import {
  updateQuestionsForSurveyData
} from '../../utils/update';

export const main = (event, context, callback) => {

    try {
        const dynamoDb = new AWS.DynamoDB.DocumentClient();

        // const contentResponses = {
        //     content: " ",
        //     surveyOneContent: " testing",
        //     surveyTwoContent: " testing",
        //     surveyThreeContent: " testing",
        //     surveyFourContent: " testing"
        // };

        const currYear = new Date().getFullYear();

        // const siteId = "1_STANNARY";
        // const id = "1000";
        // const companyName = "falmouthUniversity";

        const eventResponse = JSON.parse(event.body);
        const contentResponses = eventResponse.contentResponses;
        const companyInformation = eventResponse.companyInformation;
        const id = companyInformation.id;
        const companyName = companyInformation.companyName;
        const siteId = companyInformation.siteName;

        const params = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :content",
            ExpressionAttributeValues: {
                ":content": `${siteId}_liveFeedContent`,
            },
        };
        // console.log("params",params);
        // console.log("questionsResponses",questionsResponses);

       const response = dynamoDb.query(params);
       const results = response.promise();
      //  console.log("results",results);

      updateQuestionsForSurveyData(id, companyName, siteId, currYear, contentResponses);

       results.then((data) => {
         const result = data.Items;
         result.map((data) => {
            data.content[0].surveyQuestionOne = contentResponses.surveyOneContent;
            data.content[0].surveyQuestionTwo = contentResponses.surveyTwoContent;
            data.content[0].surveyQuestionThree = contentResponses.surveyThreeContent;
            data.content[0].surveyQuestionFour = contentResponses.surveyFourContent;
            data.content[0].openingContent = contentResponses.content;
            data.content[0].logoURL = contentResponses.logoURL;
         });

        const updateRes = result.map((data) => {
            return data.content;
        });

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_liveFeedContent`,
            },
            UpdateExpression: `set content = :content`,
            ExpressionAttributeValues: {
              ":content": updateRes[0]
            },
          };

        const res = dynamoDb.update(updateParams);
        console.log("res",res);
        res.promise().then((data) => {
            return callback(null,success(data));
        });

       });

    } catch(error) {
        return failure(error);
    };
};