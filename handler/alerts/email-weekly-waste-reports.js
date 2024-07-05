import { success, failure } from "../../libs/response-lib";
import {
    getCompanyUsers,
    roundToX,
    getUniqueCompanyAndSite,
    addXDayToDate,
    formatCompanyName,
    reducer
 } from "../../utils/common";
import { sendEmailReport } from '../../utils/notifications';
import {
    getAllCompanies,
    getAllCompanySites,
    getAllUsersList,
    getWeeklyWasteData,
    getCarbonMunicipalValue,
    getWeeklyCoverInputs,
    getWeeklySalesInput
} from "../../utils/Queries";
import { emailTemplate } from "../../utils/emailMessages";

export const main = async (event, context, callback) => {
    try{
        const users = await getAllUsersList();
        const currYear = new Date().getFullYear();
        const usersToReceiveEmailAlerts = users.filter(user => user['custom:emailAlerts']=='true');
        const allCompanies = getAllCompanies(usersToReceiveEmailAlerts);
        const companiesAndSite = [];
        // Get all the siteNames for each company
        for(let i = 0; i<allCompanies.length; i++){
            let {allSites,totalWaste} = await getAllCompanySites(allCompanies[i],currYear);
            let val = {
                company: allCompanies[i],
                allSites,
                totalWaste
            };
            companiesAndSite.push(val);
        }
        const uniqueCompanyAndSite = getUniqueCompanyAndSite(companiesAndSite);
        for(let i =0; i<uniqueCompanyAndSite.length; i++){
            let currentTable = uniqueCompanyAndSite[i];
            const {id,company} = currentTable.company;
            const { totalWaste } = currentTable;
            const companyName = company;
            const companyUsers = getCompanyUsers(users,companyName,id);
            const carbonMunicipalValue = await getCarbonMunicipalValue(id,companyName);
            const { allSites } = currentTable;
            const activeSites = allSites.length;
            let lastWeekStartDate;
            let lastWeekEndDate;
            let siteData = [];

            let coverInputs;
            let salesInputs;

            for(let i = 0; i<allSites.length; i++){
                const siteId = allSites[i];
                const weeklyWasteData = await getWeeklyWasteData(id,companyName,siteId,currYear);
                if(!weeklyWasteData.length){
                    continue;
                }
                lastWeekStartDate = weeklyWasteData[weeklyWasteData.length-2].Date;
                lastWeekEndDate = addXDayToDate(lastWeekStartDate,7);
                const siteWasteSummary = totalWaste.sites.filter(site => site.siteName === siteId)[0];
                const {
                    coverWaste,
                    preparationWaste,
                    spoilageWaste,
                    trend :{sumTrendCover,sumTrendPrep,sumTrendSpoil}}
                = siteWasteSummary;
                const totalFoodWaste = `${roundToX(coverWaste+preparationWaste+spoilageWaste,2)}`;
                const totalMoneyConversion = `£${roundToX(2.775*totalFoodWaste,2)}`;
                const totalCabonDioxide = `${roundToX(carbonMunicipalValue*totalFoodWaste,2)} Kg`;
                const totalWasteOfMeals = Math.round(totalFoodWaste/0.36);
                const moneyConversionCover = `£${roundToX(2.775*coverWaste,2)}`;
                const moneyConversionPrep = `£${roundToX(2.775*preparationWaste,2)}`;
                const moneyConversionSpoil = `£${roundToX(2.775*spoilageWaste,2)}`;
                const specificWasteStreamArray = [];
                //remember to change this to > 2 when we have enough data in the testing sites
                if(weeklyWasteData.length>2){
                    const currWeekData = weeklyWasteData[weeklyWasteData.length-2]; //change to -2
                    const lastWeekData = weeklyWasteData[weeklyWasteData.length-3]; //change to -3
                    if(coverWaste>0){
                        const coverWasteStreamObj = createWasteStreamObject(currWeekData.coverWaste,lastWeekData.coverWaste,"cover");
                        specificWasteStreamArray.push(coverWasteStreamObj);
                    }
                    if(preparationWaste>0){
                        const prepWasteStreamObj = createWasteStreamObject(currWeekData.preparationWaste,lastWeekData.preparationWaste,"preparation");
                        specificWasteStreamArray.push(prepWasteStreamObj);
                    }
                    if(spoilageWaste>0){
                        const spoilageWasteStreamObj = createWasteStreamObject(currWeekData.spoilageWaste,lastWeekData.spoilageWaste,"spoilage");
                        specificWasteStreamArray.push(spoilageWasteStreamObj);
                    }
                }
                else{
                    continue;
                }

                let weeklyCoverInputs = await getWeeklyCoverInputs(id, companyName, siteId, currYear);
                weeklyCoverInputs.map((item) => {
                    if (item.Date == lastWeekStartDate) {
                        coverInputs = item.coversInput.reduce(reducer);
                    };
                });

                let weeklySalesInputs = await getWeeklySalesInput(id, companyName, siteId, currYear);
                weeklySalesInputs.map((item) => {
                    if (item.Date == lastWeekStartDate) {
                        salesInputs = item.salesInput.reduce(reducer);
                    };
                });

                const siteObj = {
                    siteName: siteId,
                    totalFoodWaste,
                    totalMoneyConversion,
                    totalCabonDioxide,
                    totalWasteOfMeals,
                    coverWaste,
                    preparationWaste,
                    spoilageWaste,
                    sumTrendCover:sumTrendCover<0?sumTrendCover:`+${sumTrendCover}`,
                    sumTrendPrep:sumTrendPrep<0?sumTrendPrep:`+${sumTrendPrep}`,
                    sumTrendSpoil:sumTrendSpoil<0?sumTrendSpoil:`+${sumTrendSpoil}`,
                    moneyConversionCover,
                    moneyConversionPrep,
                    moneyConversionSpoil,
                    specificWasteStreamArray,

                    coverInputs,
                    salesInputs
                };
                siteData.push(siteObj);
            }
            let companyData = {
                companyName,
                activeSites,
                siteData,
                lastWeekStartDate,
                lastWeekEndDate
            };

            if(companyUsers.length){
                for(let i = 0; i<companyUsers.length; i++){
                    if(companyUsers[i]['custom:emailAlerts'] === 'true'){
                        companyData = {
                            ...companyData,
                            userName: companyUsers[i]['name']
                        };
                        const message = emailTemplate(companyData, coverInputs, salesInputs);
                        const emailSubject = `Weekly Reports for ${formatCompanyName(companyName)} from Greenkode for last week ${lastWeekStartDate}`;
                        await sendEmailReport(companyUsers[i]['email'],emailSubject,message);
                    }
                }
            }
        }
        return success({users,uniqueCompanyAndSite});
    }
    catch(err){
        console.log(err);
        return failure(err.message);
    }
};

const createWasteStreamObject = (currWeekData,lastWeekData,type) => {
    const thisWeekVal = currWeekData[0];
    const lastWeekVal = lastWeekData[0];
    const moneyConversion = `£${roundToX(thisWeekVal*2.775,2)}`;
    const emailText = [];
    const diff = lastWeekVal - thisWeekVal;
    const diffMoneyConversion = `£${roundToX(Math.abs(diff * 2.775),2)}`;
    if(diff < 0){
        emailText[0] = "has increased by";
        emailText[1] = "Unfortunately,you have gained waste on";
    }
    else if(diff === 0){
        emailText[0] = "has not changed";
        emailText[1] = "Thank you for the no change on";
    }
    else{
        emailText[0] = "has decreased by";
        emailText[1] = "Thank you for the saving on";
    }
    const responseData = {
        thisWeekVal: `${thisWeekVal} Kg`,
        type,
        moneyConversion,
        difference: `${roundToX(Math.abs(diff),2)} Kg`,
        diffMoneyConversion,
        emailText
    };
    return responseData;
};