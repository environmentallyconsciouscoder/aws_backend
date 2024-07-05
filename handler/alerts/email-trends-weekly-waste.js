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
  canReceiveWeeklyTrendAlert,
  roundToX,
  getUniqueCompanyAndSite,
  addXDayToDate,
  formatCompanyName
} from '../../utils/common';
import { sendEmailReport } from '../../utils/notifications';
import { weeklyTrendsEmailTemplate } from '../../utils/emailMessages';
import { calculateWeeklyTrends } from "../../utils/trends";

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
    // get weekly value in each site
    for(let i = 0; i<uniqueCompanyAndSite.length; i++){
      let currentTable = uniqueCompanyAndSite[i];
      const activeSites = currentTable.allSites.length;
      const {id,company,startDate} = currentTable.company;
      const companyName = company;
      const startMonth = new Date(startDate).getMonth();
      const startYear = new Date(startDate).getFullYear();
      const companyUsers = getCompanyUsers(users,companyName,id);
      let siteData = [];
      let lastWeekStartDate;
      let lastWeekEndDate;
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        let siteMessages = [];
        let siteWeeklyWasteData = await getWeeklyWasteData(id,companyName,siteId,currYear);
        let coverWasteTrendMessage = '';
        let preparationWasteTrendMessage = '';
        let spoilageWasteTrendMessage = '';
        let thisWeekData;
        if(siteWeeklyWasteData.length>2){
          let lastWeekData = siteWeeklyWasteData[siteWeeklyWasteData.length - 3];
          thisWeekData = siteWeeklyWasteData[siteWeeklyWasteData.length - 2];
          lastWeekStartDate = siteWeeklyWasteData[siteWeeklyWasteData.length-2].Date;
          lastWeekEndDate = addXDayToDate(lastWeekStartDate,7);
          let thisWeekDataForTrend = [{
            data:thisWeekData
          }];
          let lastWeekDataForTrend = [{
            data:lastWeekData
          }];
          let trendData = calculateWeeklyTrends(thisWeekDataForTrend,lastWeekDataForTrend);
          if(canReceiveWeeklyTrendAlert(startYear,startMonth,startDate)){
            const coverWaste = trendData[0].coverWaste;
            const preparationWaste = trendData[0].prepWaste;
            const spoilageWaste = trendData[0].spoilageWaste;
            coverWasteTrendMessage = (coverWaste==0?`No change of cover waste. 0 Kg`:coverWaste>0?`Increased by ${roundToX(coverWaste,2)} Kg of cover waste`:`Decreased by ${roundToX(coverWaste,2)} Kg of cover waste`);
            preparationWasteTrendMessage = (preparationWaste==0?`No change of prep waste. 0 Kg`:preparationWaste>0?`Increased by ${roundToX(preparationWaste,2)} Kg of prep waste`:`Decreased by ${roundToX(preparationWaste,2)} Kg of prep waste`);
            spoilageWasteTrendMessage = (spoilageWaste ==0?`No change of spoilage waste. 0 Kg`:spoilageWaste>0?`Increased by ${roundToX(spoilageWaste,2)} Kg of spoilage waste`:`Decreased by ${roundToX(spoilageWaste,2)} Kg of spoilage waste`);
            siteMessages.push(...[coverWasteTrendMessage,preparationWasteTrendMessage,spoilageWasteTrendMessage]);
          }
        }
        const site = {
          siteId,
          siteMessages
        };
        siteData.push(site);
      }
      let companyData = {
        companyName,
        activeSites,
        siteData,
        lastWeekStartDate,
        lastWeekEndDate
      };
      if(companyUsers.length && canReceiveWeeklyTrendAlert(startYear,startMonth,startDate)){
        for(let i = 0; i<companyUsers.length; i++){
          if(companyUsers[i]['custom:emailAlerts'] === 'true'){
            companyData = {
                ...companyData,
                userName: companyUsers[i]['name']
            };
            const message = weeklyTrendsEmailTemplate(companyData);
            const emailSubject = `Weekly Trends Reports for ${formatCompanyName(companyName)} from Greenkode for last week ${lastWeekStartDate}`;
            await sendEmailReport(companyUsers[i]['email'],emailSubject,message);
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