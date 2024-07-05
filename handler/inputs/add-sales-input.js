import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";
import moment from 'moment';

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // const formatedDate = moment().format('MM-DD-YYYY');
    // const weeknumber = moment(formatedDate, "MMDDYYYY").isoWeek(); //1-52
    // const salesInput = JSON.parse(event.body);

    const dataFromFrontEnd = JSON.parse(event.body);

    console.log("dataFromFrontEnd",dataFromFrontEnd);

    const salesInput = dataFromFrontEnd.covers;

    const id = dataFromFrontEnd.companyId;
    const companyName = dataFromFrontEnd.companyName;
    const siteId = dataFromFrontEnd.siteName;
    const currentYear = new Date().getFullYear();

    const date = dataFromFrontEnd.firstDateOfTheWeek;
    const weekOfYear = dataFromFrontEnd.weekOfYear;

    let weeklySalesArray = [];

    // const specificDay = moment().day('Monday');
    const today = moment().day();
    let specificDay;

    if (today == 0) {
        specificDay = moment().day(-6);
    } else {
        specificDay = moment().day('Monday');
    };

    console.log("specificDay",specificDay);

    // const specificDayFormated = specificDay.format('YYYY-MM-DD');

    let salesInputArray = [{
        salesInput: salesInput,
        Date: date,
        weekOfYear: weekOfYear
    }];

    // let salesInputArray = [{
    //     salesInput: salesInput,
    //     Date: "2021-08-16",
    //     weekOfYear: "33"
    // }];

    console.log("salesInputArray",salesInputArray);

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :salesInput",
        ExpressionAttributeValues: {
          ":salesInput": `${siteId}_weeklySalesInput_${currentYear}`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        weeklySalesArray = data.Items;

        let newArray = [];

        weeklySalesArray.map((data) => {
            data.weeklySales.map((item) => {
                salesInputArray.find((sale) => {
                    if (sale.weekOfYear == item.weekOfYear) {
                        newArray.push(sale);
                    } else {
                        newArray.push(item);
                    };
                });
            });
        });

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_weeklySalesInput_${currentYear}`,
            },
            UpdateExpression: `set weeklySales = :weeklySales`,
            ExpressionAttributeValues: {
              ":weeklySales": newArray
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
