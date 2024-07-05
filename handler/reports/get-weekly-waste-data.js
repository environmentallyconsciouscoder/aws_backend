import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";
import { calculateWeeklyTrends } from "../../utils/trends";
import { getCurrentWeek } from '../../utils/common';

import moment from 'moment';

const dynamoDb = new AWS.DynamoDB.DocumentClient();

let id;
let companyName;
let siteId;
let currentYear;

let weeklyWasteTrend = [
    {
        totalWaste: 0,
        coverWaste: 0,
        prepWaste: 0,
        spoilageWaste: 0,
    }
];

let currentWeeklyWasteValues = [];
let lastWeekWasteValues = [];
let currentWeeklyValues;

const getCurrentWeeklyValues = (allWeeklyValues) => {
    const currentDate = new Date();
    const formatedDate = moment(currentDate).format('MM-DD-YYYY');
    const weekNumber = moment(formatedDate, "MMDDYYYY").isoWeek();

    let currentWeeklyValues = allWeeklyValues.map((data) => {
        const currentWeekWaste = data.weeklyWasteSum.filter((waste) => {
            return waste.weekOfYear == weekNumber;
        });
        return currentWeekWaste;
    });

    return currentWeeklyValues;
};

const getLastYearWeeklyWaste = () => {
    const previousYear = currentYear - 1;
    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :weeklyWasteData",
        ExpressionAttributeValues: {
          ":weeklyWasteData": `${siteId}_weeklyWaste_${previousYear}`,
        },
    };
    // console.log("params",params);
    const response = dynamoDb.query(params);
    return response;
};

