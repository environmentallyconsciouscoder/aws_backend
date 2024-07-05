import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // let companyId = "1000";
    // let companyname = "falmouthUniversity";
    // let siteID = "1_STANNARY";
    // let currentYear = "2021";

    const dataFromFrontEnd = event.queryStringParameters;

    const companyId = dataFromFrontEnd.id;
    const companyname = dataFromFrontEnd.company;
    const siteID = dataFromFrontEnd.site;
    const currentYear = new Date().getFullYear();

    const params = {
        TableName: `${companyId}_${companyname}_allReports`,
        KeyConditionExpression: "site = :aiPredictionData",
        ExpressionAttributeValues: {
          ":aiPredictionData": `${siteID}_aiPrediction_${currentYear}`,
        },
    };

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        // console.log("data",data);
        // console.log("data.Items",data.Items);
        // console.log("data.Items.length",data.Items.length);

        if (data.Items.length > 0) {

            const result = data.Items;
            return callback(null,success(result));

        } else {

            const resultTwo =
            [
                {
                  aiPrediction:
                    {
                        siteName: 'noSite',
                        weeklylyForcastsBasedOnCurrentMonth: {
                          coverWaste: [],
                          preparationWaste: [],
                          spoilageWaste: []
                        },
                        dailyForcastsBasedOnCurrentMonth: {
                          coverWaste: [],
                          preparationWaste: [],
                          spoilageWaste: []
                        },
                        yearlyForcastsBasedOnCurrentMonth: {
                          coverWaste: [],
                          preparationWaste: [],
                          spoilageWaste: []
                        },
                        monthlyForcastsBasedOnCurrentMonth: {
                          coverWaste: [],
                          preparationWaste: [],
                          spoilageWaste: []
                        },
                    },
                  site: 'noSite'
                }
            ];
            return callback(null,success(resultTwo));

        }

    }).catch((err) => {
        return failure(err);
    });
};