import { failure, success } from "../../libs/response-lib";
import { getMonthlyWasteData, getCarbonMunicipalValue, getWeeklyWasteData, getMunicipalCostPerTonne, getWeeklyCoverInputs, getWeeklySalesInput } from '../../utils/Queries';
import { getMonthAsAnumber, reducer } from '../../utils/common';

// import { wastePerCover } from '../correlated-data/get-waste-per-cover-function';
// import { wastePerSales } from '../correlated-data/get-waste-per-sales-function';

export const main = async(eventOne, context, callback) => {
    try{
        // const id = eventOne.queryStringParameters.id;
        // const companyName = eventOne.queryStringParameters.company;
        // const siteId = eventOne.queryStringParameters.site;
        const year = new Date().getFullYear();

        const response = {
            lastMonthSpendOnFoodWaste: 0,
            costOfFoodDisposal: 0,
            numberOfMealsSavedThisMonth: 0,
            co2Contributions: 0,
            totalCo2Contribution: 0,

            bestWasteWeeks: 0,
            bestWasteWeeksDate: 0,
            bestWasteWeeksCovers: 0,
            bestWasteWeeksSales: 0,

            lastWeek: 0,
            lastWeekDate: 0,
            lastWeekCovers: 0,
            lastWeekSales: 0,

            numberOfMealsLostInTotal: 0,

            averageWasteWeeks: 0,
            averageWasteWeeksDate: 0,
            averageWasteWeeksCovers: 0,
            averageWasteWeeksSales: 0,

            wastePerCover: 0,
            wastePerSales: 0,

            lastWastePerCover: 0,
            lastWastePerSales: 0
        };

        const id = "1004";
        const companyName = "lussmans";
        const siteId = "1004_HERTFORD";

        const monthlyWasteData = await getMonthlyWasteData(id,companyName,siteId,year);
        // console.log("monthlyWasteData",monthlyWasteData);

        const monthlyIndex = getMonthAsAnumber() - 1;
        const prevMonthlyIndex = getMonthAsAnumber() === 1 ? 0 : getMonthAsAnumber() - 2;

        // console.log("monthlyWasteData",monthlyWasteData);
        // console.log("monthlyWasteData.coverWaste[monthlyIndex]",monthlyWasteData.coverWaste[monthlyIndex]);

        const currentMonth = parseInt(monthlyWasteData.coverWaste[monthlyIndex] + monthlyWasteData.preparationWaste[monthlyIndex] + monthlyWasteData.spoilageWaste[monthlyIndex]);
        const prevMonth = parseInt(monthlyWasteData.coverWaste[prevMonthlyIndex] + monthlyWasteData.preparationWaste[prevMonthlyIndex] + monthlyWasteData.spoilageWaste[prevMonthlyIndex]);

        const monthlyDifference = currentMonth - prevMonth;
        const totalWaste = monthlyWasteData.coverWaste.reduce(reducer) +  monthlyWasteData.preparationWaste.reduce(reducer) +  monthlyWasteData.spoilageWaste.reduce(reducer);

        const municipalCostPerTonne = await getMunicipalCostPerTonne(id,companyName);

        response.lastMonthSpendOnFoodWaste = isNaN(prevMonth) ? 0 : parseInt(prevMonth * 2.775);
        response.costOfFoodDisposal =   ((totalWaste / 1000) * municipalCostPerTonne).toFixed(2);

        // console.log("currentMonth",currentMonth);

        response.numberOfMealsSavedThisMonth =  monthlyDifference < 0 ? parseInt(Math.abs(monthlyDifference) / 0.36): 0;
        response.numberOfMealsLostInTotal =  parseInt(totalWaste / 0.36);

        const carbonMunicipalValue = await getCarbonMunicipalValue(id,companyName);

        // console.log("totalWaste",totalWaste);
        // console.log("carbonMunicipalValue",carbonMunicipalValue);

        response.co2Contributions = (currentMonth * carbonMunicipalValue).toFixed(2);

        response.totalCo2Contribution = parseInt(totalWaste * carbonMunicipalValue);

        const weeklyWasteData = await getWeeklyWasteData(id, companyName, siteId, year);
        // console.log("weeklyWasteData",weeklyWasteData);

        const weeklyWasteArr = [];

        weeklyWasteData.map((weeklyData) => {
            // console.log("weeklyData",weeklyData);
            weeklyWasteArr.push(weeklyData.coverWaste[0] + weeklyData.preparationWaste[0] + weeklyData.spoilageWaste[0]);
        });

        response.bestWasteWeeks = (Math.min(...weeklyWasteArr)).toFixed(2);
        const indexOfBestWasteWeeks = weeklyWasteArr.indexOf(Math.min(...weeklyWasteArr));

        // console.log("weeklyWasteArr",weeklyWasteArr);

        // console.log("weeklyWasteData[indexOfBestWasteWeeks]",weeklyWasteData[indexOfBestWasteWeeks]);
        response.bestWasteWeeksDate = weeklyWasteData[indexOfBestWasteWeeks].Date;

        // console.log("weeklyWasteData[indexOfBestWasteWeeks].Date",weeklyWasteData[indexOfBestWasteWeeks].Date);
        // console.log("getCurrentWeek() - 1]",[getCurrentWeek() - 1]);

        let indexOfLastWeek;

        weeklyWasteData.map((data, index) => {
            // console.log("index",index);
            // console.log("data.weekOfYear",data.weekOfYear);

            // if (data.weekOfYear == [getCurrentWeek() - 1]) {
            //     // console.log("index",index);
            //     indexOfLastWeek = index;
            // };

            if (data.weekOfYear == 1) {
                // console.log("index",index);
                indexOfLastWeek = 0;
            };
        });

        // const indexOfLastWeek = weeklyWasteArr.indexOf(weeklyWasteArr[getCurrentWeek() - 2]);

        // console.log("indexOfLastWeek",indexOfLastWeek);
        // console.log("weeklyWasteData[indexOfLastWeek].Date",weeklyWasteData[indexOfLastWeek]);

        // console.log("getCurrentWeek()",getCurrentWeek());

        response.lastWeekDate = weeklyWasteData[indexOfLastWeek].Date;

        const lastWeekWaste = (weeklyWasteData[indexOfLastWeek].coverWaste[0] + weeklyWasteData[indexOfLastWeek].preparationWaste[0] + weeklyWasteData[indexOfLastWeek].spoilageWaste[0]).toFixed(2);

        response.lastWeek = lastWeekWaste;

        // console.log("id",id);
        // console.log("companyName",companyName);
        // console.log("siteId",siteId);
        // console.log("year",year);

        const weeklyCoverInputs = await getWeeklyCoverInputs(id,companyName,siteId,year);
        // console.log("weeklyCoverInputs",weeklyCoverInputs);

        const weeklySalesInputs = await getWeeklySalesInput(id,companyName,siteId,year);

        // console.log("weeklyCoverInputs",weeklyCoverInputs[indexOfLastWeek].coversInput);

        const lastWeekSales = weeklySalesInputs[indexOfLastWeek].salesInput.reduce(reducer);
        const lastWeekCover = weeklyCoverInputs[indexOfLastWeek].coversInput.reduce(reducer);

        response.lastWeekCovers = lastWeekCover;
        response.lastWeekSales = lastWeekSales;

        // console.log("weeklyCoverInputs[indexOfBestWasteWeeks].coversInput",weeklyCoverInputs[indexOfBestWasteWeeks].coversInput);

        // console.log("weeklyCoverInputs[indexOfBestWasteWeeks]",weeklyCoverInputs[indexOfBestWasteWeeks]);

        if (weeklyCoverInputs[indexOfBestWasteWeeks]) {
            console.log("here");
            response.bestWasteWeeksCovers = weeklyCoverInputs[indexOfBestWasteWeeks].coversInput.reduce(reducer);
            response.bestWasteWeeksSales = weeklySalesInputs[indexOfBestWasteWeeks].salesInput.reduce(reducer);
        } else {
            console.log("here here");
            // if cover inputs item is not updated with more than one week
            response.bestWasteWeeksCovers = weeklyCoverInputs[0].coversInput.reduce(reducer);
            response.bestWasteWeeksSales = weeklySalesInputs[0].salesInput.reduce(reducer);
        };

        // console.log("weeklyWasteArr",weeklyWasteArr);
        const averageWeeklyWaste = parseInt(weeklyWasteArr.reduce(reducer) / weeklyWasteArr.length);

        response.averageWasteWeeks = averageWeeklyWaste;
        const differenceBetweenAverageAndActualWaste = [];

        weeklyWasteArr.map((data) => {
            differenceBetweenAverageAndActualWaste.push(parseInt(Math.abs(averageWeeklyWaste - data)));
        });

        const indexOfValueClosestToAverage = differenceBetweenAverageAndActualWaste.indexOf(Math.min(...differenceBetweenAverageAndActualWaste));
        response.averageWasteWeeksDate = weeklyWasteData[indexOfValueClosestToAverage].Date;

        // console.log("indexOfValueClosestToAverage",indexOfValueClosestToAverage);
        // console.log("weeklyCoverInputs[indexOfValueClosestToAverage].coversInput",weeklyCoverInputs[indexOfValueClosestToAverage]);

        if (weeklyCoverInputs[indexOfValueClosestToAverage]) {
            console.log("here");
            response.averageWasteWeeksCovers = weeklyCoverInputs[indexOfValueClosestToAverage].coversInput.reduce(reducer);
            response.averageWasteWeeksSales = weeklySalesInputs[indexOfValueClosestToAverage].salesInput.reduce(reducer);
        } else {
            console.log("here here");
            // if cover inputs item is not updated with more than one week
            response.averageWasteWeeksCovers = weeklyCoverInputs[0].coversInput.reduce(reducer);
            response.averageWasteWeeksSales = weeklySalesInputs[0].salesInput.reduce(reducer);
        };

        // response.averageWasteWeeksCovers = weeklyCoverInputs[indexOfValueClosestToAverage].coversInput.reduce(reducer);
        // response.averageWasteWeeksSales = weeklySalesInputs[indexOfValueClosestToAverage].salesInput.reduce(reducer);

        // const averageWeekSales = weeklySalesInputs[indexOfValueClosestToAverage].salesInput.reduce(reducer);
        // const averageWeekCovers = weeklyCoverInputs[indexOfValueClosestToAverage].coversInput.reduce(reducer);

        let averageWeekSales;
        let averageWeekCovers;

        if (weeklyCoverInputs[indexOfValueClosestToAverage]) {
            console.log("here");
             averageWeekSales = weeklySalesInputs[indexOfValueClosestToAverage].salesInput.reduce(reducer);
             averageWeekCovers = weeklyCoverInputs[indexOfValueClosestToAverage].coversInput.reduce(reducer);
        } else {
            console.log("here here");
            // if cover inputs item is not updated with more than one week
             averageWeekSales = weeklySalesInputs[0].salesInput.reduce(reducer);
             averageWeekCovers = weeklyCoverInputs[0].coversInput.reduce(reducer);
        };

        // console.log("averageWeeklyWaste",averageWeeklyWaste);

        response.wastePerCover = averageWeeklyWaste / averageWeekCovers !== Infinity ? averageWeeklyWaste / averageWeekCovers : 0;
        response.wastePerSales = averageWeeklyWaste / averageWeekSales  !== Infinity ? averageWeeklyWaste / averageWeekSales : 0;

        response.lastWastePerCover = lastWeekWaste / lastWeekCover !== Infinity ? lastWeekWaste / lastWeekCover : 0;
        response.lastWastePerSales = lastWeekWaste / lastWeekSales  !== Infinity ? lastWeekWaste / lastWeekSales : 0;

        console.log("response",response);
        return success({response});
    }
    catch(error){
        return failure(error.message);
    }
};