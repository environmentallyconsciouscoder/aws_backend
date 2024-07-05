import { success, failure } from "../../libs/response-lib";
import {
  getMonthlyWasteData,
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
    const currMonth = new Date().getMonth();
    const users = await getAllUsersList();
    const allCompanies =  getAllCompanies(users);
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
      const siteData = [];
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        let siteMonthlyDataCurrentYear = await getMonthlyWasteData(id,companyName,siteId,currYear);
        let siteCappingData = await getAllCappingsData(id,companyName,siteId);
        let monthlyCappings = getSpecificCappingData(siteCappingData.monthlyCappingValues);
        const {coverWaste,preparationWaste,spoilageWaste} = siteMonthlyDataCurrentYear;
        // const lastMonthData = siteMonthlyData[siteMonthlyData]
        const currCoverWaste = coverWaste[currMonth];
        const currPrepWaste = preparationWaste[currMonth];
        const currSpoilageWaste = spoilageWaste[currMonth];
        let coverPresentMessage = '';
        let preparationPresentMessage = '';
        let spoilagePresentMessage = '';
        if(currCoverWaste+10 > monthlyCappings['C'] && currCoverWaste < monthlyCappings['C']){
          const strValue = roundToX(monthlyCappings['C'],2)+'-'+roundToX(currCoverWaste,2);
          coverPresentMessage=`The Capping Limits for Cover waste nearly reached:${strValue} = ${roundToX(monthlyCappings['C']-currCoverWaste,2)} Kg`;
        }
        else if(currCoverWaste > monthlyCappings['C']){
          const strValue = roundToX(monthlyCappings['C'],2)+'-'+roundToX(currCoverWaste,2);
          coverPresentMessage=`The Capping Limits for Cover waste was exceeded.Please be mindful:${strValue} = ${roundToX(monthlyCappings['C']-currCoverWaste,2)} Kg`;
        }
        if(currPrepWaste+10 > monthlyCappings['P'] && currPrepWaste < monthlyCappings['P']){
          const strValue = roundToX(monthlyCappings['P'],2)+'-'+roundToX(currPrepWaste,2);
          preparationPresentMessage=`The Capping Limits for Prep waste nearly reached:${strValue} = ${roundToX(monthlyCappings['P']-currPrepWaste,2)} Kg`;
        }
        else if(currPrepWaste > monthlyCappings['P']){
          const strValue = roundToX(monthlyCappings['P'],2)+'-'+roundToX(currPrepWaste,2);
          preparationPresentMessage=`The Capping Limits for Prep waste was exceeded.Please be mindful:${strValue} = ${roundToX(monthlyCappings['P']-currPrepWaste,2)} Kg`;
        }
        if(currSpoilageWaste+10 > monthlyCappings['S'] && currSpoilageWaste < monthlyCappings['S']){
          const strValue = roundToX(monthlyCappings['S'],2)+'-'+roundToX(currSpoilageWaste,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste nearly reached:${strValue} = ${roundToX(monthlyCappings['S']-currSpoilageWaste,2)} Kg`;
        }
        else if(currSpoilageWaste > monthlyCappings['S']){
          const strValue = roundToX(monthlyCappings['S'],2)+'-'+roundToX(currSpoilageWaste,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste was exceeded.Please be mindful:${strValue} = ${roundToX(monthlyCappings['S']-currSpoilageWaste,2)} Kg`;
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
            let message = createCappingMessage('Monthly',companyData);
            let editedPhoneNumber = formatPhoneNumber(companyUsers[i]['custom:mobile']);
            await sendSmsAlert(message,editedPhoneNumber);
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