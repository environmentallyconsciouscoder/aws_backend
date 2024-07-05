import { success, failure } from "../../libs/response-lib";
import {
  getAllCompaniesFromMasterTable,
  getWeeklyCoverInputs,
  getWeeklySalesInput,
  getWeeklyMenuInput,
  getAllUsersList,
  getAllCompanySites,
} from '../../utils/Queries';
import {
  formatPhoneNumber,
  getCompanyUsers
} from '../../utils/common';
import { sendSmsAlert } from "../../utils/notifications";
import { createInputMessage } from '../../utils/smsAlertMessages';
export async function main(event,context){
  try{
    const currYear = new Date().getFullYear();
    const users = await getAllUsersList();
    const allCompanies = await getAllCompaniesFromMasterTable();
    // const coverInputsData = await getWeeklyCoverInputs('1000','falmouthUniversity','1_STANNARY','2021');
    const companiesAndSite = [];
    // Get all the siteNames for each company
    for(let i = 0; i<allCompanies.length; i++){
      let { allSites } = await getAllCompanySites(allCompanies[i],currYear);
      let val = {
        company: allCompanies[i],
        allSites
      };
      companiesAndSite.push(val);
    }

    for(let i = 0; i<companiesAndSite.length; i++){
      let currentTable = companiesAndSite[i];
      const {id,company} = currentTable.company;
      const companyName = company;
      const companyUsers = getCompanyUsers(users,companyName,id);
      //first check that the company coverInputData attribute is set to 1 before proceeding
      let siteData = [];
      let activeSites = currentTable.allSites.length;
      for(let i =0; i<currentTable.allSites.length; i++){
        let siteId = currentTable.allSites[i];
        let coverInputMessage = '';
        let salesInputMessage = '';
        let menuInputMessage = '';
        if(currentTable.company.inputsFromUser.coverInputData){
          const weeklyCoverInput = await getWeeklyCoverInputs(id,companyName,siteId,currYear);
          if(weeklyCoverInput.length){
            const currWeekCoverInput = weeklyCoverInput[weeklyCoverInput.length-1];
            const { coversInput } = currWeekCoverInput;
            const nonZeroCoversInput = coversInput.filter(x => x!=0);
            if(nonZeroCoversInput.length < 4) {
              coverInputMessage = `Please help us and Input Number of covers (customers) which have not been supplied this week: ${nonZeroCoversInput.length} of 7 inputs`;
            }
          }
        }
        if(currentTable.company.inputsFromUser.salesInputData){
          let siteId = currentTable.allSites[i];
          const weeklySalesInput = await getWeeklySalesInput(id,companyName,siteId,currYear);
          if(weeklySalesInput.length){
            const currWeekSalesInput = weeklySalesInput[weeklySalesInput.length-1];
            const { salesInput } = currWeekSalesInput;
            const nonZeroSalesInput = salesInput.filter(x => x!=0);
            if(nonZeroSalesInput.length < 4) {
              salesInputMessage = `Please help us and Input Daily Sales of Food which have not been supplied this week ${nonZeroSalesInput.length} of 7 inputs`;
            }
          }
        }
        if(currentTable.company.inputsFromUser.menuInputData){
          const weeklyMenuInput = await getWeeklyMenuInput(id,companyName,siteId,currYear);

          if(weeklyMenuInput.length){
            const currWeekMenuInput = weeklyMenuInput[weeklyMenuInput.length-1];
            const { menuWasteWeek } = currWeekMenuInput;
            const nonZeroMenuInput = menuWasteWeek.filter(value => value[0].sales != 0);
            if(nonZeroMenuInput.length < 4) {
              menuInputMessage = `Please help us and Input the top Selling Menu Items of Food which have not been supplied this week: ${nonZeroMenuInput.length} of 7 inputs`;
            }
          }
        }

        let inputMessages = [coverInputMessage,salesInputMessage,menuInputMessage];
        let finalMessage = inputMessages.filter(msg => msg.length>0);
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
        const companyUsersToSendAlert = companyUsers.filter(user => user['custom:smsAlerts']=='true');
        if(companyUsersToSendAlert.length){
          for(let i =0; i<companyUsersToSendAlert.length; i++){
            companyData = {
              ...companyData,
              // userName: companyUsers[i]['name']
              userName: companyUsersToSendAlert[i]['name']
            };

            let message = createInputMessage(companyData);
            let editedPhoneNumber = formatPhoneNumber(companyUsersToSendAlert[i]['custom:mobile']);
            // console.log(message);
            await sendSmsAlert(message,editedPhoneNumber);
          }
        }
      }
    }
    return success({users});
  }
  catch(e){
    console.log("e",e);
    return failure({ status: false });
  }
}