import AWS from "aws-sdk";
// import { failure, success } from "../../libs/response-lib";
import moment from 'moment';
import { lookForPatterns } from '../../utils/sawtooth';
import { keepDecimalPlacesWithoutRoundingUp, isInt, reducer } from "../../utils/common";

let salesInputData;
let dailyElectricalData;

let salesInputSelected;
let dailyElectricalDataSelected;

let formatedWeeklyDailyWaste = [];
let salesInputIncludingDayOfTheYear = [];

let wastePerSalesForCoverWaste = [];
let wastePerSalesForPreparationWaste = [];
let wastePerSalesForSpoilageWaste = [];
let wastePerSalesForAllWaste = [];

let salesInputDataArray = [];
let salesWasteDataArray = [];
let preparationWasteDataArray = [];
let spoilageWasteDataArray = [];
let totalDailyWasteDataArray = [];

let salesInputDataInCurrentMonth = [];

let xAxis = [];

let totalCW;
let totalSW;
let totalPW;
let totalWaste;
let totalSalesInput;

let percentageOfInputsAreZeros;

let siteName;

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
let monthsName;

const getMonthAsAnumber = (date) => {
    let num = moment(date).format('M');
    return num;
};

const getMaxNumOfAllCSP = () => {


    dailyElectricalDataSelected.map((data) => {

        if (data.coverWaste.length > 0) {
            //  data.coverWaste = parseFloat(Math.max(...data.coverWaste));
            // console.log("data.coverWaste", data.coverWaste);
            let coverWaste = lookForPatterns(data.coverWaste,'cw');
            // console.log("coverWaste", coverWaste);
            data.coverWaste = coverWaste;
        }

        if (data.preparationWaste.length > 0) {
            // data.preparationWaste = parseFloat(Math.max(...data.preparationWaste));
            let preparationWaste = lookForPatterns(data.preparationWaste,'pw');
            data.preparationWaste = preparationWaste;
        };

        if (data.spoilageWaste.length > 0) {
            // data.spoilageWaste = parseFloat(Math.max(...data.spoilageWaste));
            let spoilageWaste = lookForPatterns(data.spoilageWaste,'sw');
            data.spoilageWaste = spoilageWaste;
        };
    });
};

const getTotalCSP = () => {
    dailyElectricalDataSelected.map((data) => {

        let coverWaste = data.coverWaste;
        let preparationWaste = data.preparationWaste;
        let spoilageWaste = data.spoilageWaste;
        let totalDailyWaste = coverWaste + preparationWaste + spoilageWaste;
        let date = data.Date;
        let dayOfYear = data.dayOfYear;

        formatedWeeklyDailyWaste.push({
            coverWaste,
            preparationWaste,
            spoilageWaste,
            totalDailyWaste,
            date,
            dayOfYear
        });
      });
};

const daysIntoYear = (date) => {
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
};

const addSevenMoredays = (data) => {
    const day = new Date(data);
    const newDate = moment(day).add(7,'days').format('YYYY-MM-DD');
    return newDate;
};

const getsalesInputIncludingDayOfTheYear = () => {
    salesInputSelected.map((data) => {
        let dayOfTheYear = daysIntoYear(new Date(data.Date));
        let endDate = addSevenMoredays(data.Date);
        const dayOfTheYearForEndDate = daysIntoYear(new Date(endDate));
        const salesInput = data;

        salesInputIncludingDayOfTheYear.push({
          dayOfTheYear,
          Date,
          salesInput,
          dayOfTheYearForEndDate
        });
    });
};

