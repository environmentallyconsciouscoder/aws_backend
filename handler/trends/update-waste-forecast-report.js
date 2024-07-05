import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";
// import { failure } from "../../libs/response-lib";

import {
    createUniqueArrayOfObjects
 } from '../../utils/common';

function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
};

const currentYear = new Date().getFullYear();

const reducer = (accumulator, currentValue) => accumulator + currentValue;

export async function main() {

    const params = {
        TableName: "company_identifier_master",
    };

  try {
    const result = await dynamoDbLib.call("scan", params);

    let companyAndIdArray = [];

    result.Items.map((data) => {
        companyAndIdArray.push({
            id: data.id,
            companyName: data.company,
            deviceID: data.deviceID
        });
    });

    // console.log("companyAndIdArray",companyAndIdArray);

    let currentYearAiPredictionArray = [];
    let weeklyWastesArray = [];
    // let prevYearWeeklyWastesArray = [];
    let allSitesArray = [];

    // const currentYear = new Date().getFullYear();
    // const previousYear = currentYear - 1;

    //THIS ARRAY WILL GIVE ME ALL THE UNIQUE COMPANY ID, NAME AND SITES
    let companyAndIdAndDeviceIdArray = [];

    companyAndIdArray.map((data) => {
        data.deviceID.map((item) => {
            companyAndIdAndDeviceIdArray.push({
                deviceID: item,
                id: data.id,
                companyName: data.companyName
            });
        });
    });

    // console.log("companyAndIdAndDeviceIdArray",companyAndIdAndDeviceIdArray);

    try {
        //IAM CALLING ALL THE TABLE ITEMS TO GET THE DATA I NEED
        for (let i = 0; i <= companyAndIdAndDeviceIdArray.length - 1; i++) {
            let companyName = companyAndIdAndDeviceIdArray[i].companyName;
            let id = companyAndIdAndDeviceIdArray[i].id;
            let siteId = companyAndIdAndDeviceIdArray[i].deviceID.siteId;
            // const currentYear = new Date().getFullYear();

            const currentYearAiPredictionParams = {
                TableName: `${id}_${companyName}_allReports`,
                KeyConditionExpression: "site = :aiPrediction",
                ExpressionAttributeValues: {
                  ":aiPrediction": `${siteId}_aiPrediction_${currentYear}`,
                },
            };
            const currentYearAiPredictionResult = await dynamoDbLib.call("query", currentYearAiPredictionParams);
            currentYearAiPredictionArray.push(currentYearAiPredictionResult);

            // console.log("currentYearAiPredictionResult",currentYearAiPredictionResult);

            const weeklyWasteParams = {
                TableName: `${id}_${companyName}_allReports`,
                KeyConditionExpression: "site = :weeklyWaste",
                ExpressionAttributeValues: {
                  ":weeklyWaste": `${siteId}_weeklyWaste_${currentYear}`,
                },
            };
            const weeklyWasteResult = await dynamoDbLib.call("query", weeklyWasteParams);
            weeklyWastesArray.push(weeklyWasteResult);

            // console.log("weeklyWasteResult",weeklyWasteResult);

            const allSitesParams = {
                TableName: `${id}_${companyName}_allReports`,
                KeyConditionExpression: "site = :allSites",
                ExpressionAttributeValues: {
                ":allSites": `allSites_${currentYear}`,
                // ":allSites": `allSites`,
                },
            };
            const allSitesResult = await dynamoDbLib.call("query", allSitesParams);

            // console.log("allSitesResult",allSitesResult);

            allSitesArray.push({
                companyId: id,
                companyName: companyName,
                wasteData: allSitesResult
            });
        };

        // console.log("currentYearAiPredictionArray",currentYearAiPredictionArray);
        // console.log("weeklyWastesArray",weeklyWastesArray);
        // console.log("allSitesArray",allSitesArray);

        let sitesID = [];
        let totalWeeklyTrendArray = [];
        let totalWeeklySumOfTrendsAndAverages = [];
        let aiPredictionWasteAndCompanyNamePlusIdArray = [];

        // THIS WILL GIVES ME ALL THE SITES NAME , COMPANI ID AND COMPANY NAME. PLUS COVER, PREP AND SPOILAGE ARRAYS
        let allSitesID = [];

        allSitesArray.map((item) => {
            item.wasteData.Items.map((data) => {
                if (data.totalWaste) {
                    data.totalWaste.sites.map((data) => {
                        // console.log("over here allSitesArray data", data);

                        sitesID.push({
                            site: data.siteName,
                            coverWaste: [],
                            preparationWaste: [],
                            spoilageWaste: []
                        });
                        totalWeeklyTrendArray.push({
                            site: data.siteName,
                            totalCoverWasteTrend: [],
                            totalPreparationWasteTrend: [],
                            totalSpoilageWasteTrend: []
                        });
                        totalWeeklySumOfTrendsAndAverages.push({
                            site: data.siteName,
                            totalCoverWasteAverage: [],
                            totalPreparationWasteAverage: [],
                            totalSpoilageWasteAverage: []
                        });
                        aiPredictionWasteAndCompanyNamePlusIdArray.push({
                            companyId: item.companyId,
                            companyName: item.companyName,
                            sites: data.siteName,
                            wastesData: []
                        });
                        allSitesID.push({
                            companyId: item.companyId,
                            companyName: item.companyName,
                            sites: data.siteName,
                            coverWaste: [],
                            preparationWaste: [],
                            spoilageWaste: []
                        });
                    });
                };
            });
        });

        // console.log("totalWeeklySumOfTrendsAndAverages",totalWeeklySumOfTrendsAndAverages);

        const uniqueTotalWeeklySumOfTrendsAndAverages = createUniqueArrayOfObjects(totalWeeklySumOfTrendsAndAverages);

        // console.log("uniqueTotalWeeklySumOfTrendsAndAverages",uniqueTotalWeeklySumOfTrendsAndAverages);

        // const aiPredictionWasteAndCompanyNamePlusId = getUniqueListBy(aiPredictionWasteAndCompanyNamePlusIdArray, 'sites');

        let currentYearWeeklyData = [];
        // let previousYearWeeklyData = [];

        weeklyWastesArray.map((data) => {
            data.Items.filter((data) => {
                if (data.weeklyWasteSum) {
                    const replaceUnderScoreWithSpace = data.site.replace(/[_]+/g, ' ');
                    // const currentYear = new Date().getFullYear();
                    const checkCurrentYearExists = replaceUnderScoreWithSpace.includes(currentYear);

                    if (checkCurrentYearExists) {
                        currentYearWeeklyData.push({
                            data: data.weeklyWasteSum,
                            siteName: data.siteName
                        });
                    };
                };
            });
        });

        const uniqueAllSitesID = createUniqueArrayOfObjects(allSitesID);

        //this will fiter all the weekly waste data and put it INSIDE THE UNIQUE ALLSITES ID ARRAY
        currentYearWeeklyData.map((site) => {
            let numberOfWeeksInCurrentYear = site.data.length - 1;
            let lastWeekIndex = numberOfWeeksInCurrentYear - 3;

            if (numberOfWeeksInCurrentYear >= 3) {
                for (let i = lastWeekIndex; i < numberOfWeeksInCurrentYear; i++) {
                    uniqueAllSitesID.map((uniqueSite) => {
                        if (site.siteName === uniqueSite.sites) {
                            uniqueSite.coverWaste.push(site.data[i].coverWaste[0]);
                            uniqueSite.preparationWaste.push(site.data[i].preparationWaste[0]);
                            uniqueSite.spoilageWaste.push(site.data[i].spoilageWaste[0]);
                        };
                    });
                };
            };
        });

        // console.log("three weeks",uniqueAllSitesID);

        let allSitesWeeklyAverages = [];
        // const reducer = (accumulator, currentValue) => accumulator + currentValue;

        //this will GET THE AVERAGE for differnt weekly waste STREAM
        uniqueAllSitesID.map((data) => {

            let coverWasteAverage = 0;
            let prepWasteAverage = 0;
            let spoilageWasteAverage = 0;

            if (data.coverWaste.length > 0) {
                let totalCoverWaste = data.coverWaste.reduce(reducer);
                coverWasteAverage = totalCoverWaste / data.coverWaste.length;
            };

            if (data.preparationWaste.length > 0) {
                let totalPreparationWaste = data.preparationWaste.reduce(reducer);
                prepWasteAverage = totalPreparationWaste / data.preparationWaste.length;
            };

            if (data.spoilageWaste.length > 0) {
                let totalSpoilageWaste = data.spoilageWaste.reduce(reducer);
                spoilageWasteAverage = totalSpoilageWaste / data.spoilageWaste.length;
            };

            allSitesWeeklyAverages.push({
              site: data.sites,
              coverWasteAverage: coverWasteAverage,
              spoilageWasteAverage: spoilageWasteAverage,
              prepWasteAverage: prepWasteAverage
            });
        });

        // console.log("averge weekly wastes",allSitesWeeklyAverages);


        //THIS WILL CALCULATE TEH WEEKLY TRENDS
        let arrayWeeklyTrends = [];

        const weeklyTrends = (data, site, type) => {
            for (let i = 0; i <= data.length; i++) {
                let differences = data[i + 1] - data[i];
                if (typeof differences === 'number' && !Number.isNaN(differences)) {
                    arrayWeeklyTrends.push({
                        trends: parseInt(differences.toFixed(2)),
                        type: type,
                        site: site
                    });
                };
            };
        };

        uniqueAllSitesID.map((data) => {
            weeklyTrends(data.coverWaste.reverse(), data.sites, "coverTrend");
            weeklyTrends(data.preparationWaste.reverse(), data.sites, "preparationTrend");
            weeklyTrends(data.spoilageWaste.reverse(), data.sites, "spoilageTrend");
        });

        // console.log("arrayWeeklyTrends", arrayWeeklyTrends);

        // console.log(" before totalWeeklyTrendArray", totalWeeklyTrendArray);

        const uniqueTotalWeeklyTrendArray = createUniqueArrayOfObjects(totalWeeklyTrendArray);

        if (uniqueTotalWeeklyTrendArray.length > 0) {
            for (let i = 0; i < totalWeeklyTrendArray.length; i++) {
                arrayWeeklyTrends.map((data) => {

                    if (data.site == totalWeeklyTrendArray[i].site) {

                        if (data.type == "coverTrend") {
                            totalWeeklyTrendArray[i].totalCoverWasteTrend.push(data.trends);
                        };

                        if (data.type == "preparationTrend") {
                            totalWeeklyTrendArray[i].totalPreparationWasteTrend.push(data.trends);
                        };

                        if (data.type == "spoilageTrend") {
                            totalWeeklyTrendArray[i].totalSpoilageWasteTrend.push(data.trends);
                        };

                    };
                });
            };
        };

        // console.log(" after formating uniqueTotalWeeklyTrendArray", uniqueTotalWeeklyTrendArray);


        let totalWeeklyTrendSumArray = [];

        uniqueTotalWeeklyTrendArray.map((data) => {

            //check if there is empty values
            let coverWasteTrend = data.totalCoverWasteTrend.length > 0 ? data.totalCoverWasteTrend : [0];
            let prepWasteTrend = data.totalPreparationWasteTrend.length > 0 ? data.totalPreparationWasteTrend : [0];
            let spoilageWasteTrend = data.totalSpoilageWasteTrend.length > 0 ? data.totalSpoilageWasteTrend : [0];

            // console.log("coverWasteTrend",coverWasteTrend);
            // console.log("prepWasteTrend",prepWasteTrend);
            // console.log("spoilageWasteTrend",spoilageWasteTrend);

            let totalCoverWasteTrend = coverWasteTrend.reduce(reducer);
            let coverWasteAverageTrend = isNaN(totalCoverWasteTrend / data.totalCoverWasteTrend.length) ? 0 : totalCoverWasteTrend / data.totalCoverWasteTrend.length;

            let totalPreparationWasteTrend = prepWasteTrend.reduce(reducer);
            let prepWasteAverageTrend = isNaN(totalPreparationWasteTrend / data.totalPreparationWasteTrend.length) ? 0 : totalPreparationWasteTrend / data.totalPreparationWasteTrend.length;

            let totalSpoilageWasteTrend = spoilageWasteTrend.reduce(reducer);
            let spoilageWasteAverageTrend = isNaN(totalSpoilageWasteTrend / data.totalSpoilageWasteTrend.length) ? 0 : totalSpoilageWasteTrend / data.totalSpoilageWasteTrend.length;


            totalWeeklyTrendSumArray.push({
                site: data.site,
                coverWasteAverage: coverWasteAverageTrend,
                spoilageWasteAverage: spoilageWasteAverageTrend,
                prepWasteAverage: prepWasteAverageTrend
            });

        });

        // console.log("totalWeeklyTrendSumArray",totalWeeklyTrendSumArray);

        totalWeeklyTrendSumArray.map((data, i) => {
            if (uniqueTotalWeeklySumOfTrendsAndAverages[i].site == data.site) {

                    let roundedUpTotalCoverWasteAverage = parseInt((data.coverWasteAverage + allSitesWeeklyAverages[i].coverWasteAverage).toFixed(0));
                    let roundedUpTotalPreparationWasteAverage = parseInt((data.prepWasteAverage + allSitesWeeklyAverages[i].prepWasteAverage).toFixed(0));
                    let roundedUpTotalSpoilageWasteAverage = parseInt((data.spoilageWasteAverage + allSitesWeeklyAverages[i].spoilageWasteAverage).toFixed(0));

                    uniqueTotalWeeklySumOfTrendsAndAverages[i].totalCoverWasteAverage.push(roundedUpTotalCoverWasteAverage);
                    uniqueTotalWeeklySumOfTrendsAndAverages[i].totalPreparationWasteAverage.push(roundedUpTotalPreparationWasteAverage);
                    uniqueTotalWeeklySumOfTrendsAndAverages[i].totalSpoilageWasteAverage.push(roundedUpTotalSpoilageWasteAverage);
            };
        });

        //THIS PREDICTION IS HERE FOR WEEKLY
        // console.log("uniqueTotalWeeklySumOfTrendsAndAverages",uniqueTotalWeeklySumOfTrendsAndAverages);


        let aiPredictions = [];

        // console.log("currentYearAiPredictionArray",currentYearAiPredictionArray);

        currentYearAiPredictionArray.map((result) => {
            result.Items.map((data) => {
                aiPredictions.push(data);
            });
        });

        // console.log("aiPredictions",aiPredictions);

        const checkCurrentYearExists =  aiPredictions.map((data) => {
            const replaceUnderScoreWithSpace = data.site.replace(/[_]+/g, ' ');
            const currentYear = new Date().getFullYear();
            return replaceUnderScoreWithSpace.includes(currentYear);
        });

        // console.log("checkCurrentYearExists",checkCurrentYearExists);


        let aiPredictionArraysCurrentYear  = [];

        const today = new Date();
        const monthNumber = parseInt(String(today.getMonth())); //January is 0!

        // // THIS WILL GIVE ME ALL THE ZEROS LEADING UP TO THE CURRENT MONTH
        let arrayOFZeros = [];

        for (let i = 0; i <= monthNumber; i++) {
            arrayOFZeros.push(0);
        };

        // //IF THE LENGTH EXISITS THAT MEANS THERE IS DATA ALREADY IN AI item....
        if (checkCurrentYearExists.includes(true)) {

            aiPredictions.map((data, i) => {
                const replaceUnderScoreWithSpace = data.site.replace(/[_]+/g, ' ');
                const currentYear = new Date().getFullYear();
                if (replaceUnderScoreWithSpace.includes(currentYear)) {

                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.coverWaste.length !== undefined ? data.aiPrediction.dailyForcastsBasedOnCurrentMonth.coverWaste : data.aiPrediction.dailyForcastsBasedOnCurrentMonth.coverWaste = arrayOFZeros;
                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.preparationWaste.length !== undefined ? data.aiPrediction.dailyForcastsBasedOnCurrentMonth.preparationWaste : data.aiPrediction.dailyForcastsBasedOnCurrentMonth.preparationWaste = arrayOFZeros;
                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.spoilageWaste.length !== undefined ? data.aiPrediction.dailyForcastsBasedOnCurrentMonth.spoilageWaste : data.aiPrediction.dailyForcastsBasedOnCurrentMonth.spoilageWaste = arrayOFZeros;

                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.coverWaste.length !== undefined ? data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.coverWaste : data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.coverWaste = arrayOFZeros;
                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.preparationWaste.length !== undefined ? data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.preparationWaste : data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.preparationWaste = arrayOFZeros;
                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.spoilageWaste.length !== undefined ? data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.spoilageWaste : data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.spoilageWaste = arrayOFZeros;

                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.coverWaste.length !== undefined ? data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.coverWaste : data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.coverWaste = arrayOFZeros;
                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.preparationWaste.length !== undefined ? data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.preparationWaste :data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.preparationWaste = arrayOFZeros;
                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.spoilageWaste.length !== undefined ? data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.spoilageWaste : data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.spoilageWaste = arrayOFZeros;

                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.coverWaste.length !== undefined ? data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.coverWaste : data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.coverWaste = arrayOFZeros;
                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.preparationWaste.length !== undefined ? data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.preparationWaste : data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.preparationWaste = arrayOFZeros;
                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.spoilageWaste.length !== undefined ? data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.spoilageWaste : data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.spoilageWaste  = arrayOFZeros;

                    aiPredictionArraysCurrentYear.push(data);
                };
            });
        };

        // console.log("ADDED ZERO IF IT DOESN'T HAVE VALUE",aiPredictionArraysCurrentYear);

        // // 1 is jan
        const numberOfDaysInAWeek = daysInMonth(monthNumber + 1, currentYear);

        const divideBy7 = numberOfDaysInAWeek / 7;

        let numberOfWeeksInAMonth = divideBy7 > 4 ? 4.5 : 4;

        let aiData =  JSON.parse(JSON.stringify(aiPredictionArraysCurrentYear));

        totalWeeklySumOfTrendsAndAverages.map((forecastData) => {

            aiData.map((data) => {

                if (data.aiPrediction.siteName === forecastData.site) {

                    let weeklyCoverWastePrediction = forecastData.totalCoverWasteAverage[0];
                    let weeklySpoilageWastePrediction = forecastData.totalSpoilageWasteAverage[0];
                    let weeklyPrepWastePrediction = forecastData.totalPreparationWasteAverage[0];

                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.coverWaste[monthNumber] = weeklyCoverWastePrediction;
                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.spoilageWaste[monthNumber] = weeklySpoilageWastePrediction;
                    data.aiPrediction.weeklylyForcastsBasedOnCurrentMonth.preparationWaste[monthNumber] = weeklyPrepWastePrediction;

                    let monthlyCoverWastePrediction = weeklyCoverWastePrediction * numberOfWeeksInAMonth;
                    let monthlySpoilageWastePrediction = weeklySpoilageWastePrediction * numberOfWeeksInAMonth;
                    let monthlyPrepWastePrediction = weeklyPrepWastePrediction * numberOfWeeksInAMonth;

                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.coverWaste[monthNumber] = monthlyCoverWastePrediction;
                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.spoilageWaste[monthNumber] = monthlySpoilageWastePrediction;
                    data.aiPrediction.monthlyForcastsBasedOnCurrentMonth.preparationWaste[monthNumber] = monthlyPrepWastePrediction;

                    let dailyCoverWastePrediction = parseInt((weeklyCoverWastePrediction / 7).toFixed(0));
                    let dailySpoilageWastePrediction = parseInt((weeklySpoilageWastePrediction / 7).toFixed(0));
                    let dailyPrepWastePrediction = parseInt((weeklyPrepWastePrediction / 7).toFixed(0));

                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.coverWaste[monthNumber] = dailyCoverWastePrediction;
                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.spoilageWaste[monthNumber] = dailySpoilageWastePrediction;
                    data.aiPrediction.dailyForcastsBasedOnCurrentMonth.preparationWaste[monthNumber] = dailyPrepWastePrediction;

                    let yearlyCoverWastePrediction = monthlyCoverWastePrediction * 12;
                    let yearlySpoilageWastePrediction = monthlySpoilageWastePrediction * 12;
                    let yearlyPrepWastePrediction = monthlyPrepWastePrediction * 12;

                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.coverWaste[monthNumber] = yearlyCoverWastePrediction;
                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.spoilageWaste[monthNumber] = yearlySpoilageWastePrediction;
                    data.aiPrediction.yearlyForcastsBasedOnCurrentMonth.preparationWaste[monthNumber] = yearlyPrepWastePrediction;
                };
            });
        });

        // console.log("aiData",aiData);

        // console.log("aiPredictionWasteAndCompanyNamePlusIdArray",aiPredictionWasteAndCompanyNamePlusIdArray);

        const uniqueAiPredictionWasteAndCompanyNamePlusIdArray = createUniqueArrayOfObjects(aiPredictionWasteAndCompanyNamePlusIdArray);

        uniqueAiPredictionWasteAndCompanyNamePlusIdArray.map((data) => {
            aiData.map((item) => {
                if (data.sites == item.aiPrediction.siteName) {
                    data.wastesData.push(item);
                };
            });
        });

        let allParams = [];
        const currentYr = new Date().getFullYear();

        // console.log("aiPredictionWasteAndCompanyNamePlusId",aiPredictionWasteAndCompanyNamePlusId);

        uniqueAiPredictionWasteAndCompanyNamePlusIdArray.map((data) => {
            const params = {
                TableName: `${data.companyId}_${data.companyName}_allReports`,
                Key: {
                  site: `${data.sites}_aiPrediction_${currentYr}`,
                },
                UpdateExpression: `set aiPrediction = :aiPrediction`,
                ExpressionAttributeValues: {
                  ":aiPrediction": data.wastesData[0].aiPrediction
                },
            };

            allParams.push(params);
        });

        try {

            let result;

            for (let i = 0; i <= allParams.length - 1; i++) {
                result = await dynamoDbLib.call("update", allParams[i]);
            };

            if (result) {
                return success(result);
            };

        } catch (e) {
            console.log("error", e);
            return failure({ status: false });
        }

    } catch (e) {
        console.log("e",e);
        return failure({ status: false });
    }

  } catch (e) {
    return failure({ status: false });
  }
}
