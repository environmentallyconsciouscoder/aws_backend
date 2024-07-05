import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";

const addUpTheWasteAndTrend = (result) => {
    let allSite = [];

    result.map((data) => {

        data.totalWaste.sites.map((item) => {
            let site = {
              totalWaste: (parseInt(item.coverWaste.toFixed(0)) + parseInt(item.preparationWaste.toFixed(0)) + parseInt(item.spoilageWaste.toFixed(0))),
              siteName: item.siteName,
              trends: parseInt(item.trend.sumTrendCover.toFixed(0)) + parseInt(item.trend.sumTrendPrep.toFixed(0)) + parseInt(item.trend.sumTrendSpoil.toFixed(0)),
              coverWaste: parseInt(item.coverWaste.toFixed(0)),
              prepWaste: parseInt(item.preparationWaste.toFixed(0)),
              spoilageWaste: parseInt(item.spoilageWaste.toFixed(0))
            };
            allSite.push(site);
        });

    });

    console.log("allSite",allSite);
    return allSite;
};

export const main = (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    const id = event.queryStringParameters.id;
    const companyName = event.queryStringParameters.companyName;
    const currentYear = new Date().getFullYear();

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :allSites",
        ExpressionAttributeValues: {
          ":allSites": `allSites_${currentYear}`,
        },
    };
    console.log("params",params);

    const response = dynamoDb.query(params);

    const results = response.promise();
    console.log("results",results);

    results.then((data) => {
        const result = data.Items;
        console.log("result",result);

        const totalWasteAndTrends = addUpTheWasteAndTrend(result);
        console.log("totalWasteAndTrends",totalWasteAndTrends);

        return callback(null,success(totalWasteAndTrends));
    }).catch((err) => {
        return failure(err);
    });
};