import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

import { lookForPatterns } from '../../utils/sawtooth';
import { recieveCurrentWeek } from '../../utils/common';

let dailyElectricalData;
let weeklyData;
let hourlyWastesWeeklyArray = [];

let dailyCoverWasteArray = [];
let dailyPrepWasteArray = [];
let dailySpoilageWasteArray = [];

let dailyCoverWasteArrayFormated = [];
let dailyPrepWasteArrayFormated = [];
let dailySpoilageWasteArrayFormated = [];

let totalDailyWaste = [];

const gethourlyWastes = (dailyElectricalData, weekOfYear) => {
    dailyElectricalData.map((data) => {
        data.dayOfTheYear.map((item) => {
            if (weekOfYear == recieveCurrentWeek(item.Date)) {
                hourlyWastesWeeklyArray.push({
                    date: item.Date,
                    data: {
                        "coverWaste": item.coverWaste,
                        "preparationWaste": item.preparationWaste,
                        "spoilageWaste": item.spoilageWaste
                    }
                });
            };
        });
    });
};

export const main = (event, context, callback) => {

    //REMOVE CACHE
    weeklyData;
    dailyElectricalData;
    hourlyWastesWeeklyArray = [];
    dailyCoverWasteArray = [];
    dailyPrepWasteArray = [];
    dailySpoilageWasteArray = [];
    dailyCoverWasteArrayFormated = [];
    dailyPrepWasteArrayFormated = [];
    dailySpoilageWasteArrayFormated = [];
    totalDailyWaste = [];

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";
    // let weekOfYear = "43";
    const currentYear = new Date().getFullYear();
    const id = event.queryStringParameters.companyNumber;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteID;
    const weekOfYear = event.queryStringParameters.weekOfYear;

    const productionPreparationParams = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :productionPreparation",
        ExpressionAttributeValues: {
            ":productionPreparation": `${siteId}_productionPreparation_${currentYear}`,
        },
    };

    const productionPreparationFromDB = dynamoDb.query(productionPreparationParams);

    productionPreparationFromDB.promise().then((data) => {

        // console.log("data",data);
        data.Items.map((item) => {

            const dailyElectricalWasteParams = {
                TableName: `${id}_${companyName}_allReports`,
                KeyConditionExpression: "site = :dailyElectricalData",
                ExpressionAttributeValues: {
                    ":dailyElectricalData": `${siteId}_dailyElectricalData_${currentYear}`,
                },
            };

            const dailyElectricalFromDB = dynamoDb.query(dailyElectricalWasteParams);
            // console.log("dailyElectricalFromDB",dailyElectricalFromDB);

            dailyElectricalFromDB.promise().then((data) => {
                // console.log("data",data);
                dailyElectricalData = data.Items;
                gethourlyWastes(dailyElectricalData, weekOfYear);
                // console.log("hourlyWastesWeeklyArray",hourlyWastesWeeklyArray);

                hourlyWastesWeeklyArray.map((data, i) => {
                    const dailyCoverWaste = lookForPatterns(data.data.coverWaste, "cw");
                    dailyCoverWasteArray.push(dailyCoverWaste);

                    const dailyPrepWaste = lookForPatterns(data.data.preparationWaste, "pw");
                    dailyPrepWasteArray.push(dailyPrepWaste);

                    const dailySpoilageWaste = lookForPatterns(data.data.spoilageWaste, "sw");
                    dailySpoilageWasteArray.push(dailySpoilageWaste);
                });

                // console.log("dailyCoverWasteArray", dailyCoverWasteArray);
                // console.log("dailyPrepWasteArray", dailyPrepWasteArray);
                // console.log("dailySpoilageWasteArray", dailySpoilageWasteArray);

                dailyCoverWasteArray.map((data) => {
                    const num = parseInt(data.toFixed(0));
                    dailyCoverWasteArrayFormated.push(num);
                });

                dailyPrepWasteArray.map((data) => {
                    const num = parseInt(data.toFixed(0));
                    dailyPrepWasteArrayFormated.push(num);
                });

                dailySpoilageWasteArray.map((data) => {
                    const num = parseInt(data.toFixed(0));
                    dailySpoilageWasteArrayFormated.push(num);
                });

                // console.log("dailyCoverWasteArrayFormated", dailyCoverWasteArrayFormated);
                // console.log("dailyPrepWasteArrayFormated", dailyPrepWasteArrayFormated);
                // console.log("dailySpoilageWasteArrayFormated", dailySpoilageWasteArrayFormated);
                for (let i = 0; i < dailyCoverWasteArray.length; i++) {
                    let sum =
                        dailyCoverWasteArrayFormated[i] +
                        dailyPrepWasteArrayFormated[i] +
                        dailySpoilageWasteArrayFormated[i];
                    totalDailyWaste.push(sum);
                };
                // console.log("totalDailyWaste", totalDailyWaste);

                //get production waste week for the graph
                const productionPrepWaste = item.productionPreparation.filter((val) => {
                    if (val.weekOfYear == weekOfYear) {
                        return val.productionWasteWeek;
                    };
                });

                const result = {
                    dailyCoverWasteArrayFormated,
                    dailyPrepWasteArrayFormated,
                    dailySpoilageWasteArrayFormated,
                    totalDailyWaste,
                    productionPrepWaste
                };

                // console.log("result", result);
                // console.log("productionPrepWaste",productionPrepWaste);
                return callback(null, success(result));
            });
        });
    }).catch((err) => {
        return failure(err);
    });
};