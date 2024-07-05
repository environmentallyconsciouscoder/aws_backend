import { success, failure } from "../../libs/response-lib";
import {
  getAllUsersList,
  getAllCompanies ,
  getAllCompanySites,
  getAiPredictionData,
  getCarbonMunicipalValue,
  getRecommendedTargetPercent
} from '../../utils/Queries';
import {
  getCompanyUsers,
  getUniqueCompanyAndSite,
  roundToX,
  startAndPrevMonth,
  computeTargetValues,
  formatCompanyName
} from '../../utils/common';
import { aiEmailTemplate } from "../../utils/emailMessages";
import { sendEmailReport } from '../../utils/notifications';
export async function main(event, context) {
  try {
    const currYear = new Date().getFullYear();
    const users = await getAllUsersList();
    const allCompanies = getAllCompanies(users);
    // const aiPrediction = await getAiPredictionData('1000','falmouthUniversity','1_STANNARY','2021');
    const companiesAndSite = [];
    // Get all the siteNames for each company
    for(let i = 0; i<allCompanies.length; i++){
      let {allSites} = await getAllCompanySites(allCompanies[i],currYear);
      let val = {
        company: allCompanies[i],
        allSites
      };
      companiesAndSite.push(val);
    }

    const uniqueCompanyAndSite = getUniqueCompanyAndSite(companiesAndSite);

    // get Daily value in each site and Daily capping

    for(let i = 0; i<uniqueCompanyAndSite.length; i++){
      let currentTable = uniqueCompanyAndSite[i];
      const {id,company} = currentTable.company;
      const companyName = company;
      const activeSites = currentTable.allSites.length;

      const companyUsers = getCompanyUsers(users,companyName,id);

      const carbonMunicipalValue = await getCarbonMunicipalValue(id,companyName);
      let siteData = [];
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        const { monthlyForcastsBasedOnCurrentMonth, weeklylyForcastsBasedOnCurrentMonth } = await getAiPredictionData(id,companyName,siteId,currYear);
        // let siteAiData = await getAiPredictionData(id,companyName,siteId,currYear);
        let {coverWaste,preparationWaste,spoilageWaste} = monthlyForcastsBasedOnCurrentMonth;
        const weeklyCoverForecast = weeklylyForcastsBasedOnCurrentMonth.coverWaste;
        const weeklyPrepForecast = weeklylyForcastsBasedOnCurrentMonth.preparationWaste;
        const weeklySpoilageForecast = weeklylyForcastsBasedOnCurrentMonth.spoilageWaste;
        let coverPresentMessage = '';
        let preparationPresentMessage = '';
        let spoilagePresentMessage = '';
        let weeklyCoverPresent = '';
        let weeklyPrepPresent = '';
        let weeklySpoilagePresent = '';
        let wasteMessages = [];
        if(Array.isArray(coverWaste)){
          if(coverWaste.length>1){
            const trendDifference = coverWaste[coverWaste.length - 1]-coverWaste[coverWaste.length - 2];
            coverPresentMessage =(trendDifference==0?`No change of cover waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of cover waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of cover waste`);
          }
        }
        if(Array.isArray(preparationWaste)){
          const trendDifference = preparationWaste[preparationWaste.length - 1]-preparationWaste[preparationWaste.length - 2];
          if(preparationWaste.length > 1){
            preparationPresentMessage =(trendDifference==0?`No change of prep waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of prep waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of prep waste`);
          }
        }
        if(Array.isArray(spoilageWaste)){
          const trendDifference = spoilageWaste[spoilageWaste.length - 1]-spoilageWaste[spoilageWaste.length - 2];
          if(spoilageWaste.length > 1){
            spoilagePresentMessage =(trendDifference==0?`No change of spoilage waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of spoilage waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of spoilage waste`);
          };
        }
        if(Array.isArray(weeklyCoverForecast)){
          if(weeklyCoverForecast.length>1){
            const trendDifference = weeklyCoverForecast[weeklyCoverForecast.length - 1]-weeklyCoverForecast[weeklyCoverForecast.length - 2];
            weeklyCoverPresent =(trendDifference==0?`No change of cover waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of cover waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of cover waste`);
          }
        }
        if(Array.isArray(weeklyPrepForecast)){
          const trendDifference = weeklyPrepForecast[weeklyPrepForecast.length - 1]-weeklyPrepForecast[weeklyPrepForecast.length - 2];
          if(weeklyPrepForecast.length > 1){
            weeklyPrepPresent =(trendDifference==0?`No change of prep waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of prep waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of prep waste`);
          }
        }
        if(Array.isArray(weeklySpoilageForecast)){
          const trendDifference = weeklySpoilageForecast[weeklySpoilageForecast.length - 1]-weeklySpoilageForecast[spoilageWaste.length - 2];
          if(weeklySpoilageForecast.length > 1){
            weeklySpoilagePresent =(trendDifference==0?`No change of spoilage waste. 0 Kg`:trendDifference>0?`Increased by ${roundToX(trendDifference,2)} Kg of spoilage waste`:`Decreased by ${roundToX(trendDifference,2)} Kg of spoilage waste`);
          };
        }
        const monthlyForecastValues = [coverPresentMessage,preparationPresentMessage,spoilagePresentMessage].filter(val => val.length>0);
        const weeklyForecastValues = [weeklyCoverPresent,weeklyPrepPresent,weeklySpoilagePresent].filter(val => val.length > 0);
        wasteMessages.push({monthlyForecastValues,weeklyForecastValues});
        const targetPercent = await getRecommendedTargetPercent(id,companyName,siteId,currYear);
        const targetData = computeTargetValues({coverWaste:coverWaste[coverWaste.length - 1],preparationWaste:preparationWaste[preparationWaste.length - 1],spoilageWaste:spoilageWaste[spoilageWaste.length-1]},targetPercent,carbonMunicipalValue);
        const site = {
          siteId,
          wasteMessages
        };
        siteData.push({site,targetData});
      }
      let companyData = {
        startMonth: startAndPrevMonth().startMonth,
        previousMonth: startAndPrevMonth().prevMonth,
        companyName,
        activeSites,
        siteData
      };
      if(companyData.siteData[0].site.wasteMessages.length){
        for(let i =0; i<companyUsers.length; i++){
          if(companyUsers[i]['custom:emailAlerts'] == 'true'){
            companyData = {
              ...companyData,
              userName: companyUsers[i]['name']
            };
            const message = aiEmailTemplate(companyData);
            const emailSubject = `AI Prediction Waste Trends Reports for ${formatCompanyName(companyName)} from Greenkode for ${startAndPrevMonth().startMonth}`;
            // console.log("companyUsers[i]['email']",companyUsers[i]['email']);
            await sendEmailReport(companyUsers[i]['email'],emailSubject,message);
          }
        }
      }
    }
    return success({uniqueCompanyAndSite});
  } catch (e) {
    console.log("e",e);
    return failure({ status: false });
  };
};