import { success, failure } from "../../libs/response-lib";
import {
  getDailyElectricalData,
  getAllUsersList,
  getAllCompanySites,
  getAllCappingsData,
  getAllCompanies
} from '../../utils/Queries';
import {
  getSpecificCappingData,
  getCompanyUsers,
  formatPhoneNumber,
  wasteTypes,
  roundToX,
  getUniqueCompanyAndSite,
  getCurrentDayOfYear
} from '../../utils/common';
import { lookForPatterns } from '../../utils/sawtooth';
import { sendSmsAlert } from "../../utils/notifications";
import { createCappingMessage } from '../../utils/smsAlertMessages';
export async function main(event, context) {
  try {
    const currYear = new Date().getFullYear();
    const users = await getAllUsersList();
    const currentDayOfYear = getCurrentDayOfYear(new Date());
    console.log({currentDayOfYear});
    // console.log("users",users);
    const allCompanies =  getAllCompanies(users);
    // const allCappings = await getAllCappingsData('1000','falmouthUniversity','1_STANNARY');
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
      const siteData = [];
      const companyUsers = getCompanyUsers(users,companyName,id);
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        let siteDailyElectricalData = await getDailyElectricalData(id,companyName,siteId,currYear);
        let siteCappingData = await getAllCappingsData(id,companyName,siteId);
        let dailyCappings = getSpecificCappingData(siteCappingData.dailyCappingValues);
        siteDailyElectricalData = siteDailyElectricalData[0].dayOfTheYear;
        let todayDailyElectricalData = siteDailyElectricalData.find(data => Number(data.dayOfYear) == currentDayOfYear);
        if(!todayDailyElectricalData){
          break;
        }
        // let todayDailyElectricalData = siteDailyElectricalData[siteDailyElectricalData.length - 2];
        let coverWasteMax = lookForPatterns(todayDailyElectricalData.coverWaste,wasteTypes.coverWaste);
        let preparationWasteMax = lookForPatterns(todayDailyElectricalData.preparationWaste,wasteTypes.preparationWaste);
        let spoilageWasteMax = lookForPatterns(todayDailyElectricalData.spoilageWaste,wasteTypes.spoilageWaste);
        let coverPresentMessage = '';
        let preparationPresentMessage = '';
        let spoilagePresentMessage = '';

        if(coverWasteMax+3 > dailyCappings['C'] && coverWasteMax < dailyCappings['C']){
          const strValue = roundToX(dailyCappings['C'],2)+'-'+roundToX(coverWasteMax,2);
          coverPresentMessage=`The Capping Limits for Cover waste nearly reached:${strValue} = ${roundToX(dailyCappings['C']-coverWasteMax,2)} Kg`;
        }
        else if(coverWasteMax > dailyCappings['C']){
          const strValue = roundToX(dailyCappings['C'],2)+'-'+roundToX(coverWasteMax,2);
          coverPresentMessage=`The Capping Limits for Cover waste was exceeded.Please be mindful:${strValue} = ${roundToX(dailyCappings['C']-coverWasteMax,2)} Kg`;
        }
        if(preparationWasteMax+3 > dailyCappings['P'] && preparationWasteMax < dailyCappings['P']){
          const strValue = roundToX(dailyCappings['P'],2)+'-'+roundToX(preparationWasteMax,2);
          preparationPresentMessage=`The Capping Limits for Prep waste nearly reached:${strValue} = ${roundToX(dailyCappings['P']-preparationWasteMax,2)} Kg`;
        }
        else if(preparationWasteMax > dailyCappings['P']){
          const strValue = roundToX(dailyCappings['P'],2)+'-'+roundToX(preparationWasteMax,2);
          preparationPresentMessage=`The Capping Limits for Prep waste was exceeded.Please be mindful:${strValue} = ${roundToX(dailyCappings['P']-preparationWasteMax,2)} Kg`;
        }
        if(spoilageWasteMax+3 > dailyCappings['S'] && spoilageWasteMax < dailyCappings['S']){
          const strValue = roundToX(dailyCappings['S'],2)+'-'+roundToX(spoilageWasteMax,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste nearly reached:${strValue} = ${roundToX(dailyCappings['S']-spoilageWasteMax,2)} Kg`;
        }
        else if(spoilageWasteMax > dailyCappings['S']){
          const strValue = roundToX(dailyCappings['S'],2)+'-'+roundToX(spoilageWasteMax,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste was exceeded.Please be mindful:${strValue} = ${roundToX(dailyCappings['S']-spoilageWasteMax,2)} Kg`;
        }
        let wasteMessages = [coverPresentMessage,preparationPresentMessage,spoilagePresentMessage];
        let finalMessage = wasteMessages.filter(msg => msg.length>0);
        let siteObj = {
          siteId,
          finalMessage
        };
        siteData.push(siteObj);
      }
      let companyData = {
        companyName,
        activeSites,
        siteData
      };
      if(companyData.siteData[0].finalMessage.length){
        for(let i =0; i<companyUsers.length; i++){
          if(companyUsers[i]['custom:smsAlerts'] == 'true'){
            companyData = {
              ...companyData,
              userName: companyUsers[i]['name']
            };
            let message = createCappingMessage('Daily',companyData);
            let editedPhoneNumber = formatPhoneNumber(companyUsers[i]['custom:mobile']);
            await sendSmsAlert(message,editedPhoneNumber);
            // console.log(message)
            // await sendSmsAlert(message,'+447842601123');
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