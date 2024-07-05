import { failure, success } from "../../libs/response-lib";

import {
    getSurveyContent
  } from '../../utils/Queries';

  import {
    reducer
  } from '../../utils/common';


const returnSurveyDataSum = (data) => {
    let arr = [];
    arr.push(data.q1);
    arr.push(data.q2);
    arr.push(data.q3);
    arr.push(data.q4);
    return arr.reduce(reducer);
};

const returnArr = (data) => {
    let arr = [];
    arr.push(data.q1);
    arr.push(data.q2);
    arr.push(data.q3);
    arr.push(data.q4);
    return arr;
};

export const main = async (event, context, callback) => {

    let sampleTotal;
    let questions;
    let dataForGraph;
    let numberOfWeeks;
    let maxValue;
    let weekCommence;
    let allWeeksOfTheYear = [];
    let index;

    try {
        const currYear = new Date().getFullYear();

        const id = event.queryStringParameters.id;
        const companyName = event.queryStringParameters.companyName;
        const siteId = event.queryStringParameters.siteName;
        const weekNumber = event.queryStringParameters.weekNumber;

        // const id = "1000";
        // const companyName = "falmouthUniversity";
        // const siteId = "1_STANNARY";
        // const weekNumber = "49";

        const surveyContent = await getSurveyContent(id,companyName,siteId,currYear);

        surveyContent.Items.map((data) => {

            // console.log("data",data);
            numberOfWeeks = data.weeklySurvey.length;

            data.weeklySurvey.map((item) => {

                // console.log("item.weekOfYear",item.weekOfYear);
                allWeeksOfTheYear.push(item.weekOfYear);

                if (weekNumber == item.weekOfYear) {
                    questions = item.questions;
                    weekCommence = item.Date;

                    index = allWeeksOfTheYear.indexOf(item.weekOfYear);

                    const surveyDataOne = returnSurveyDataSum(item.surveyDataForQuestionOne[0]);
                    const surveyDataTwo = returnSurveyDataSum(item.surveyDataForQuestionTwo[0]);
                    const surveyDataThree = returnSurveyDataSum(item.surveyDataForQuestionThree[0]);
                    const surveyDataFour = returnSurveyDataSum(item.surveyDataForQuestionFour[0]);

                    sampleTotal = [surveyDataOne, surveyDataTwo, surveyDataThree, surveyDataFour];

                    // console.log("sampleTotal",sampleTotal);
                    maxValue = Math.max(sampleTotal[0]);
                    // console.log("item",item);

                    const surveyDataOneArr = returnArr(item.surveyDataForQuestionOne[0]);
                    const surveyDataTwoArr = returnArr(item.surveyDataForQuestionTwo[0]);
                    const surveyDataThreeArr = returnArr(item.surveyDataForQuestionThree[0]);
                    const surveyDataFourArr = returnArr(item.surveyDataForQuestionFour[0]);

                    dataForGraph = [
                        surveyDataOneArr[0], surveyDataOneArr[1], surveyDataOneArr[2], surveyDataOneArr[3],
                        "",
                        surveyDataTwoArr[0], surveyDataTwoArr[1], surveyDataTwoArr[2], surveyDataTwoArr[3],
                        "",
                        surveyDataThreeArr[0], surveyDataThreeArr[1], surveyDataThreeArr[2], surveyDataThreeArr[3],
                        "",
                        surveyDataFourArr[0], surveyDataFourArr[1], surveyDataFourArr[2], surveyDataFourArr[3],
                    ];
                    // console.log("surveyDataOne",surveyDataOne);
                    // console.log("surveyDataTwo",surveyDataTwo);
                    // console.log("surveyDataThree",surveyDataThree);
                    // console.log("surveyDataFour",surveyDataFour);

                };
            });
        });

        const data = {
            sampleTotal: sampleTotal,
            questions: questions,
            dataForGraph: dataForGraph,
            numberOfWeeks: numberOfWeeks,
            maxValue: maxValue,
            weekCommence: weekCommence,
            allWeeksOfTheYear: allWeeksOfTheYear,
            index: index
        };
        // console.log("data",data);
        return success(data);
    } catch (error) {
        console.log(error);
        return failure(error.message);
    }
};