const getWastePerSales = () => {
    salesInputIncludingDayOfTheYear.map((data) => {

        let dayOfTheYear = data.dayOfTheYear;
        let dayOfTheYearForEndDate = data.dayOfTheYearForEndDate;

        for (let i = dayOfTheYear; i < dayOfTheYearForEndDate; i++) {
          formatedWeeklyDailyWaste.map((item) => {

           if (item.dayOfYear == i) {
            let salesInputIndex = i - dayOfTheYear;

            let salesInputData = data.salesInput.salesInput[salesInputIndex];

            let convertSalesInputToNumber = parseInt(salesInputData);
            salesInputDataInCurrentMonth.push(convertSalesInputToNumber);
            // salesInputDataInCurrentMonth.push(salesInputData);

            let date = new Date(item.date);
            xAxis.push(date.getDate());

            //CoverWaste
            let salesWasteData = item.coverWaste;
            // let wastePerSalesForCW = salesInputData == 0 ? 0 : (salesWasteData / salesInputData).toFixed(2);
            // let wastePerSalesForCW = salesInputData == 0 ? 0 : keepThreeDecimalPlacesWithoutRoundingUp(salesWasteData / salesInputData);

            let wastePerSalesForCW = salesInputData == 0 ? 0 : isInt(salesWasteData / salesInputData) ? (salesWasteData / salesInputData) :
            keepDecimalPlacesWithoutRoundingUp((salesWasteData / salesInputData), 3);

            let numForCw = parseFloat(wastePerSalesForCW);
            wastePerSalesForCoverWaste.push(numForCw);

            // console.log("salesInputData",salesInputData);
            // console.log("salesWasteData",salesWasteData);
            // console.log("salesWasteData / salesInputData",salesWasteData / salesInputData);
            // console.log("isInt(salesWasteData / salesInputData) ",isInt(salesWasteData / salesInputData) );
            // console.log("salesInputData === 0",salesInputData === 0);


            //preparationWaste
            let preparationWasteData = item.preparationWaste;
            // let wastePerSalesForPW = salesInputData == 0 ? 0 : (preparationWasteData / salesInputData).toFixed(2);
            // let wastePerSalesForPW = salesInputData == 0 ? 0 : keepThreeDecimalPlacesWithoutRoundingUp(preparationWasteData / salesInputData);

            let wastePerSalesForPW = salesInputData == 0 ? 0 : isInt(preparationWasteData / salesInputData) ? (preparationWasteData / salesInputData) :
            keepDecimalPlacesWithoutRoundingUp((preparationWasteData / salesInputData), 3);

            let numForPw = parseFloat(wastePerSalesForPW);
            wastePerSalesForPreparationWaste.push(numForPw);

            //spoilageWaste
            let spoilageWasteData = item.spoilageWaste;
            // let WastePerSalesForSW = salesInputData == 0 ? 0 : (spoilageWasteData / salesInputData).toFixed(2);
            // let WastePerSalesForSW = salesInputData == 0 ? 0 : keepThreeDecimalPlacesWithoutRoundingUp(spoilageWasteData / salesInputData);

            let WastePerSalesForSW = salesInputData == 0 ? 0 : isInt(spoilageWasteData / salesInputData) ? (spoilageWasteData / salesInputData) :
            keepDecimalPlacesWithoutRoundingUp((spoilageWasteData / salesInputData), 3);

            let numForSw = parseFloat(WastePerSalesForSW);
            wastePerSalesForSpoilageWaste.push(numForSw);

            //allWaste totalDailyWaste
            let totalDailyWasteData = item.totalDailyWaste;
            // let wastePerSalesForAllWasteData = salesInputData == 0 ? 0 : keepThreeDecimalPlacesWithoutRoundingUp(totalDailyWasteData / salesInputData);

            let wastePerSalesForAllWasteData = salesInputData == 0 ? 0 : isInt(totalDailyWasteData / salesInputData) ? (totalDailyWasteData / salesInputData) :
            keepDecimalPlacesWithoutRoundingUp((totalDailyWasteData / salesInputData), 3);

            let numForTw = parseFloat(wastePerSalesForAllWasteData);
            wastePerSalesForAllWaste.push(numForTw);


            salesInputDataArray.push(salesInputData);
            salesWasteDataArray.push(salesWasteData);
            preparationWasteDataArray.push(preparationWasteData);
            spoilageWasteDataArray.push(spoilageWasteData);
            totalDailyWasteDataArray.push(totalDailyWasteData);

           };
          });
        };
    });
};

const getSumOfTotalWasteAndCSP = () => {
    let sumOfCoverWaste = [];
    let sumOfSpoilageWaste = [];
    let sumOfPrepWaste = [];
    let sumOfTotalWaste = [];

    const reducer = (accumulator, currentValue) => accumulator + currentValue;

    formatedWeeklyDailyWaste.map((data) => {
        sumOfCoverWaste.push(data.coverWaste);
        sumOfSpoilageWaste.push(data.spoilageWaste);
        sumOfPrepWaste.push(data.preparationWaste);
        sumOfTotalWaste.push(data.totalDailyWaste);
    });

    let coverWaste = sumOfCoverWaste.length > 0 ?  sumOfCoverWaste: [0];
    let spoilageWaste = sumOfSpoilageWaste.length > 0 ? sumOfSpoilageWaste: [0];
    let prepWaste = sumOfPrepWaste.length > 0 ? sumOfPrepWaste: [0];
    let allWaste = sumOfTotalWaste.length > 0 ? sumOfTotalWaste: [0];

    totalCW = coverWaste.reduce(reducer);
    totalSW = spoilageWaste.reduce(reducer);
    totalPW = prepWaste.reduce(reducer);
    totalWaste = allWaste.reduce(reducer);

    // totalCW = sumOfCoverWaste.reduce(reducer);
    // totalSW = sumOfSpoilageWaste.reduce(reducer);
    // totalPW = sumOfPrepWaste.reduce(reducer);
    // totalWaste = sumOfTotalWaste.reduce(reducer);
};

