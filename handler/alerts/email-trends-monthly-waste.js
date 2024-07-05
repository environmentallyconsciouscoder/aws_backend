import { success, failure } from "../../libs/response-lib";
import {
  getMonthlyWasteData,
  getAllUsersList,
  getAllCompanySites,
  getAllCompanies
} from '../../utils/Queries';
import {
  getCompanyUsers,
  canReceiveMonthlyTrendAlert,
  roundToX,
  getUniqueCompanyAndSite,
  startAndPrevMonth,
  formatCompanyName,
} from '../../utils/common';
import { sendEmailReport } from "../../utils/notifications";
import { monthlyTrendsEmailTemplate } from "../../utils/emailMessages";
import { calculateMontlyChanges } from "../../utils/trends";

export async function main(event, context) {
  try {
    const currYear = new Date().getFullYear();
    const previousYear = currYear - 1;
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
      const {id,company,startDate} = currentTable.company;
      const companyName = company;
      const activeSites = currentTable.allSites.length;
      const startMonth = new Date(startDate).getMonth();
      const startYear = new Date(startDate).getFullYear();
      const companyUsers = getCompanyUsers(users,companyName,id);
      let siteData = [];
      for(let i = 0; i<currentTable.allSites.length; i++){
        let siteMessages = [];
        let siteId = currentTable.allSites[i];
        let siteMonthlyDataCurrentYear = await getMonthlyWasteData(id,companyName,siteId,currYear);
        let siteMonthlyDataPreviousYear = await getMonthlyWasteData(id,companyName,siteId,previousYear);
        const coverWasteForTrend = calculateMontlyChanges(siteMonthlyDataCurrentYear.coverWaste,siteMonthlyDataPreviousYear.coverWaste,currMonth);
        const preparationWasteForTrend = calculateMontlyChanges(siteMonthlyDataCurrentYear.preparationWaste,siteMonthlyDataPreviousYear.preparationWaste,currMonth);
        const spoilageWasteForTrend = calculateMontlyChanges(siteMonthlyDataCurrentYear.spoilageWaste,siteMonthlyDataPreviousYear.spoilageWaste,currMonth);
        let coverWasteTrendMessage = '';
        let preparationWasteTrendMessage = '';
        let spoilageWasteTrendMessage = '';
        //check if user can receive monthly trend alert.True if this is not their first month
        if(canReceiveMonthlyTrendAlert(startYear,startMonth)){
          const coverTrend = roundToX(coverWasteForTrend[coverWasteForTrend.length - 1],2);
          const prepTrend = roundToX(preparationWasteForTrend[preparationWasteForTrend.length - 1],2);
          const spoilageTrend = roundToX(spoilageWasteForTrend[spoilageWasteForTrend.length-1],2);
          coverWasteTrendMessage = (coverTrend ==0?`No change of cover waste. 0 Kg`:coverTrend>0?`Increased by ${coverTrend} Kg of cover waste`:`Decreased by ${coverTrend} Kg of cover waste`);
          preparationWasteTrendMessage = (prepTrend ==0?`No change of prep waste. 0 Kg`:prepTrend>0?`Increased by ${prepTrend} Kg of prep waste`:`Decreased by ${prepTrend} Kg of prep waste`);
          spoilageWasteTrendMessage = (spoilageTrend ==0?`No change of spoilage waste. 0 Kg`:spoilageTrend>0?`Increased by ${spoilageTrend} Kg of spoilage waste`:`Decreased by ${spoilageTrend} Kg of spoilage waste`);
          siteMessages.push(...[coverWasteTrendMessage,preparationWasteTrendMessage,spoilageWasteTrendMessage]);
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
        startMonth: startAndPrevMonth().startMonth,
        previousMonth: startAndPrevMonth().prevMonth,
      };
      if(companyUsers.length && canReceiveMonthlyTrendAlert(startYear,startMonth)){
        for(let i = 0; i<companyUsers.length; i++){
          if(companyUsers[i]['custom:emailAlerts'] === 'true'){
            companyData = {
                ...companyData,
                userName: companyUsers[i]['name']
            };
            const message = monthlyTrendsEmailTemplate(companyData);
            const emailSubject = `Monthly Trends Reports for ${formatCompanyName(companyName)} from Greenkode for ${startAndPrevMonth().startMonth}`;
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