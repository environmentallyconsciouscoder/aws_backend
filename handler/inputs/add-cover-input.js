import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";
import moment from 'moment';

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // const formatedDate = moment().format('MM-DD-YYYY');
    // const weeknumber = moment(formatedDate, "MMDDYYYY").isoWeek(); //1-52
    // const coversInput = JSON.parse(event.body);

    const dataFromFrontEnd = JSON.parse(event.body);

    console.log("dataFromFrontEnd",dataFromFrontEnd);

    const coversInput = dataFromFrontEnd.covers;

    const id = dataFromFrontEnd.companyId;
    const companyName = dataFromFrontEnd.companyName;
    const siteId = dataFromFrontEnd.siteName;
    const currentYear = new Date().getFullYear();

    const date = dataFromFrontEnd.firstDateOfTheWeek;
    const weekOfYear = dataFromFrontEnd.weekOfYear;

    const checkBox = dataFromFrontEnd.checkBox;

    const convertAllCoverInputsToNumber = coversInput.map((num) => {
        return parseInt(num);
    });

    let weeklyCoversArray = [];

    // const specificDay = moment().day('Monday');
    // console.log("specificDay",specificDay);
    const today = moment().day();
    let specificDay;

    if (today == 0) {
        specificDay = moment().day(-6);
    } else {
        specificDay = moment().day('Monday');
    };

    console.log("specificDay",specificDay);

    // const specificDayFormated = specificDay.format('YYYY-MM-DD');

    // let coversInputArray = [{
    //     coversInput: convertAllCoverInputsToNumber,
    //     Date: specificDayFormated,
    //     weekOfYear: weeknumber.toString()
    // }];

    let coversInputArray = [{
        coversInput: convertAllCoverInputsToNumber,
        Date: date,
        weekOfYear: weekOfYear,
        checkBox: checkBox
    }];

    console.log("coversInputArray",coversInputArray);

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :coverInput",
        ExpressionAttributeValues: {
          ":coverInput": `${siteId}_weeklyCoversInput_${currentYear}`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        weeklyCoversArray = data.Items;

        let newArray = [];

        weeklyCoversArray.map((data) => {
            data.weeklyCovers.map((item) => {
                coversInputArray.find((cover) => {
                    if (cover.weekOfYear == item.weekOfYear) {
                        newArray.push(cover);
                    } else {
                        newArray.push(item);
                    };
                });
            });
        });

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_weeklyCoversInput_${currentYear}`,
            },
            UpdateExpression: `set weeklyCovers = :weeklyCovers`,
            ExpressionAttributeValues: {
              ":weeklyCovers": newArray
            },
          };

        //   console.log("newArray",newArray);
        //   console.log("updateParams",updateParams);

        const res = dynamoDb.update(updateParams);
        res.promise().then((data) => {
            // console.log("data",data);
            return callback(null,success(data));
        });

    }).catch((err) => {
        return failure(err);
    });
};
