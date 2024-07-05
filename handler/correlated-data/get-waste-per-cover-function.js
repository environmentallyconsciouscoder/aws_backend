import AWS from "aws-sdk";
// import { failure, success } from "../../libs/response-lib";
import moment from 'moment';
import { lookForPatterns } from '../../utils/sawtooth';
import { keepDecimalPlacesWithoutRoundingUp, isInt, reducer } from "../../utils/common";

let coverInputsData;
let dailyElectricalData;

let coverInputsSelected;
let dailyElectricalDataSelected;

let formatedWeeklyDailyWaste = [];
let coversInputIncludingDayOftheYear = [];

let wastePerCoverForCoverWaste = [];
let wastePerCoverForPreparationWaste = [];
let wastePerCoverForSpoilageWaste = [];
let wastePerCoverForAllWaste = [];

let coverInputDataArray = [];
let coverWasteDataArray = [];
let preparationWasteDataArray = [];
let spoilageWasteDataArray = [];
let totalDailyWasteDataArray = [];

let coverInputDataInCurrentMonth = [];

let xAxis = [];

let totalCW;
let totalSW;
let totalPW;
let totalWaste;
let totalCoverInputs;
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
            // console.log("data.coverWaste", data.coverWaste);
            let coverWaste = lookForPatterns(data.coverWaste, 'cw');
            // console.log("coverWaste", coverWaste);
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
    const newDate = moment(day).add(7, 'days').format('YYYY-MM-DD');
    return newDate;
};

const getCoversInputIncludingDayOftheYear = () => {
    // console.log("coverInputsSelected",coverInputsSelected);
    coverInputsSelected.map((data) => {
        // console.log("data",data);
        let dayOfTheYear = daysIntoYear(new Date(data.Date));
        let endDate = addSevenMoredays(data.Date);
        const dayOfTheYearForEndDate = daysIntoYear(new Date(endDate));
        const coversInput = data;

        coversInputIncludingDayOftheYear.push({
            dayOfTheYear,
            Date,
            coversInput,
            dayOfTheYearForEndDate
        });
    });
};

