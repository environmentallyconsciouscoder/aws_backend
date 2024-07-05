import AWS from "aws-sdk";
import moment from 'moment';
import { failure, success } from "../../libs/response-lib";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
export const main = async(event, context, callback) => {
    try{
        const formattedDate = moment().format('MM-DD-YYYY');
        const weekNumber = moment(formattedDate, "MMDDYYYY").isoWeek();

        const response = JSON.parse(event.body);

        // console.log("response",response);

        const menuInputs = response.menuItems;
        const companyInformation = response.companyInformation;

        // console.log("menuInputs",menuInputs);
        // console.log("companyInformation",companyInformation);

        const id = companyInformation.id;
        const companyName = companyInformation.companyName;
        const siteId = companyInformation.siteName;

        // console.log("id",id);
        // console.log("companyName",companyName);
        // console.log("siteId",siteId);

        const newMenuInput = menuInputs.map((input) => {
                                        return {
                                            menuItem:input.menuItem,
                                            sales: input.sales,
                                            wastePerCent: input.wastePerCent,
                                            weightPerItem: input.weightPerItem
                                        };
                                    }
                                );
        const todaysDate = menuInputs[0].date; //get the date of today from the input and use to know what day of the week it is
        const date = moment(todaysDate);
        const dayOfTheWeek = date.day(); //Get the day of the week...Will be used to know the index to push the input in the menuInput array
        const menuWasteWeekIndex = dayOfTheWeek === 0 ? 6 : dayOfTheWeek - 1;

        // console.log("newMenuInput",newMenuInput);
        // console.log("dayOfTheWeek",dayOfTheWeek);

        // const inputData = [
        //     {
        //         date: '2021-07-08',
        //         menuItem: 'local beef burger',
        //         sales: 10,
        //         weightPerItem: 0.6,
        //         wastePerCent: 12,
        //     },
        //     {
        //         date: '2021-07-08',
        //         menuItem: 'Pizza',
        //         sales: 10,
        //         weightPerItem: 1.2,
        //         wastePerCent: 12,
        //     }
        //     ]
        // let id = "1000";
        // let companyName = "falmouthUniversity";
        // let siteId = "1_STANNARY";
        const currentYear = new Date().getFullYear();
        const params = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :menuInput",
            ExpressionAttributeValues: {
              ":menuInput": `${siteId}_menuInput_${currentYear}`,
            },
        };
        const responseData = (await dynamoDb.query(params).promise()).Items;
        let menuWaste = responseData[0].menuWaste;
        let newMenuWaste = [];
        // responseData.map((data) => {
        //     menuWaste = data.menuWaste;
        // });
        menuWaste.map((w) => {
            if(w.weekOfYear === weekNumber.toString()){
                // w.menuWasteWeek[dayOfTheWeek-1] = newMenuInput;
                w.menuWasteWeek[menuWasteWeekIndex] = newMenuInput;
                newMenuWaste.push(w);
            }
            else{
                newMenuWaste.push(w);
            }
        });
        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_menuInput_${currentYear}`,
            },
            UpdateExpression: 'set menuWaste = :menuWasteVal',
            ExpressionAttributeValues: {
              ":menuWasteVal": newMenuWaste
            },
            ReturnValues:"UPDATED_NEW"
          };
        const res =  await dynamoDb.update(updateParams).promise();
        return success({code:res.$response.httpResponse.statusCode,message:res.$response.httpResponse.statusMessage});
    }
    catch(error){
        return failure(error.message);
    }
};