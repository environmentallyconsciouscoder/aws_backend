import { success, failure } from "../../libs/response-lib";
import AWS from "aws-sdk";

export const main = (event, context, callback) => {

  const dynamoDb = new AWS.DynamoDB.DocumentClient();

  const dataFromFrontEnd = event.queryStringParameters;

  // const companyId = "1000";
  // const companyname = "falmouthUniversity";
  // const siteID = "1_STANNARY";

  const companyId = dataFromFrontEnd.id;
  const companyname = dataFromFrontEnd.company;
  const siteID = dataFromFrontEnd.site;

  const params = {
    TableName: `${companyId}_${companyname}_allReports`,
    KeyConditionExpression: "site = :recommendedTargets",
    ExpressionAttributeValues: {
      ":recommendedTargets": `${siteID}_recommendedTargets`
    },
  };

  // console.log("params",params);

  const response = dynamoDb.query(params);

  // console.log("response",response);

  response.promise().then((data) => {

    // console.log("data.Items.length",data.Items.length);
    let results;

    if (data.Items.length > 0) {
      results = data;
    } else {
      results = {
        Items: [
          {
          "recommendedTargets": {
            "companyId": "",
            "companyname": "",
            "siteID": "",
            "targets": {
              "coverBreakDown": 0,
              "percents": "",
              "percentSavingsInAday": 0,
              "percentSavingsInAmonth": 0,
              "percentSavingsInAweek": 0,
              "percentSavingsInAyear": 0,
              "prepBreakDown": 0,
              "recommendTarget": 0,
              "spoilageBreakDown": 0,
              "totalCSPforPreviousMonth": 0,
              "totalPercentagedSavingsTotal": 0,
              "yearlyKilosOfCO2saved": 0,
              "yearlyMealsSaved": 0
            }
          },
          "site": "noSite_recommendedTargets"
          }
        ]
      };
    };

    return callback(null,success(results));
  }).catch((err) => {
    console.log("err",err);
    return failure(err);
  });

};

