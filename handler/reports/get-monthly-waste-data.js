
import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";
import { calculateMontlyChanges } from "../../utils/trends";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const date = new Date();
const monthNumber = date.getMonth();

let id;
let companyName;
let siteId;
let thisYear;
let previousYear;
let currentMonthlyValues = {};

let coverWasteInCurrentMonth = [];
let preparationWasteInCurrentMonth = [];
let spoilageWasteInCurrentMonth = [];
let monthlyChanges = [];

let currentMonthCoverWasteArray = [];
let currentMonthPrepWasteArray = [];
let currentMonthSpoilageWasteArray = [];

let previousMonthCoverWasteArray = [];
let previousMonthPrepWasteArray = [];
let previousMonthSpoilageWasteArray = [];

let coverMonthlyChanges = [];
let prepMonthlyChanges = [];
let spoilageMonthlyChanges = [];

const getTotalMonthlyValue = () => {
    let totalMonthlyValue = [];
    let i;
    if (coverMonthlyChanges !== undefined) {
      for (i = 0; i < 12; i++) {
        let coverWaste = coverMonthlyChanges[i];
        let preparationWaste = prepMonthlyChanges[i];
        let spoliageWaste = spoilageMonthlyChanges[i];
        totalMonthlyValue.push(coverWaste + preparationWaste + spoliageWaste);
      }
    }
    return totalMonthlyValue;
};


const getPrevMonthlyValues = (previousYear) => {
    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :monthlyWasteData",
        ExpressionAttributeValues: {
          ":monthlyWasteData": `${siteId}_monthlyWaste_${previousYear}`,
        },
    };
    // console.log("params",params);
    const response = dynamoDb.query(params).promise();
    return response;
};

const roundedUpNumberAndTurnBackToNumber = (data) => {
    if (data) {
      let changeToNumber = parseFloat(data);
      let roundUp = parseInt(changeToNumber.toFixed(0));
      return parseInt(roundUp);
    };
    if (0) {
      return parseInt(data);
    };
    if ("0") {
      return parseInt(data);
    };
};

// const calculateMontlyChanges = (currentWaste, prevWaste, type) => {
//     for (let i = 0; i <= monthNumber; i++) {
//         if (i === 0) {

//           if (prevWaste[11]) {
//             let differences = roundedUpNumberAndTurnBackToNumber(currentWaste[0] - prevWaste[11]);
//             type.push(differences);
//           } else {
//             let differences = roundedUpNumberAndTurnBackToNumber(currentWaste[0] - 0);
//             type.push(differences);
//           };

//         } else {
//           let differences = roundedUpNumberAndTurnBackToNumber(currentWaste[i] - currentWaste[i - 1]);
//           type.push(differences);
//         };
//     };
// };

const addZerosToMonthlyChangesArray = (type) => {
    let monthlyChangesLength = type.length;
    let numberOfZerosNeeded = 12 - monthlyChangesLength;

    for (let i = 1; i <= numberOfZerosNeeded; i++) {
        type.push(0);
    };
};

const getMonthlyChanges = () => {

    coverMonthlyChanges = calculateMontlyChanges(currentMonthCoverWasteArray, previousMonthCoverWasteArray, monthNumber);
    prepMonthlyChanges = calculateMontlyChanges(currentMonthPrepWasteArray, previousMonthPrepWasteArray, monthNumber);
    spoilageMonthlyChanges = calculateMontlyChanges(currentMonthSpoilageWasteArray, previousMonthSpoilageWasteArray, monthNumber);
    // console.log("prepMonthlyChanges",prepMonthlyChanges)
    // console.log("spoilageMonthlyChanges",spoilageMonthlyChanges)

    // calculateMontlyChanges(currentMonthCoverWasteArray, previousMonthCoverWasteArray, coverMonthlyChanges);
    // calculateMontlyChanges(currentMonthPrepWasteArray, previousMonthPrepWasteArray, prepMonthlyChanges);
    // calculateMontlyChanges(currentMonthSpoilageWasteArray, previousMonthSpoilageWasteArray, spoilageMonthlyChanges);
};

const findCSPofCurrentMonth = () => {
    const date  = new Date();
    const monthNumber = date.getMonth();

    coverWasteInCurrentMonth = currentMonthlyValues.map((data) => {
        // console.log("data",data);
        // console.log("coverWaste",data.monthlyValue.monthly.coverWaste);
        currentMonthCoverWasteArray = data.monthlyValue.monthly.coverWaste.map((data) => {
            return roundedUpNumberAndTurnBackToNumber(data);
        });
        return data.monthlyValue.monthly.coverWaste[monthNumber];
    });

    preparationWasteInCurrentMonth = currentMonthlyValues.map((data) => {
        // console.log("preparationWaste",data.monthlyValue.monthly.preparationWaste);
        currentMonthPrepWasteArray = data.monthlyValue.monthly.preparationWaste.map((data) => {
            return roundedUpNumberAndTurnBackToNumber(data);
        });
        return data.monthlyValue.monthly.preparationWaste[monthNumber];
    });

    spoilageWasteInCurrentMonth = currentMonthlyValues.map((data) => {
        // console.log("spoilageWaste",data.monthlyValue.monthly.spoilageWaste);
        currentMonthSpoilageWasteArray = data.monthlyValue.monthly.spoilageWaste.map((data) => {
            return roundedUpNumberAndTurnBackToNumber(data);
        });
        return data.monthlyValue.monthly.spoilageWaste[monthNumber];
    });
};

