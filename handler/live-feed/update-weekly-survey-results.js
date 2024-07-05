import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

import {
    getCurrentWeekNumberInTheYear,
} from '../../utils/common';

export const main = (event, context, callback) => {

    try {
        const dynamoDb = new AWS.DynamoDB.DocumentClient();

        // const questionsResponses = {
        //     questionOne: 1,
        //     questionTwo: 1,
        //     questionThree: 1,
        //     questionFour: 0
        // };

        // const siteId = "1_STANNARY";
        // const id = "1000";
        // const companyName = "falmouthUniversity";

        const eventResponse = JSON.parse(event.body);
        const questionsResponses = eventResponse.surveyResults;
        const companyInformation = eventResponse.companyInformation;

        const id = companyInformation.id;
        const companyName = companyInformation.companyName;
        const siteId = companyInformation.siteName;

        // console.log("questionsResponses",questionsResponses);
        // console.log("eventResponse",eventResponse);

        const currentYear = new Date().getFullYear();

        const params = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :survey",
            ExpressionAttributeValues: {
                ":survey": `${siteId}_weeklySurveyResults_${currentYear}`,
            },
        };
        // console.log("params",params);
        // console.log("questionsResponses",questionsResponses);

       const response = dynamoDb.query(params);
       const results = response.promise();
    //    console.log("results",results);

       results.then((data) => {
         const result = data.Items;

         const date = new Date();
         const currentWeekNumberInTheYear = getCurrentWeekNumberInTheYear(date) - 1;
         console.log("currentWeekNumberInTheYear",currentWeekNumberInTheYear);

         let questionOne;
         let questionTwo;
         let questionThree;
         let questionFour;

         if(questionsResponses.questionOne == 4) {
            questionOne = "q4";
         } else if (questionsResponses.questionOne == 3) {
            questionOne = "q3";
         } else if (questionsResponses.questionOne == 2) {
            questionOne = "q2";
        } else if (questionsResponses.questionOne == 1) {
            questionOne = "q1";
        };

        if(questionsResponses.questionTwo == 4) {
            questionTwo = "q4";
         } else if (questionsResponses.questionTwo == 3) {
            questionTwo = "q3";
         } else if (questionsResponses.questionTwo == 2) {
            questionTwo = "q2";
        } else if (questionsResponses.questionTwo == 1) {
            questionTwo = "q1";
        };

        if(questionsResponses.questionThree == 4) {
            questionThree = "q4";
         } else if (questionsResponses.questionThree == 3) {
            questionThree = "q3";
         } else if (questionsResponses.questionThree == 2) {
            questionThree = "q2";
        } else if (questionsResponses.questionThree == 1) {
            questionThree = "q1";
        };

        if(questionsResponses.questionFour == 4) {
            questionFour = "q4";
         } else if (questionsResponses.questionFour == 3) {
            questionFour = "q3";
         } else if (questionsResponses.questionFour == 2) {
            questionFour = "q2";
        } else if (questionsResponses.questionFour == 1) {
            questionFour = "q1";
        };

        result.map((data) => {
            return data.weeklySurvey.filter((weeklyData) => {
                // console.log("currentWeekNumberInTheYear",currentWeekNumberInTheYear);

                if (weeklyData.weekOfYear == currentWeekNumberInTheYear) {

                    if (questionsResponses.questionOne == 0) {
                        // weeklyData.surveyDataForQuestionOne[0][questionOne] = weeklyData.surveyDataForQuestionOne[0][questionOne] + 0;
                    } else {
                        weeklyData.surveyDataForQuestionOne[0][questionOne] = weeklyData.surveyDataForQuestionOne[0][questionOne] + 1;
                    };

                    if (questionsResponses.questionTwo == 0) {
                        // weeklyData.surveyDataForQuestionTwo[0][questionTwo] = weeklyData.surveyDataForQuestionTwo[0][questionTwo] + 0;
                    } else {
                        weeklyData.surveyDataForQuestionTwo[0][questionTwo] = weeklyData.surveyDataForQuestionTwo[0][questionTwo] + 1;
                    };

                    if (questionsResponses.questionThree == 0) {
                        // weeklyData.surveyDataForQuestionThree[0][questionThree] = weeklyData.surveyDataForQuestionThree[0][questionThree] + 0;
                    } else {
                        weeklyData.surveyDataForQuestionThree[0][questionThree] = weeklyData.surveyDataForQuestionThree[0][questionThree] + 1;
                    };

                    if (questionsResponses.questionFour == 0) {
                        // weeklyData.surveyDataForQuestionFour[0][questionFour] = weeklyData.surveyDataForQuestionFour[0][questionFour] + 0;
                    } else {
                        weeklyData.surveyDataForQuestionFour[0][questionFour] = weeklyData.surveyDataForQuestionFour[0][questionFour] + 1;
                    };


                    // weeklyData.surveyDataForQuestionOne[0][questionOne] = weeklyData.surveyDataForQuestionOne[0][questionOne] + questionsResponses.questionOne;
                    // weeklyData.surveyDataForQuestionTwo[0][questionTwo] = weeklyData.surveyDataForQuestionTwo[0][questionTwo] + questionsResponses.questionTwo;

                    // weeklyData.surveyDataForQuestionThree[0][questionThree] = weeklyData.surveyDataForQuestionThree[0][questionThree] + questionsResponses.questionThree;
                    // weeklyData.surveyDataForQuestionFour[0][questionFour] = weeklyData.surveyDataForQuestionFour[0][questionFour] + questionsResponses.questionFour;
                };
            });
        });

        // console.log("surveyDataForQuestionTwo",weeklySurvey[0][0].surveyDataForQuestionTwo);

        const updateRes = result[0].weeklySurvey;

        // console.log("surveyDataForQuestionOne",updateRes[0].surveyDataForQuestionOne);
        // console.log("surveyDataForQuestionTwo",updateRes[0].surveyDataForQuestionTwo);

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_weeklySurveyResults_${currentYear}`,
            },
            UpdateExpression: `set weeklySurvey = :weeklySurvey`,
            ExpressionAttributeValues: {
              ":weeklySurvey": updateRes
            },
          };

        //   console.log("newArray",newArray);
        //   console.log("updateParams",updateParams);

        const res = dynamoDb.update(updateParams);
        // console.log("res",res);

        res.promise().then((data) => {
            // console.log("data",data);
            return callback(null,success(data));
        });

       });

    } catch(error) {
        return failure(error);
    };
};