export const main = (event, context, callback) => {

    id = event.queryStringParameters.companyNumber;
    companyName = event.queryStringParameters.companyName;
    siteId = event.queryStringParameters.siteID;
    currentYear = new Date().getFullYear();

    // console.log("id",id);
    // console.log("companyName",companyName);
    // console.log("siteId",siteId);
    // console.log("thisYear",thisYear);
    // id = "1000";
    // companyName = "falmouthUniversity";
    // siteId = "1_STANNARY";

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :weeklyWasteData",
        ExpressionAttributeValues: {
          ":weeklyWasteData": `${siteId}_weeklyWaste_${currentYear}`,
        },
    };

    // console.log("params",params);

    const response = dynamoDb.query(params);

    //REMOVE CACHE
    weeklyWasteTrend = [
        {
            totalWaste: 0,
            coverWaste: 0,
            prepWaste: 0,
            spoilageWaste: 0,
        }
    ];
    currentWeeklyWasteValues = [];
    lastWeekWasteValues = [];

    response.promise().then((data) => {

        const allWeeklyValues = data.Items;
        currentWeeklyValues = getCurrentWeeklyValues(allWeeklyValues);
        // console.log("currentWeeklyValues",currentWeeklyValues);
        // console.log("allWeeklyValues",allWeeklyValues);

        currentWeeklyValues.map((data) => {

            // console.log("data.length",data.length);
            // console.log("data.length === 0",data.length === 0);

            if (data.length === 0) {
                //the current week do not exisits in the database

                currentWeeklyValues = [[{
                    "coverWaste": [
                      0
                    ],
                    "preparationWaste": [
                      0
                    ],
                    "spoilageWaste": [
                      0
                    ],
                }]];

                lastWeekWasteValues.push(
                    {
                    data:
                    {"coverWaste": [
                    0
                    ],
                    "preparationWaste": [
                    0
                    ],
                    "spoilageWaste": [
                    0
                    ]}
                });

                weeklyWasteTrend = [{
                    totalWaste: 0,
                    coverWaste: 0,
                    prepWaste: 0,
                    spoilageWaste: 0,
                }];

                const result = {
                    currentWeeklyValues,
                    weeklyWasteTrend,
                    lastWeekWasteValues
                };
                return callback(null,success(result));
            };
        });

        allWeeklyValues.map((data) => {
            const replaceUnderScoreWithSpace = data.site.replace(/[_]+/g, ' ');
            const currentYear = new Date().getFullYear();
            const checkCurrentYearExists = replaceUnderScoreWithSpace.includes(currentYear);

            // console.log("checkCurrentYearExists",checkCurrentYearExists);
            if (checkCurrentYearExists) {
                // let formatedDate = moment().format('MM-DD-YYYY');
                // let weeknumber = moment(formatedDate, "MMDDYYYY").isoWeek();
                let weeknumber = getCurrentWeek();
                // console.log("weeknumber",weeknumber);
                // console.log("getCurrentWeek",getCurrentWeek());

                // let weekNumberIndex = weeknumber - 1;
                // let weekNumberIndex = 0;

                //get values of that week
                const currentWeekData = data.weeklyWasteSum.filter((data) => {
                    return data.weekOfYear == weeknumber;
                });
                // console.log("testing currentWeekData",currentWeekData);

                // currentWeeklyWasteValues.push({data: data.weeklyWasteSum[weekNumberIndex]});
                currentWeeklyWasteValues.push({data: currentWeekData[0]});
                // console.log("weekNumberIndex",weekNumberIndex);
                // console.log("weekNumberIndex == 0",weekNumberIndex == 0);

                // console.log("allWeeklyValues",allWeeklyValues);
                // console.log("weekNumberIndex",weekNumberIndex);
                // console.log("weekNumberIndex == 0",weekNumberIndex == 0);

                // const numberOfWeeks = allWeeklyValues.length - 1;
                const numberOfWeeks = allWeeklyValues[0].weeklyWasteSum.length - 1;
                // console.log("numberOfWeeks",numberOfWeeks);

                    //first week of the year
                // if (weekNumberIndex == 0) {
                if (numberOfWeeks == 0) {

                    getLastYearWeeklyWaste().promise().then((data) => {

                        // console.log("data.Items.length == 0",data.Items.length == 0);
                        // console.log("currentWeeklyWasteValues",currentWeeklyWasteValues);

                        if (data.Items.length == 0) {
                            lastWeekWasteValues.push(
                                {
                                data:
                                {"coverWaste": [
                                0
                                ],
                                "preparationWaste": [
                                0
                                ],
                                "spoilageWaste": [
                                0
                                ]}
                            });
                        } else {
                        //get last week from previous year
                            if(data.weeklyWasteSum[53] !== undefined) {
                                lastWeekWasteValues.push({
                                    data: data.weeklyWasteSum[53],
                                });
                            } else {
                                lastWeekWasteValues.push({
                                    data: data.weeklyWasteSum[52],
                                });
                            };
                        };

                        // console.log("lastWeekWasteValues",lastWeekWasteValues);
                        // console.log("currentWeeklyWasteValues",currentWeeklyWasteValues);

                        weeklyWasteTrend = calculateWeeklyTrends(currentWeeklyWasteValues, lastWeekWasteValues);

                        // console.log("weeklyWasteTrend",weeklyWasteTrend);

                        const result = {
                            currentWeeklyValues,
                            weeklyWasteTrend,
                            lastWeekWasteValues
                        };

                        // console.log("result",result);

                        return callback(null,success(result));

                    }).catch((err) => {
                        console.log("err",err);
                    });

                } else {

                    const lastWeekNumber = weeknumber - 1;
                    const lastWeekData = data.weeklyWasteSum.filter((data) => {
                        return data.weekOfYear == lastWeekNumber;
                    });
                    // console.log("lastWeekData",lastWeekData);

                    //not first week of the year
                    // lastWeekWasteValues.push({data: lastWeekData[0]});

                    lastWeekWasteValues.push(
                        {
                            data:
                            {"coverWaste": [
                            0
                            ],
                            "preparationWaste": [
                            0
                            ],
                            "spoilageWaste": [
                            0
                            ]}
                        }
                    );
                    // {
                    //     totalWaste: 0,
                    //     coverWaste: 0,
                    //     prepWaste: 0,
                    //     spoilageWaste: 0,
                    // }

                    //ONLY CALCULATE WEEKLY TREND IF LAST WEEK EXISITS
                    if (lastWeekData.length > 0) {
                        weeklyWasteTrend = calculateWeeklyTrends(currentWeeklyWasteValues, lastWeekWasteValues);
                    };

                    // console.log("currentWeeklyValues",currentWeeklyValues);
                    // console.log("lastWeekWasteValues",lastWeekWasteValues);

                    const result = {
                        currentWeeklyValues,
                        weeklyWasteTrend,
                        lastWeekWasteValues
                    };
                    // console.log("result",result);

                    return callback(null,success(result));
                };
            };
        });

    }).catch((err) => {
        return failure(err);
    });
};