const getWastePerCover = () => {
    // console.log("coversInputIncludingDayOftheYear",coversInputIncludingDayOftheYear);
    coversInputIncludingDayOftheYear.map((data) => {

        let dayOfTheYear = data.dayOfTheYear;
        let dayOfTheYearForEndDate = data.dayOfTheYearForEndDate;

        for (let i = dayOfTheYear; i < dayOfTheYearForEndDate; i++) {
            formatedWeeklyDailyWaste.map((item) => {

                if (item.dayOfYear == i) {
                    let coversInputIndex = i - dayOfTheYear;

                    let coverInputData = data.coversInput.coversInput[coversInputIndex];

                    let convertCoverInputToNumber = parseInt(coverInputData);
                    coverInputDataInCurrentMonth.push(convertCoverInputToNumber);

                    let date = new Date(item.date);
                    xAxis.push(date.getDate());

                    //CoverWaste
                    let coverWasteData = item.coverWaste;
                    let wastePerCoverForCW = coverInputData == 0 ? 0 : isInt(coverWasteData / coverInputData) ? (coverWasteData / coverInputData) :
                    keepDecimalPlacesWithoutRoundingUp((coverWasteData / coverInputData), 2);


                    let numForCw = parseFloat(wastePerCoverForCW);
                    wastePerCoverForCoverWaste.push(numForCw);

                    //preparationWaste
                    let preparationWasteData = item.preparationWaste;
                    let wastePerCoverForPW = coverInputData == 0 ? 0 : isInt(preparationWasteData / coverInputData) ? (preparationWasteData / coverInputData) :
                    keepDecimalPlacesWithoutRoundingUp((preparationWasteData / coverInputData), 2);


                    let numForPw = parseFloat(wastePerCoverForPW);
                    wastePerCoverForPreparationWaste.push(numForPw);

                    //spoilageWaste
                    let spoilageWasteData = item.spoilageWaste;
                    let wastePerCoverForSW = coverInputData == 0 ? 0 : isInt(spoilageWasteData / coverInputData) ? (spoilageWasteData / coverInputData) :
                    keepDecimalPlacesWithoutRoundingUp((spoilageWasteData / coverInputData), 2);

                    let numForSw = parseFloat(wastePerCoverForSW);
                    wastePerCoverForSpoilageWaste.push(numForSw);

                    //allWaste totalDailyWaste
                    let totalDailyWasteData = item.totalDailyWaste;
                    let wastePerCoverForAllWasteData = coverInputData == 0 ? 0 : isInt(totalDailyWasteData / coverInputData) ? (totalDailyWasteData / coverInputData) :
                    keepDecimalPlacesWithoutRoundingUp((totalDailyWasteData / coverInputData), 2);

                    let numForTotalWaste = parseFloat(wastePerCoverForAllWasteData);
                    wastePerCoverForAllWaste.push(numForTotalWaste);

                    coverInputDataArray.push(coverInputData);
                    coverWasteDataArray.push(coverWasteData);
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

    // console.log("formatedWeeklyDailyWaste",formatedWeeklyDailyWaste);

    formatedWeeklyDailyWaste.map((data) => {
        sumOfCoverWaste.push(data.coverWaste);
        sumOfSpoilageWaste.push(data.spoilageWaste);
        sumOfPrepWaste.push(data.preparationWaste);
        sumOfTotalWaste.push(data.totalDailyWaste);
    });

    let coverWaste = sumOfCoverWaste.length > 0 ? sumOfCoverWaste : [0];
    let spoilageWaste = sumOfSpoilageWaste.length > 0 ? sumOfSpoilageWaste : [0];
    let prepWaste = sumOfPrepWaste.length > 0 ? sumOfPrepWaste : [0];
    let allWaste = sumOfTotalWaste.length > 0 ? sumOfTotalWaste : [0];

    totalCW = coverWaste.reduce(reducer);
    totalSW = spoilageWaste.reduce(reducer);
    totalPW = prepWaste.reduce(reducer);
    totalWaste = allWaste.reduce(reducer);

};

const getSumOfCoversInput = () => {
    const reducer = (accumulator, currentValue) => accumulator + currentValue;
    //if the start of the week is in the last month
    let totalCoverInputDataInCurrentMonth = coverInputDataInCurrentMonth.length > 0 ? coverInputDataInCurrentMonth : [0];
    totalCoverInputs = totalCoverInputDataInCurrentMonth.reduce(reducer);
};

const getCoversInputPercentage = () => {
    const totalCoverInputsData = coverInputDataInCurrentMonth.length;
    const stripOutallZeros = coverInputDataInCurrentMonth.filter((data) => {
        return data !== 0;
    });
    const totalZeros = totalCoverInputsData - stripOutallZeros.length;
    percentageOfInputsAreZeros = parseInt((totalZeros / totalCoverInputsData) * 100);
};

const calculateTheRemainingCovers = (monthNum) => {
    let totalNumberOfItemsInCurrentMonth = xAxis.length;

    let totalItems = [];
    coverInputsSelected.map((data) => {
        totalItems.push(data.coversInput.length);
    });
    // const totalNumberOfItemsInCurrentMonthCoverInputs = totalItems.reduce(reducer);
    const totalNumberOfItemsInCurrentMonthCoverInputs = totalItems.length === 0 ? totalNumberOfItemsInCurrentMonth : totalItems.reduce(reducer);

    const totalValueBelongToNextMonth = totalNumberOfItemsInCurrentMonthCoverInputs - totalNumberOfItemsInCurrentMonth;

    // console.log("totalValueBelongToNextMonth",totalValueBelongToNextMonth);

    if (totalValueBelongToNextMonth !== 0) {
        const lastElementIndex = coverInputsSelected.length - 1;
        const coverInputForLastWeekOfMonth = coverInputsSelected[lastElementIndex].coversInput;
        const reverseArr = coverInputForLastWeekOfMonth.reverse();
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

export const wastePerCover = async (event, context, callback) => {

    const dynamoDb = new AWS.DynamoDB.DocumentClient();

    // console.log("event",event);

    const dataFromFrontEnd = event.queryStringParameters;
    let id = dataFromFrontEnd.id;
    let companyName = dataFromFrontEnd.company;
    let siteId = dataFromFrontEnd.site;
    let currentYear = new Date().getFullYear();
    let monthNum = dataFromFrontEnd.month;

    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    // let currentYear = "2021";
    // let monthNum = "8";

    siteName = siteId.replace(/[^A-Za-z]+/g, '').toLowerCase();

    monthsName = months[monthNum - 1];

    const paramsForCoverInput = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :weeklyCoversInput",
        ExpressionAttributeValues: {
            ":weeklyCoversInput": `${siteId}_weeklyCoversInput_${currentYear}`,
        },
        ProjectionExpression: `siteName, weeklyCovers`,
    };

    const response = await dynamoDb.query(paramsForCoverInput).promise();

    coverInputsData = response.Items;

    coverInputsData.map((data) => {
        coverInputsSelected = data.weeklyCovers.filter((item) => {
            return getMonthAsAnumber(item.Date) === monthNum;
        });
    });

    const paramsForDailyElectricalData = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :dailyElectricalData",
        ExpressionAttributeValues: {
            ":dailyElectricalData": `${siteId}_dailyElectricalData_${currentYear}`,
        },
        ProjectionExpression: `siteName, dayOfTheYear`,
    };

    const responseTwo = await dynamoDb.query(paramsForDailyElectricalData).promise();

    dailyElectricalData = responseTwo.Items;

    dailyElectricalData.map((data) => {
        dailyElectricalDataSelected = data.dayOfTheYear.filter((item) => {
            return getMonthAsAnumber(item.Date) === monthNum;
        });
    });

     //REMOVE CACHE
    formatedWeeklyDailyWaste = [];
    coversInputIncludingDayOftheYear = [];
    wastePerCoverForCoverWaste = [];
    wastePerCoverForPreparationWaste = [];
    wastePerCoverForSpoilageWaste = [];
    wastePerCoverForAllWaste = [];
    coverInputDataInCurrentMonth = [];
    xAxis = [];

    coverInputDataArray = [];
    coverWasteDataArray = [];
    preparationWasteDataArray = [];
    spoilageWasteDataArray = [];
    totalDailyWasteDataArray = [];

    //turn hourly waste to daily waste
    getMaxNumOfAllCSP();

    //this will give me total CSP and separate waste streams from all teh days in the month selected
    getTotalCSP();

    getCoversInputIncludingDayOftheYear();

    getWastePerCover();

    getSumOfTotalWasteAndCSP();

    getSumOfCoversInput();

    getCoversInputPercentage();

    const nextMonthData = calculateTheRemainingCovers(monthNum);

    if (nextMonthData !== undefined) {
        // console.log("nextMonthData",nextMonthData);

        nextMonthData.map((data) => {
            for (let i = 0; i < data.allWasteArr.length; i++) {
                coverWasteDataArray.push(data.coverWasteArr[i]);
                spoilageWasteDataArray.push(data.spoilageWasteArr[i]);
                preparationWasteDataArray.push(data.prepWasteArr[i]);
                totalDailyWasteDataArray.push(data.allWasteArr[i]);

                coverInputDataArray.push(data.coverInputsArr[i]);

                wastePerCoverForCoverWaste.push(data.coverWasteArrPerCover[i]);
                wastePerCoverForSpoilageWaste.push(data.spoilageWasteArrPerCover[i]);
                wastePerCoverForPreparationWaste.push(data.prepWasteArrPerCover[i]);
                wastePerCoverForAllWaste.push(data.allWasteArrPerCover[i]);

                xAxis.push(i + 1);
            };
        });

    };

    let wastePerCover = {
        wastePerCoverForCoverWaste: wastePerCoverForCoverWaste,
        wastePerCoverForPreparationWaste: wastePerCoverForPreparationWaste,
        wastePerCoverForSpoilageWaste: wastePerCoverForSpoilageWaste,
        wastePerCoverForAllWaste: wastePerCoverForAllWaste,
        totalCW: totalCW.toFixed(0),
        totalSW: totalSW.toFixed(0),
        totalPW: totalPW.toFixed(0),
        totalWaste: totalWaste.toFixed(0),
        totalCoverInputs: totalCoverInputs,
        percentageOfInputsAreZeros: percentageOfInputsAreZeros,
        xAxis: xAxis,
        monthsName: monthsName,
        siteName,
        coverInputDataArray,
        coverWasteDataArray,
        preparationWasteDataArray,
        spoilageWasteDataArray,
        totalDailyWasteDataArray
    };

    return wastePerCover;
};