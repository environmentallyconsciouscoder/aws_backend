import AWS from "aws-sdk";
import { failure, success } from "../../libs/response-lib";
import moment from 'moment';
import { lookForPatterns } from '../../utils/sawtooth';
import { wasteTypes,roundToX ,compare, getCurrentWeek} from '../../utils/common';
import { getDailyElectricalData } from '../../utils/Queries';
const dynamoDb = new AWS.DynamoDB.DocumentClient();
export const main = async (event, context, callback) => {
  try{
    const currentWeek = getCurrentWeek();
    // let id = "1000";
    // let companyName = "falmouthUniversity";
    // let siteId = "1_STANNARY";
    const currentYear = new Date().getFullYear();
    const id = event.queryStringParameters.id;
    const companyName = event.queryStringParameters.companyName;
    const siteId = event.queryStringParameters.siteID;
    //Query for menuInput
    const menuInputQuery = {
        TableName: `${id}_${companyName}_allReports`,
        KeyConditionExpression: "site = :menuInput",
        ExpressionAttributeValues: {
          ":menuInput": `${siteId}_menuInput_${currentYear}`,
        }
    };
    const menuInputResponse = (await dynamoDb.query(menuInputQuery).promise()).Items;
    const dailyElectricalData = await getDailyElectricalData(id,companyName,siteId,currentYear);
    //Get menu input data for current week
    const weekMenuInput = menuInputResponse[0].menuWaste.filter((w) => w.weekOfYear === currentWeek.toString());
    const { menuWasteWeek } = weekMenuInput[0];
    //Get dailyElectrical data for current week
    const startIndex = dailyElectricalData[0].dayOfTheYear.findIndex(data => data.Date === weekMenuInput[0].Date);
    //store the maximum value of cover,spoilage and preparation for each day of the week
    const dailyElectricalDataForWeek = [];
    if (startIndex == -1) {
      for(let i = 0; i < 7; i++){
        let data = {
          coverWaste:0,
          preparationWaste:0,
          spoilageWaste:0
        };
        dailyElectricalDataForWeek.push(data);
      }
    }
    //If there is no daily electrical data for the first day of the week but there is daily electrical data in some other day(because was added later in the week)
    // if(startIndex < 0){
    //   if(dailyElectricalData[0].dayOfTheYear.length > 0){
    //     let data = dailyElectricalData[0].dayOfTheYear;
    //     let dateOfFirstData = data[0].Date;
    //     let dayOfTheWeekForFirstData = new Date(dateOfFirstData).getDay();
    //     //if the first day is a sunday,set every day from monday to saturday data as zeros
    //     if(dayOfTheWeekForFirstData == 0){
    //       for(let i =0; i<6; i++){
    //         let data = {
    //           coverWaste:0,
    //           preparationWaste:0,
    //           spoilageWaste:0
    //         };
    //         dailyElectricalDataForWeek.push(data);
    //       }
    //       let sundayData = {
    //         coverWaste:lookForPatterns(data[0].coverWaste,wasteTypes.coverWaste),
    //         preparationWaste:lookForPatterns(data[0].preparationWaste,wasteTypes.preparationWaste),
    //         spoilageWaste:lookForPatterns(data[0].spoilageWaste,wasteTypes.spoilageWaste)
    //       };
    //       dailyElectricalDataForWeek.push(sundayData);
    //     }
    //     else{
    //       //fill every day of the week prior to first day with zeros
    //       for(let i =0; i<dayOfTheWeekForFirstData-1; i++){
    //         let data = {
    //           coverWaste:0,
    //           preparationWaste:0,
    //           spoilageWaste:0
    //         };
    //         dailyElectricalDataForWeek.push(data);
    //       }
    //       //the number of days left to be filled from starting day
    //       let daysLeft = (7-dayOfTheWeekForFirstData)+1;
    //       for(let i = 0; i<daysLeft; i++){
    //         let d = {
    //           coverWaste:data[i]?lookForPatterns(data[i].coverWaste,wasteTypes.coverWaste):0,
    //           preparationWaste:data[i]?lookForPatterns(data[i].preparationWaste,wasteTypes.preparationWaste):0,
    //           spoilageWaste:data[i]?lookForPatterns(data[i].spoilageWaste,wasteTypes.spoilageWaste):0
    //         };
    //         dailyElectricalDataForWeek.push(d);
    //       }
    //     }
    //   }
    //   //else if no daily electrical data,set all to zeros
    //   else{
    //     for(let i = 0; i < 7; i++){
    //       let data = {
    //         coverWaste:0,
    //         preparationWaste:0,
    //         spoilageWaste:0
    //       };
    //       dailyElectricalDataForWeek.push(data);
    //     }
    //   }
    // }
    //if there is data on the first day of the week
    // else{
      //store the maximum value of cover,spoilage and preparation for each day of the week
    // }
    //store the maximum value of cover,spoilage and preparation for each day of the week
    for(let i = startIndex,j=0; i < startIndex+7; i++,j++){
      const d = dailyElectricalData[0].dayOfTheYear[i];
      let data = {
        coverWaste:d?lookForPatterns(d.coverWaste,wasteTypes.coverWaste):0,
        preparationWaste:d?lookForPatterns(d.preparationWaste,wasteTypes.preparationWaste):0,
        spoilageWaste:d?lookForPatterns(d.spoilageWaste,wasteTypes.spoilageWaste):0
      };
      dailyElectricalDataForWeek.push(data);
    }
    //Calculate total waste perItem for each menuItem everyday of the week
    const newMenuWaste = menuWasteWeek.map((wasteForDay,index) => {
      const fullDate = (moment(weekMenuInput[0].Date).add(index,'d'));
      const dateString = fullDate.format('YYYY-MM-DD');
      return {
        date: dateString,
        menuItems: wasteForDay.map((w) => {
        const { weightPerItem,sales,wastePerCent,menuItem} = w;
        const totalWastePerItem = roundToX(sales * weightPerItem * (wastePerCent/100),2);
        return {
          itemName:menuItem,
          totalWastePerItem
        };
      }),
      preparationWasteMaxDailyValue:  dailyElectricalDataForWeek[index].preparationWaste,
      coverWasteMaxDailyValue: dailyElectricalDataForWeek[index].coverWaste,
      spoilageWasteMaxDailyValue: dailyElectricalDataForWeek[index].spoilageWaste
    };
    });
    newMenuWaste.map((waste) => {
      waste.menuItems.sort(compare);
      waste.menuItems =  waste.menuItems.slice(0,10);
      return waste;
    });
    return success({newMenuWaste});
  }
  catch(error){
    console.log(error);
    return failure(error.message);
  }
};