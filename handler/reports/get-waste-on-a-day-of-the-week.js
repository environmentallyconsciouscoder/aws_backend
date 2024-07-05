import { failure, success } from "../../libs/response-lib";
import { getDailyElectricalData } from '../../utils/Queries';
import { getWeeksInYear,getWeeksInMonths,roundToX,wasteTypes, getCurrentWeekNumberInTheYear } from '../../utils/common';
import { lookForPatterns } from '../../utils/sawtooth';
export const main = async(event, context, callback) => {
    try{
        const id = event.queryStringParameters.id;
        const companyName = event.queryStringParameters.company;
        const siteId = event.queryStringParameters.site;
        const day = event.queryStringParameters.day;

        // const year = event.queryStringParameters.year;
        // const id = "1003";
        // const companyName = "harveyNicholsRestaurantLtd";
        // const siteId = "1003_OXOTOWER";

        // const id = "1000";
        // const companyName = "falmouthUniversity";
        // const siteId = "1_STANNARY";
        // const day = "0";

        const year = new Date().getFullYear();
        const siteName = siteId.split('_')[1].toLowerCase();
        //Get the number of weeks in the year and initialise array of zeros
        const weeksInYear = getWeeksInYear(year);
        const coverWasteArr = new Array(weeksInYear).fill(0);
        const spoilageWasteArr = new Array(weeksInYear).fill(0);
        const preparationWasteArr = new Array(weeksInYear).fill(0);
        const xAxis = [];
        for(let i =1; i<=weeksInYear; i++){
            xAxis.push(i);
        }
        //week day mapped to numbers we use for reference
        // const dayWeekMap = {
        //     Sunday: 0,
        //     Monday: 1,
        //     Tuesday: 2,
        //     Wednesday: 3,
        //     Thursday: 4,
        //     Friday: 5,
        //     Saturday: 6
        // };
        let responseData = {
            siteName,
            wasteOnADayOfTheWeek : [
                {
                    coverWaste : [],
                    preparationWaste : [],
                    spoilageWaste : [],
                    allWaste : [],
                    xAxis:[],
                    weeks : []
                }
            ]
        };
        const dailyElectricalData = await getDailyElectricalData(id,companyName,siteId,year);
        //get first day and first date
        const firstDate = new Date(dailyElectricalData[0].dayOfTheYear[0].Date);
        const firstDateDay = firstDate.getDay();
        const dateDiff = Number(day) - firstDateDay;
        let nextPointer = 0;
        let startPoint;

        // console.log("firstDate",firstDate);
        const weekNumber = getCurrentWeekNumberInTheYear(firstDate);
        const startYear = firstDate.getFullYear();
        // console.log("startYear",startYear);

        if(dateDiff < 0){
            nextPointer = 7 + dateDiff;
        }
        else if(dateDiff > 0){
            nextPointer = dateDiff;
        }
        startPoint = new Date(firstDate.setDate(firstDate.getDate()+ nextPointer));

        const startPointDateString = startPoint.toISOString().split('T')[0];

        const indexOfStartPoint = dailyElectricalData[0].dayOfTheYear.findIndex(x => x.Date == startPointDateString);
        if(indexOfStartPoint == -1){
            return success({responseData});
        }

        const weeksInMonths = getWeeksInMonths(year);
        // coverWasteArr[0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].coverWaste,wasteTypes.coverWaste),1);
        // spoilageWasteArr[0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].spoilageWaste,wasteTypes.spoilageWaste),1);
        // preparationWasteArr[0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].preparationWaste,wasteTypes.preparationWaste),1);

        // for(let i = indexOfStartPoint+7,j=0; i<dailyElectricalData[0].dayOfTheYear.length; i+=7,j++){
        //     coverWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].coverWaste,wasteTypes.coverWaste),1);
        //     spoilageWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].spoilageWaste,wasteTypes.spoilageWaste),1);
        //     preparationWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].preparationWaste,wasteTypes.preparationWaste),1);
        // }

        coverWasteArr[startYear === year ? weekNumber : 0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].coverWaste,wasteTypes.coverWaste),1);
        spoilageWasteArr[startYear === year ? weekNumber : 0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].spoilageWaste,wasteTypes.spoilageWaste),1);
        preparationWasteArr[startYear === year ? weekNumber : 0] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[indexOfStartPoint].preparationWaste,wasteTypes.preparationWaste),1);

        for(let i = indexOfStartPoint+7,j=startYear === year ? weekNumber : 0; i<dailyElectricalData[0].dayOfTheYear.length; i+=7,j++){
            coverWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].coverWaste,wasteTypes.coverWaste),1);
            spoilageWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].spoilageWaste,wasteTypes.spoilageWaste),1);
            preparationWasteArr[j+1] = roundToX(lookForPatterns(dailyElectricalData[0].dayOfTheYear[i].preparationWaste,wasteTypes.preparationWaste),1);
        }

        // console.log("coverWasteArr",coverWasteArr);
        // console.log("spoilageWasteArr",spoilageWasteArr);
        // console.log("preparationWasteArr",preparationWasteArr);

        const list = [coverWasteArr,spoilageWasteArr,preparationWasteArr];
        const allWasteArr = list[0].map((x, idx) => list.reduce((sum, curr) => roundToX(sum + curr[idx],1), 0));
        responseData = {
            siteName,
            wasteOnADayOfTheWeek : [
                {
                    coverWaste : coverWasteArr,
                    preparationWaste : preparationWasteArr,
                    spoilageWaste : spoilageWasteArr,
                    allWaste : allWasteArr,
                    xAxis,
                    weeks:weeksInMonths
                }
            ]
        };
        return success({responseData});
    }
    catch(error){
        return failure(error.message);
    }
};