const getSumOfSalesInput = () => {
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    // totalSalesInput = salesInputDataInCurrentMonth.reduce(reducer);

    let totalSalesInputDataInCurrentMonth = salesInputDataInCurrentMonth.length > 0 ? salesInputDataInCurrentMonth : [0];
    totalSalesInput = totalSalesInputDataInCurrentMonth.reduce(reducer);

    // totalSalesInput = salesInputDataInCurrentMonth.reduce(reducer);
};

const getSalesInputPercentage = () => {
   const totalSalesInputData = salesInputDataInCurrentMonth.length;
   const stripOutallZeros = salesInputDataInCurrentMonth.filter((data) => {
       return data !== 0;
   });
   const totalZeros = totalSalesInputData - stripOutallZeros.length;
//    console.log("totalZeros",totalZeros);
//    console.log("totalSalesInputData",totalSalesInputData);
   percentageOfInputsAreZeros = parseInt((totalZeros / totalSalesInputData) * 100);
};

const calculateTheRemainingCovers = (monthNum) => {
    let totalNumberOfItemsInCurrentMonth = xAxis.length;

    let totalItems = [];
    salesInputSelected.map((data) => {
        totalItems.push(data.salesInput.length);
    });
    // const totalNumberOfItemsInCurrentMonthCoverInputs = totalItems.reduce(reducer);
    const totalNumberOfItemsInCurrentMonthSalesInputs = totalItems.length === 0 ? totalNumberOfItemsInCurrentMonth : totalItems.reduce(reducer);

    const totalValueBelongToNextMonth = totalNumberOfItemsInCurrentMonthSalesInputs - totalNumberOfItemsInCurrentMonth;

    console.log("totalValueBelongToNextMonth",totalValueBelongToNextMonth);

    if (totalValueBelongToNextMonth !== 0) {
        const lastElementIndex = salesInputSelected.length - 1;
        const salesInputForLastWeekOfMonth = salesInputSelected[lastElementIndex].salesInput;
        const reverseArr = salesInputForLastWeekOfMonth.reverse();
        // const totalVal = coverInputForLastWeekOfMonth.length;
        // const thisMonthVal = totalVal - nextMonthVal;
        const earlyNextMonthCoverInputs = [];

        for (let i = 0; i <= totalValueBelongToNextMonth - 1; i++) {
            earlyNextMonthCoverInputs.push(reverseArr[i]);
        };

        const nextMonthWasteValues = dailyElectricalData.map((data) => {
            return data.dayOfTheYear.filter((item) => {
                var d = new Date(item.Date);
                var n = d.getMonth() + 1;
                const followingMonth = parseInt(monthNum) + 1;
                return n === followingMonth;
            });
        });

        const dailyElectricalDataForNextMonth = [];

        for (let i = 0; i <= totalValueBelongToNextMonth - 1; i++) {
            // console.log("i",i);
            // console.log("nextMonthWasteValues[i]",nextMonthWasteValues[i]);
            dailyElectricalDataForNextMonth.push(nextMonthWasteValues[0][i]);
        };

        const removeUndefinedValues = dailyElectricalDataForNextMonth.filter((data) => { return data !== undefined; });

        removeUndefinedValues.map((data) => {
            if (data.coverWaste.length > 0) {
                let coverWaste = lookForPatterns(data.coverWaste, 'cw');
                data.coverWaste = coverWaste;
            }

            if (data.preparationWaste.length > 0) {
                let preparationWaste = lookForPatterns(data.preparationWaste, 'pw');
                data.preparationWaste = preparationWaste;
            };

            if (data.spoilageWaste.length > 0) {
                let spoilageWaste = lookForPatterns(data.spoilageWaste, 'sw');
                data.spoilageWaste = spoilageWaste;
            };
        });

        const coverInputsArr = earlyNextMonthCoverInputs.reverse();

        let coverWasteArr = [];
        let spoilageWasteArr = [];
        let prepWasteArr = [];
        let allWasteArr = [];

        let coverWasteArrPerCover = [];
        let spoilageWasteArrPerCover = [];
        let prepWasteArrPerCover = [];
        let allWastePerCoverArr = [];

        for (let i = 0; i < removeUndefinedValues.length; i++) {
            // console.log("i",i);
            // console.log("removeUndefinedValues",removeUndefinedValues[i]);
            // console.log("coverInputsArr",coverInputsArr[i]);
            // keepDecimalPlacesWithoutRoundingUp((totalDailyWasteData / coverInputData), 2);

            const coverWastePerCover = coverInputsArr[i] !== 0 ? removeUndefinedValues[i].coverWaste / coverInputsArr[i] : 0;
            const preparationWastePerCover = coverInputsArr[i] !== 0 ? removeUndefinedValues[i].preparationWaste / coverInputsArr[i] : 0;
            const spoilageWastePerCover = coverInputsArr[i] !== 0 ? removeUndefinedValues[i].spoilageWaste / coverInputsArr[i] : 0;
            const allWastePerCover = coverWastePerCover + preparationWastePerCover + spoilageWastePerCover;

            coverWasteArrPerCover.push(keepDecimalPlacesWithoutRoundingUp((coverWastePerCover), 2));
            spoilageWasteArrPerCover.push(keepDecimalPlacesWithoutRoundingUp((preparationWastePerCover), 2));
            prepWasteArrPerCover.push(keepDecimalPlacesWithoutRoundingUp((spoilageWastePerCover), 2));
            allWastePerCoverArr.push(keepDecimalPlacesWithoutRoundingUp((allWastePerCover), 2));

            coverWasteArr.push(removeUndefinedValues[i].coverWaste.toFixed(0));
            spoilageWasteArr.push(removeUndefinedValues[i].spoilageWaste.toFixed(0));
            prepWasteArr.push(removeUndefinedValues[i].preparationWaste.toFixed(0));
            const allWaste = removeUndefinedValues[i].coverWaste + removeUndefinedValues[i].spoilageWaste + removeUndefinedValues[i].preparationWaste;
            allWasteArr.push(allWaste.toFixed(0));
        };

        // console.log("coverWasteArr",coverWasteArr);
        // console.log("spoilageWasteArr",spoilageWasteArr);
        // console.log("prepWasteArr",prepWasteArr);
        // console.log("allWasteArr",allWasteArr);
        // console.log("coverInputsArr",coverInputsArr);

        // console.log("coverWasteArrPerCover",coverWasteArrPerCover);
        // console.log("spoilageWasteArrPerCover",spoilageWasteArrPerCover);
        // console.log("prepWasteArrPerCover",prepWasteArrPerCover);
        // console.log("allWasteArrPerCover",allWasteArrPerCover);
        const data = [{
            coverWasteArr: coverWasteArr,
            spoilageWasteArr: spoilageWasteArr,
            prepWasteArr: prepWasteArr,
            allWasteArr: allWasteArr,
            coverInputsArr: coverInputsArr,
            coverWasteArrPerCover: coverWasteArrPerCover,
            spoilageWasteArrPerCover: spoilageWasteArrPerCover,
            prepWasteArrPerCover: prepWasteArrPerCover,
            allWasteArrPerCover: allWastePerCoverArr
        }];

        return data;
    }

};