const findCSPofPrevMonth = (previousMonthData) => {
    // console.log("previousMonthData",previousMonthData);
    // console.log("previousMonthData.Items",previousMonthData.Items);
    // console.log("previousMonthData.Items.length == 0",previousMonthData.Items.length == 0);

    previousMonthCoverWasteArray = previousMonthData.Items.length == 0 ? [0] : previousMonthData.Items[0].monthlyValue.monthly.coverWaste;
    previousMonthPrepWasteArray = previousMonthData.Items.length == 0  ? [0] : previousMonthData.Items[0].monthlyValue.monthly.preparationWaste;
    previousMonthSpoilageWasteArray = previousMonthData.Items.length == 0 ? [0] : previousMonthData.Items[0].monthlyValue.monthly.spoilageWaste;
    // previousMonthCoverWasteArray = previousMonthData.Items[0].monthlyValue.monthly.coverWaste;
    // previousMonthPrepWasteArray = previousMonthData.Items[0].monthlyValue.monthly.preparationWaste;
    // previousMonthSpoilageWasteArray = previousMonthData.Items[0].monthlyValue.monthly.spoilageWaste;
};

export const main = (event, context, callback) => {

    id = event.queryStringParameters.companyNumber;
    companyName = event.queryStringParameters.companyName;
    siteId = event.queryStringParameters.siteID;
    thisYear = new Date().getFullYear();
    previousYear = thisYear - 1;

    // console.log("id",id);
    // console.log("companyName",companyName);
    // console.log("siteId",siteId);
    // console.log("thisYear",thisYear);

    const params = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :monthlyWasteData",
        ExpressionAttributeValues: {
          ":monthlyWasteData": `${siteId}_monthlyWaste_${thisYear}`,
        },
    };

    // console.log("params",params);

    const response = dynamoDb.query(params);

    response.promise().then((data) => {
        currentMonthlyValues = data.Items;

        // CLEAR CACHE
        coverMonthlyChanges = [];
        prepMonthlyChanges = [];
        spoilageMonthlyChanges = [];

        // console.log("currentMonthlyValues",currentMonthlyValues);

        findCSPofCurrentMonth();

        // console.log("coverWasteInCurrentMonth",coverWasteInCurrentMonth);
        // console.log("preparationWasteInCurrentMonth",preparationWasteInCurrentMonth);
        // console.log("spoilageWasteInCurrentMonth",spoilageWasteInCurrentMonth);

        getPrevMonthlyValues(previousYear).then((data) => {
            // console.log("data",data);
            findCSPofPrevMonth(data);
        }).then(() => {

            getMonthlyChanges();

        }).then(() => {

            addZerosToMonthlyChangesArray(coverMonthlyChanges);
            addZerosToMonthlyChangesArray(prepMonthlyChanges);
            addZerosToMonthlyChangesArray(spoilageMonthlyChanges);

            // console.log("monthlyChanges",monthlyChanges);
            // console.log("coverMonthlyChanges",coverMonthlyChanges);
            // console.log("prepMonthlyChanges",prepMonthlyChanges);
            // console.log("spoilageMonthlyChanges",spoilageMonthlyChanges);
        }).then(() => {

            monthlyChanges = getTotalMonthlyValue();
        }).then(() => {

            if ( currentMonthCoverWasteArray.length == 0 ||
                currentMonthPrepWasteArray.length == 0 ||
                currentMonthSpoilageWasteArray.length == 0 ||
                coverMonthlyChanges.length == 0 ||
                prepMonthlyChanges.length == 0 ||
                spoilageMonthlyChanges.length == 0 ||
                monthlyChanges.length == 0 ||
                coverWasteInCurrentMonth.length == 0 ||
                preparationWasteInCurrentMonth.length == 0 ||
                spoilageWasteInCurrentMonth.length == 0 ) {

                let result = {
                    currentMonthCoverWasteArray: [0,0,0,0,0,0,0,0,0,0,0,0],
                    currentMonthPrepWasteArray: [0,0,0,0,0,0,0,0,0,0,0,0],
                    currentMonthSpoilageWasteArray: [0,0,0,0,0,0,0,0,0,0,0,0],
                    coverMonthlyChanges: [0,0,0,0,0,0,0,0,0,0,0,0],
                    prepMonthlyChanges: [0,0,0,0,0,0,0,0,0,0,0,0],
                    spoilageMonthlyChanges: [0,0,0,0,0,0,0,0,0,0,0,0],
                    monthlyChanges: [0,0,0,0,0,0,0,0,0,0,0,0],
                    coverWasteInCurrentMonth: [0],
                    preparationWasteInCurrentMonth: [0],
                    spoilageWasteInCurrentMonth: [0]
                };

                return callback(null,success(result));

            } else {

                let resultTwo= {
                    currentMonthCoverWasteArray,
                    currentMonthPrepWasteArray,
                    currentMonthSpoilageWasteArray,
                    coverMonthlyChanges,
                    prepMonthlyChanges,
                    spoilageMonthlyChanges,
                    monthlyChanges,
                    coverWasteInCurrentMonth,
                    preparationWasteInCurrentMonth,
                    spoilageWasteInCurrentMonth
                };

                // console.log("resultTwo",resultTwo);

                return callback(null,success(resultTwo));
            }
        });

    }).catch((err) => {
        return failure(err);
    });
};