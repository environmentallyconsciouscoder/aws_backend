import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

let weeklyData;
let dailyElectricalData;
let hourlyWastesWeeklyArray = [];

let dailyCoverWasteArray = [];
let dailyPrepWasteArray = [];
let dailySpoilageWasteArray = [];

import {
    createUniqueArrayOfObjects
} from '../../utils/common';

import { lookForPatterns } from '../../utils/sawtooth';

const gethourlyWastes = (dailyElectricalData) => {
    // console.log("weeklyData", weeklyData);
    // console.log("weeklyData.length", weeklyData.length);
    // console.log("dailyElectricalData", dailyElectricalData);

    //this will loop thru the number of objects in dailyElectricalData x 7 weekly days
    for (let index = 0; index < weeklyData.length; index++) {
        dailyElectricalData.map((data) => {
            data.dayOfTheYear.filter((item) => {

                if (item.Date == weeklyData[index]) {
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
};

export const main = (event, context, callback) => {

    //REMOVE CACHE
    weeklyData;
    dailyElectricalData;
    hourlyWastesWeeklyArray = [];
    dailyCoverWasteArray = [];
    dailyPrepWasteArray = [];
    dailySpoilageWasteArray = [];

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";
    const currentYear = new Date().getFullYear();
    const id = event.queryStringParameters.companyNumber;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteID;

    const weeklyDatesParams = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :weeklyDates",
        ExpressionAttributeValues: {
            ":weeklyDates": `sites_weeklyDateWaste`,
        },
    };

    const weeklyDatesFromDB = dynamoDb.query(weeklyDatesParams);

    weeklyDatesFromDB.promise().then((data) => {
        // console.log("data",data);
        data.Items.filter((item) => {
            weeklyData = item.weeklyDates;
        });

        // console.log("weeklyData", weeklyData);

        const dailyElectricalWasteParams = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :dailyElectricalData",
            ExpressionAttributeValues: {
                ":dailyElectricalData": `${siteId}_dailyElectricalData_${currentYear}`,
            },
        };

        const dailyElectricalFromDB = dynamoDb.query(dailyElectricalWasteParams);

        dailyElectricalFromDB.promise().then((data) => {
            dailyElectricalData = data.Items;
            // console.log("dailyElectricalData", dailyElectricalData);
            gethourlyWastes(dailyElectricalData);

            let uniqueHourlyWastesWeeklyArray = createUniqueArrayOfObjects(hourlyWastesWeeklyArray);

            hourlyWastesWeeklyArray = uniqueHourlyWastesWeeklyArray;
            // console.log("hourlyWastesWeeklyArray", hourlyWastesWeeklyArray);

            createUniqueArrayOfObjects(hourlyWastesWeeklyArray);

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

            let dailyCoverWasteArrayFormated = [];
            let dailyPrepWasteArrayFormated = [];
            let dailySpoilageWasteArrayFormated = [];

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

            let totalDailyWaste = [];
            for (let i = 0; i < dailyCoverWasteArray.length; i++) {
                let sum =
                    dailyCoverWasteArrayFormated[i] +
                    dailyPrepWasteArrayFormated[i] +
                    dailySpoilageWasteArrayFormated[i];
                totalDailyWaste.push(sum);
            };

            let result = {
                dailyCoverWasteArrayFormated,
                dailyPrepWasteArrayFormated,
                dailySpoilageWasteArrayFormated,
                weeklyData,
                hourlyWastesWeeklyArray,
                totalDailyWaste
            };
            console.log("result", result);

            return callback(null, success(result));

        }).catch((err) => {
            return failure(err);
        });

    }).catch((err) => {
        return failure(err);
    });
};