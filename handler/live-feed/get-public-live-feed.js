import { failure, success } from "../../libs/response-lib";

import {
    getCarbonMunicipalValue,
    getDailyElectricalData,
    getWeeklyWasteData,
    getMonthlyWasteData
} from '../../utils/Queries';

import {
    getCurrentWeekNumberInTheYear,
    getMonthAsAnumber,
    roundToX,
    wasteTypes,
    getSpecificDailyElectricalData,
    dayOfTheYear,
    getSpecificWeeklyData
} from '../../utils/common';

import {
    lookForPatterns
} from '../../utils/sawtooth';

export const main = async (event, context, callback) => {

    try {
        const currYear = new Date().getFullYear();

        const id = event.queryStringParameters.id;
        const companyName = event.queryStringParameters.companyName;
        const siteId = event.queryStringParameters.siteName;

        // const id = "1000";
        // const companyName = "falmouthUniversity";
        // const siteId = "1_STANNARY";

        const dailyElectricalData = await getDailyElectricalData(id,companyName,siteId,currYear);
        const currentDayOfTheYear = dayOfTheYear();
        const getYesterdayDayOfTheYear = currentDayOfTheYear - 1;
        // console.log("dailyElectricalData",dailyElectricalData);
        // console.log("currentDayOfTheYear",currentDayOfTheYear);
        // console.log("getYesterdayDayOfTheYear",getYesterdayDayOfTheYear);

        const todayDailyElectricalData = getSpecificDailyElectricalData(dailyElectricalData, currentDayOfTheYear);
        const yesterdayDailyElectricalData = getSpecificDailyElectricalData(dailyElectricalData, getYesterdayDayOfTheYear);
        // console.log("todayDailyElectricalData",todayDailyElectricalData);
        // console.log("yesterdayDailyElectricalData",yesterdayDailyElectricalData);

        let coverWasteMax = 0;
        let preparationWasteMax = 0;
        let spoilageWasteMax = 0;

        let yesterdayCoverWasteMax = 0;
        let yesterdayPreparationWasteMax = 0;
        let yesterdaySpoilageWasteMax = 0;

        coverWasteMax = lookForPatterns(todayDailyElectricalData[0][0].coverWaste,wasteTypes.coverWaste);
        preparationWasteMax = lookForPatterns(todayDailyElectricalData[0][0].preparationWaste,wasteTypes.preparationWaste);
        spoilageWasteMax = lookForPatterns(todayDailyElectricalData[0][0].spoilageWaste,wasteTypes.spoilageWaste);

        yesterdayCoverWasteMax = lookForPatterns(yesterdayDailyElectricalData[0][0].coverWaste,wasteTypes.coverWaste);
        yesterdayPreparationWasteMax = lookForPatterns(yesterdayDailyElectricalData[0][0].preparationWaste,wasteTypes.preparationWaste);
        yesterdaySpoilageWasteMax = lookForPatterns(yesterdayDailyElectricalData[0][0].spoilageWaste,wasteTypes.spoilageWaste);

        // console.log("coverWasteMax",coverWasteMax);
        // console.log("preparationWasteMax",preparationWasteMax);
        // console.log("spoilageWasteMax",spoilageWasteMax);
        // console.log("yesterdayCoverWasteMax",yesterdayCoverWasteMax);
        // console.log("yesterdayPreparationWasteMax",yesterdayPreparationWasteMax);
        // console.log("yesterdaySpoilageWasteMax",yesterdaySpoilageWasteMax);

        // console.log("allWaste",allWaste);
        // console.log("allWasteFromYesterday",allWasteFromYesterday);
        // console.log("differences",differences);

        const date = new Date();
        const carbonMunicipalValue = await getCarbonMunicipalValue(id,companyName);

        const currentWeekNumberInTheYear = getCurrentWeekNumberInTheYear(date) - 1;
        const yesterdayWeekNumberInTheYear = currentWeekNumberInTheYear - 1;

        // console.log("currentWeekNumberInTheYear",currentWeekNumberInTheYear);
        // console.log("yesterdayWeekNumberInTheYear",yesterdayWeekNumberInTheYear);

        const monthAsNumber = getMonthAsAnumber() - 1;
        const yesterdayMonthAsNumber = getMonthAsAnumber() - 2;

        // console.log("monthAsNumber",monthAsNumber);
        // console.log("yesterdayMonthAsNumber",yesterdayMonthAsNumber);

        // console.log("carbonMunicipalValue",carbonMunicipalValue);
        // console.log("day",day);
        // console.log("monthAsNumber",monthAsNumber);

        let dailyWaste = 0;
        let weeklyWaste = 0;
        let monthlyWaste = 0;

        let dailySavingsInCO2 = 0;
        let weeklySavingsInCO2 = 0;
        let monthlySavingsInCO2 = 0;

        let dailySavingsInMeals = 0;
        let weeklySavingsInMeals = 0;
        let monthlySavingsInMeals = 0;

        const weeklyData = await getWeeklyWasteData(id,companyName,siteId,currYear);
        const monthlyData = await getMonthlyWasteData(id,companyName,siteId,currYear);

        // console.log("weeklyData",weeklyData);
        // console.log("currentWeekNumberInTheYear",currentWeekNumberInTheYear);
        // console.log("monthlyData",monthlyData);

        const todayWeeklyData = getSpecificWeeklyData(weeklyData, currentWeekNumberInTheYear);
        const yesterdayWeeklyData = getSpecificWeeklyData(weeklyData, yesterdayWeekNumberInTheYear);

        // console.log("todayWeeklyData",todayWeeklyData);
        // console.log("yesterdayWeeklyData",yesterdayWeeklyData);

        const allWaste = roundToX(coverWasteMax + preparationWasteMax + spoilageWasteMax, 2);
        const allWasteFromYesterday = roundToX(yesterdayCoverWasteMax + yesterdayPreparationWasteMax + yesterdaySpoilageWasteMax, 2);
        const differences = allWaste - allWasteFromYesterday;

        const allWeeklyWasteFromYesterday = roundToX(yesterdayWeeklyData[0].coverWaste[0] + yesterdayWeeklyData[0].preparationWaste[0] + yesterdayWeeklyData[0].spoilageWaste[0], 2);
        const allWeeklyWaste = roundToX(todayWeeklyData[0].coverWaste[0] + todayWeeklyData[0].preparationWaste[0] + todayWeeklyData[0].spoilageWaste[0], 2);
        const weeklyDifferences = allWeeklyWaste - allWeeklyWasteFromYesterday;

        const todayMonthlyData = monthlyData.coverWaste[monthAsNumber] + monthlyData.preparationWaste[monthAsNumber] + monthlyData.spoilageWaste[monthAsNumber];
        const yesterdayMonthlyData = monthlyData.coverWaste[yesterdayMonthAsNumber] + monthlyData.preparationWaste[yesterdayMonthAsNumber] + monthlyData.spoilageWaste[yesterdayMonthAsNumber];
        const monthlyDifferences = todayMonthlyData - yesterdayMonthlyData;

        // console.log("allWeeklyWasteFromYesterday",allWeeklyWasteFromYesterday);
        // console.log("allWeeklyWaste",allWeeklyWaste);
        // console.log("weeklyDifferences",weeklyDifferences);
        // console.log("todayMonthlyData",todayMonthlyData);
        // console.log("yesterdayMonthlyData",yesterdayMonthlyData);
        // console.log("monthlyDifferences",monthlyDifferences);

        dailyWaste = differences;
        weeklyWaste = weeklyDifferences;
        monthlyWaste = monthlyDifferences;

        dailySavingsInCO2 = roundToX(carbonMunicipalValue * dailyWaste, 0);
        weeklySavingsInCO2 = roundToX(carbonMunicipalValue * weeklyWaste, 0);
        monthlySavingsInCO2 = roundToX(carbonMunicipalValue * monthlyWaste, 0);

        dailySavingsInMeals = roundToX((dailyWaste / 0.36), 0);
        weeklySavingsInMeals = roundToX((weeklyWaste / 0.36), 0);
        monthlySavingsInMeals = roundToX((monthlyWaste / 0.36), 0);

        const data = {
            dailySavingsInMeals: dailySavingsInMeals < 0 ? dailySavingsInMeals : "+" + dailySavingsInMeals,
            weeklySavingsInMeals: weeklySavingsInMeals < 0 ? weeklySavingsInMeals : "+" + weeklySavingsInMeals,
            monthlySavingsInMeals: monthlySavingsInMeals < 0 ? monthlySavingsInMeals : "+" + monthlySavingsInMeals,

            dailySavingsInCO2: dailySavingsInCO2 < 0 ? dailySavingsInCO2 : "+" + dailySavingsInCO2,
            weeklySavingsInCO2: weeklySavingsInCO2 < 0 ? weeklySavingsInCO2 : "+" + weeklySavingsInCO2,
            monthlySavingsInCO2: monthlySavingsInCO2 < 0 ? monthlySavingsInCO2 : "+" + monthlySavingsInCO2,
        };
        // console.log("data",data);
        return success(data);
    } catch (error) {
        console.log(error);
        return failure(error.message);
    }
};