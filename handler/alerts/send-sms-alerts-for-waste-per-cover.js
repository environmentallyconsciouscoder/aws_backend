import { success, failure } from "../../libs/response-lib";
import {
  getAllUsersList,
  getAllCompanySites,
  getAllCappingsData,
  getAllCompanies
} from '../../utils/Queries';
import {
  getSpecificCappingData,
  getCompanyUsers,
  formatPhoneNumber,
  getMonthAsAnumber,
  roundToX,
  getUniqueCompanyAndSite,
  getCurrentDayOfYear,
} from '../../utils/common';
import { sendSmsAlert } from "../../utils/notifications";
import { createCappingMessage } from '../../utils/smsAlertMessages';

import { wastePerCover } from '../correlated-data/get-waste-per-cover-function';

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

        const month = getMonthAsAnumber();

        const event = {queryStringParameters: {
          id: id,
          company: company,
          site: siteId,
          month: month
        }};

        const res = await wastePerCover(event);
        // console.log("res",res);
        let siteCappingData = await getAllCappingsData(id,companyName,siteId);

        let wasteCappings = getSpecificCappingData(siteCappingData.wastePerCoverCappingValues);

        const index = res.wastePerCoverForAllWaste.length - 1;

        // console.log("res.wastePerCoverForPreparationWaste",res.wastePerCoverForPreparationWaste)
        // console.log("res.wastePerCoverForPreparationWaste.length",res.wastePerCoverForPreparationWaste.length)

        let coverWasteMax = res.wastePerCoverForCoverWaste[index] !== undefined ? res.wastePerCoverForCoverWaste[index - 1]: 0;
        let preparationWasteMax = res.wastePerCoverForPreparationWaste[index] !== undefined ? res.wastePerCoverForPreparationWaste[index - 1]: 0;
        let spoilageWasteMax = res.wastePerCoverForSpoilageWaste[index] !== undefined ? res.wastePerCoverForSpoilageWaste[index - 1]: 0;

        let coverPresentMessage = '';
        let preparationPresentMessage = '';
        let spoilagePresentMessage = '';

        // console.log("preparationWasteMax",preparationWasteMax);
        // console.log("wasteCappings['P']",wasteCappings['P']);
        // console.log("preparationWasteMax > wasteCappings['P']",preparationWasteMax > wasteCappings['P']);

        if(coverWasteMax+3 > wasteCappings['C'] && coverWasteMax < wasteCappings['C']){
          const strValue = roundToX(wasteCappings['C'],2)+'-'+roundToX(coverWasteMax,2);
          coverPresentMessage=`The Capping Limits for Cover waste (waste per cover) nearly reached:${strValue} = ${roundToX(wasteCappings['C']-coverWasteMax,2)} Kg`;
        }
        else if(coverWasteMax > wasteCappings['C']){
          const strValue = roundToX(wasteCappings['C'],2)+'-'+roundToX(coverWasteMax,2);
          coverPresentMessage=`The Capping Limits for Cover waste (waste per cover) was exceeded.Please be mindful:${strValue} = ${roundToX(wasteCappings['C']-coverWasteMax,2)} Kg`;
        }
        if(preparationWasteMax+3 > wasteCappings['P'] && preparationWasteMax < wasteCappings['P']){
          const strValue = roundToX(wasteCappings['P'],2)+'-'+roundToX(preparationWasteMax,2);
          preparationPresentMessage=`The Capping Limits for Prep waste (waste per cover) nearly reached:${strValue} = ${roundToX(wasteCappings['P']-preparationWasteMax,2)} Kg`;
        }
        else if(preparationWasteMax > wasteCappings['P']){
          const strValue = roundToX(wasteCappings['P'],2)+'-'+roundToX(preparationWasteMax,2);
          preparationPresentMessage=`The Capping Limits for Prep waste (waste per cover) was exceeded.Please be mindful:${strValue} = ${roundToX(wasteCappings['P']-preparationWasteMax,2)} Kg`;
        }
        if(spoilageWasteMax+3 > wasteCappings['S'] && spoilageWasteMax < wasteCappings['S']){
          const strValue = roundToX(wasteCappings['S'],2)+'-'+roundToX(spoilageWasteMax,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste (waste per cover) nearly reached:${strValue} = ${roundToX(wasteCappings['S']-spoilageWasteMax,2)} Kg`;
        }
        else if(spoilageWasteMax > wasteCappings['S']){
          const strValue = roundToX(wasteCappings['S'],2)+'-'+roundToX(spoilageWasteMax,2);
          spoilagePresentMessage=`The Capping Limits for Spoilage waste (waste per cover) was exceeded.Please be mindful:${strValue} = ${roundToX(wasteCappings['S']-spoilageWasteMax,2)} Kg`;
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
            let message = createCappingMessage('Daily (Waste Per Cover)',companyData);
            let editedPhoneNumber = formatPhoneNumber(companyUsers[i]['custom:mobile']);
            await sendSmsAlert(message,editedPhoneNumber);
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