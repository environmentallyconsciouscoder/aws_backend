import AWS from "aws-sdk";
import moment from 'moment';
import { failure, success } from "../../libs/response-lib";
import { recieveCurrentWeek } from "../../utils/common";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
export const main = async(event, context, callback) => {
    try{
        // const formattedDate = moment().format('MM-DD-YYYY');
        // const weekNumber = moment(formattedDate, "MMDDYYYY").isoWeek();
        // console.log("weekNumber",weekNumber);

        const response = JSON.parse(event.body);
        // console.log("response",response);

        // const response = {
        //     "companyInformation": {"id": "1000",
        //     "companyName": "falmouthUniversity",
        //     "siteName": "1_STANNARY"},
        //     "productionPreparation": [
        //         {"totalNumber": 111, "productionFood": "testing", "ingredients": "tesssss", "weightPerMeal": 12, "date": "2021-10-25"}
        //     ]
        // };

        const productionPreparation = response.productionPreparation;
        // console.log("productionPreparation",productionPreparation);

        const weekNumber = recieveCurrentWeek(response.productionPreparation[0].date);
        // console.log("weekNumber",weekNumber);

        const companyInformation = response.companyInformation;
        // console.log("companyInformation",companyInformation);

        const id = companyInformation.id;
        const companyName = companyInformation.companyName;
        const siteId = companyInformation.siteName;

        const newMenuInput = productionPreparation.map((input) => {
                                        return {
                                            totalNumber:input.totalNumber,
                                            productionFood: input.productionFood,
                                            ingredients: input.ingredients,
                                            weightPerMeal: input.weightPerMeal,
                                            totalWeight: (input.weightPerMeal * input.totalNumber).toFixed(2),
                                            // date: input.date
                                        };
                                    }
                                );

        // console.log("newMenuInput",newMenuInput);

        const todaysDate = productionPreparation[0].date; //get the date of today from the input and use to know what day of the week it is
        const date = moment(todaysDate);
        // console.log("date",date);

        const dayOfTheWeek = date.day(); //Get the day of the week...Will be used to know the index to push the input in the menuInput array
        const menuWasteWeekIndex = dayOfTheWeek === 0 ? 6 : dayOfTheWeek - 1;

        // console.log("dayOfTheWeek",dayOfTheWeek);
        // console.log("menuWasteWeekIndex",menuWasteWeekIndex);

        const currentYear = new Date().getFullYear();
        // console.log("currentYear",currentYear);

        const params = {
            TableName: `${id}_${companyName}_allReports`,
            KeyConditionExpression: "site = :productionPreparation",
            ExpressionAttributeValues: {
              ":productionPreparation": `${siteId}_productionPreparation_${currentYear}`,
            },
        };
        // console.log("params",params);

        const responseData = (await dynamoDb.query(params).promise()).Items;
        // console.log("responseData",responseData);

        let menuWaste = responseData[0].productionPreparation;

        let newMenuWaste = [];

        menuWaste.map((w) => {
            if(w.weekOfYear === weekNumber.toString()){
                w.productionWasteWeek[menuWasteWeekIndex] = newMenuInput;
                newMenuWaste.push(w);
            }
            else{
                newMenuWaste.push(w);
            }
        });

        const updateParams = {
            TableName: `${id}_${companyName}_allReports`,
            Key: {
              site: `${siteId}_productionPreparation_${currentYear}`,
            },
            UpdateExpression: 'set productionPreparation = :menuWasteVal',
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