export const wastePerSales = async (event, context, callback) => {

    // sawToothArrayForCw = [];
    // normalArrayForCw = [];
    // sawToothArrayForPw = [];
    // normalArrayForPw = [];
    // sawToothArrayForSw = [];
    // normalArrayForSw = [];

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";
    // let monthNum = "3";

    const dataFromFrontEnd = event.queryStringParameters;
    let id = dataFromFrontEnd.id;
    let companyName = dataFromFrontEnd.company;
    let siteId = dataFromFrontEnd.site;
    let currentYear = new Date().getFullYear();
    let monthNum = dataFromFrontEnd.month;

    siteName = siteId.replace(/[^A-Za-z]+/g, '').toLowerCase();

    monthsName = months[monthNum - 1];

    const paramsForCoverInput = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :weeklySalesInput",
        ExpressionAttributeValues: {
          ":weeklySalesInput": `${siteId}_weeklySalesInput_${currentYear}`,
        },
        ProjectionExpression: `siteName, weeklySales`,
    };

    const response = dynamoDb.query(paramsForCoverInput);

    response.promise().then((data) => {
        salesInputData = data.Items;
        // console.log("covers input data",salesInputData);

        salesInputData.map((data) => {
            salesInputSelected = data.weeklySales.filter((item) => {
                return getMonthAsAnumber(item.Date) === monthNum;
            });
        });

        // console.log("salesInputSelected",salesInputSelected);

        const paramsForDailyElectricalData = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :dailyElectricalData",
            ExpressionAttributeValues: {
              ":dailyElectricalData": `${siteId}_dailyElectricalData_${currentYear}`,
            },
            ProjectionExpression: `siteName, dayOfTheYear`,
        };

        const response = dynamoDb.query(paramsForDailyElectricalData);

        response.promise().then((data) => {
            dailyElectricalData = data.Items;
            // console.log("daily electrical data",dailyElectricalData);

            dailyElectricalData.map((data) => {
                dailyElectricalDataSelected = data.dayOfTheYear.filter((item) => {
                    return getMonthAsAnumber(item.Date) === monthNum;
                });
            });
            // console.log("dailyElectricalDataSelected",dailyElectricalDataSelected);

            //REMOVE CACHE
            formatedWeeklyDailyWaste = [];
            salesInputIncludingDayOfTheYear = [];
            wastePerSalesForCoverWaste= [];
            wastePerSalesForPreparationWaste = [];
            wastePerSalesForSpoilageWaste = [];
            wastePerSalesForAllWaste = [];
            salesInputDataInCurrentMonth = [];
            xAxis = [];

            salesInputDataArray = [];
            salesWasteDataArray = [];
            preparationWasteDataArray = [];
            spoilageWasteDataArray = [];
            totalDailyWasteDataArray = [];

            getMaxNumOfAllCSP();

            getTotalCSP();

            getsalesInputIncludingDayOfTheYear();

            getWastePerSales();

            getSumOfTotalWasteAndCSP();

            getSumOfSalesInput();

            getSalesInputPercentage();

            // console.log("formatedWeeklyDailyWaste",formatedWeeklyDailyWaste);

            const nextMonthData = calculateTheRemainingCovers(monthNum);
            console.log("nextMonthData",nextMonthData);

            if (nextMonthData !== undefined) {
                console.log("nextMonthData",nextMonthData);

                nextMonthData.map((data) => {
                    for (let i = 0; i < data.allWasteArr.length; i++) {
                        salesWasteDataArray.push(data.coverWasteArr[i]);
                        spoilageWasteDataArray.push(data.spoilageWasteArr[i]);
                        preparationWasteDataArray.push(data.prepWasteArr[i]);
                        totalDailyWasteDataArray.push(data.allWasteArr[i]);

                        salesInputDataArray.push(data.coverInputsArr[i]);

                        wastePerSalesForCoverWaste.push(data.coverWasteArrPerCover[i]);
                        wastePerSalesForSpoilageWaste.push(data.spoilageWasteArrPerCover[i]);
                        wastePerSalesForPreparationWaste.push(data.prepWasteArrPerCover[i]);
                        wastePerSalesForAllWaste.push(data.allWasteArrPerCover[i]);

                        xAxis.push(i + 1);
                    };
                });

            };

            const wastePerSales = {
                wastePerSalesForCoverWaste: wastePerSalesForCoverWaste,
                wastePerSalesForPreparationWaste: wastePerSalesForPreparationWaste,
                wastePerSalesForSpoilageWaste: wastePerSalesForSpoilageWaste,
                wastePerSalesForAllWaste: wastePerSalesForAllWaste,
                totalCW: totalCW.toFixed(0),
                totalSW: totalSW.toFixed(0),
                totalPW: totalPW.toFixed(0),
                totalWaste: totalWaste.toFixed(0),
                totalSalesInput: totalSalesInput,
                percentageOfInputsAreZeros: percentageOfInputsAreZeros,
                xAxis: xAxis,
                monthsName: monthsName,
                siteName,
                salesInputDataArray,
                salesWasteDataArray,
                preparationWasteDataArray,
                spoilageWasteDataArray,
                totalDailyWasteDataArray
            };

            return wastePerSales;

            // console.log("wastePerSales",wastePerSales);

            // console.log("formatedWeeklyDailyWaste",formatedWeeklyDailyWaste);

            // return callback(null,success(wastePerSales));
        });

    }).catch((err) => {
        // return failure(err);
    });
};