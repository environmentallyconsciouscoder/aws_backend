import { success, failure } from "../../libs/response-lib";
import {
  getWeeklyWasteData,
  getAllUsersList,
  getAllCompanySites,
  getAllCappingsData,
  getAllCompanies
} from '../../utils/Queries';
import {
  getSpecificCappingData,
  getCompanyUsers,
  formatPhoneNumber,
  roundToX,
  getUniqueCompanyAndSite
} from '../../utils/common';
import { sendSmsAlert } from "../../utils/notifications";
import { createCappingMessage } from '../../utils/smsAlertMessages';
export async function main(event, context) {
  try {
    const currYear = new Date().getFullYear();
    const users = await getAllUsersList();
    const allCompanies =  getAllCompanies(users);
    const allCappings = await getAllCappingsData('1000','falmouthUniversity','1_STANNARY');
    const dailySpec = getSpecificCappingData(allCappings.weeklyCappingValues);
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
    // get weekly value in each site and weekly capping
    for(let i = 0; i<uniqueCompanyAndSite.length; i++){
      let currentTable = uniqueCompanyAndSite[i];
      const {id,company} = currentTable.company;
      const companyName = company;
      const activeSites = currentTable.allSites.length;
      const companyUsers = getCompanyUsers(users,companyName,id);
      const siteData = [];
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        let siteWeeklyWasteData = await getWeeklyWasteData(id,companyName,siteId,currYear);
        let siteCappingData = await getAllCappingsData(id,companyName,siteId);
        let weeklyCapping = getSpecificCappingData(siteCappingData.weeklyCappingValues);
        let coverPresentMessage = '';
        let preparationPresentMessage = '';
        let spoilagePresentMessage = '';
        let thisWeekData;
        if(!siteWeeklyWasteData.length){
          break;
        }
        thisWeekData = siteWeeklyWasteData[siteWeeklyWasteData.length - 1];
        let {coverWaste,preparationWaste,spoilageWaste} = thisWeekData;
        if(coverWaste[0]+5 > weeklyCapping['C'] && coverWaste[0] < weeklyCapping['C']){
          const strValue = roundToX(weeklyCapping['C'],2)+'-'+roundToX(coverWaste[0],2);
          coverPresentMessage=`The Capping Limits for Cover waste nearly reached:${strValue} = ${roundToX(weeklyCapping['C']-coverWaste,2)} Kg`;
        }
        else if(coverWaste[0] > weeklyCapping['C']){
          const strValue = roundToX(weeklyCapping['C'],2)+'-'+roundToX(coverWaste[0],2);
          coverPresentMessage=`The Capping Limits for Cover waste was exceeded. Please be mindful:${strValue} = ${roundToX(weeklyCapping['C']-coverWaste,2)} Kg`;
        }
        if(preparationWaste[0]+5 > weeklyCapping['P'] && preparationWaste[0] < weeklyCapping['P']){
          const strValue = roundToX(weeklyCapping['P'],2)+'-'+roundToX(preparationWaste[0],2);
          preparationPresentMessage=`The Capping Limits for Prep waste nearly reached:${strValue} = ${roundToX(weeklyCapping['P']-preparationWaste,2)} Kg`;
        }
        else if(preparationWaste[0] > weeklyCapping['P']){
          const strValue = roundToX(weeklyCapping['P'],2)+'-'+roundToX(preparationWaste[0],2);
          preparationPresentMessage=`The Capping Limits for Prep waste was exceeded. Please be mindful:${strValue} = ${roundToX(weeklyCapping['P']-preparationWaste,2)} Kg`;
        }
        if(spoilageWaste[0]+5 > weeklyCapping['S'] && spoilageWaste[0] < weeklyCapping['S']){
          const strValue = roundToX(weeklyCapping['S'],2)+'-'+roundToX(spoilageWaste[0],2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste nearly reached:${strValue} = ${roundToX(weeklyCapping['S']-spoilageWaste,2)} Kg`;
        }
        else if(spoilageWaste[0] > weeklyCapping['S']){
          const strValue = roundToX(weeklyCapping['S'],2)+'-'+roundToX(spoilageWaste[0],2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste was exceeded. Please be mindful:${strValue} = ${roundToX(weeklyCapping['S']-spoilageWaste,2)} Kg`;
        }
        let wasteMessages = [coverPresentMessage,preparationPresentMessage,spoilagePresentMessage];
        let finalMessage = wasteMessages.filter(msg => msg.length>0);
        if(!finalMessage.length){
          break;
        }
        let siteObj = {
          siteId,
          finalMessage
        };
        siteData.push(siteObj);
        // let companyData = {
        //   companyName,
        //   activeSites,
        //   siteData
        // };

        // if(companyData.siteData[0].finalMessage.length){
        //   for(let i =0; i<companyUsers.length; i++){
        //     if(companyUsers[i]['custom:smsAlerts'] == 'true'){
        //       companyData = {
        //         ...companyData,
        //         userName: companyUsers[i]['name']
        //       };
        //       let message = createCappingMessage('Weekly',companyData);
        //       let editedPhoneNumber = formatPhoneNumber(companyUsers[i]['custom:mobile']);
        //       await sendSmsAlert(message,editedPhoneNumber);
        //       // await sendSmsAlert(message,'+447842601123');
        //     }
        //   }
        // }
      }

      let companyData = {
        companyName,
        activeSites,
        siteData
      };
      if (companyData.siteData[0] !== undefined) {
        if(companyData.siteData[0].finalMessage.length){
          for(let i =0; i<companyUsers.length; i++){
            if(companyUsers[i]['custom:smsAlerts'] == 'true'){
              companyData = {
                ...companyData,
                userName: companyUsers[i]['name']
              };
              let message = createCappingMessage('Weekly',companyData);
              let editedPhoneNumber = formatPhoneNumber(companyUsers[i]['custom:mobile']);
              await sendSmsAlert(message,editedPhoneNumber);
              // await sendSmsAlert(message,'+447842601123');
            }
          }
        }
      }

    }
    return success({uniqueCompanyAndSite,dailySpec});
  } catch (e) {
    console.log("e",e);
    return failure({ status: false });
  };
};