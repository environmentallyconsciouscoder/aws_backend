import AWS from "aws-sdk";
import { allReports, createUniqueArrayOfObjects } from './common';

import config from "../config";

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
/**
 * Get daily Eelectrical data for a given year
 * @param {*} id
 * @param {*} companyName
 * @param {*} siteId
 * @param {*} year
 * @returns
 */
export const getDailyElectricalData = async (id, companyName, siteId, year) => {
  const dailyElectricalDataQuery = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :dailyElectricalData',
    ProjectionExpression: `siteName, dayOfTheYear`,
    ExpressionAttributeValues: {
      ":dailyElectricalData": `${siteId}_dailyElectricalData_${year}`,
    }
  };
  const responseData = (await dynamoDb.query(dailyElectricalDataQuery).promise()).Items;
  return responseData;
};

/**
 *Get all the users from aws cognito
 * @returns Array
 */
export const getAllUsersList = async () => {
  let users = [];
  let adminResponse = {};
  let superAdminResponse = {};
  const superparams = {
    UserPoolId: config.prod.USER_POOL_ID,
    Limit: 10,
    GroupName: 'superAdmin'
  };
  const params = {
    UserPoolId: config.prod.USER_POOL_ID,
    Limit: 10,
    GroupName: 'admin'
  };
  try {
    adminResponse = await cognitoidentityserviceprovider.listUsersInGroup(params).promise();
    superAdminResponse = await cognitoidentityserviceprovider.listUsersInGroup(superparams).promise();

    users = [...users, ...adminResponse.Users, ...superAdminResponse.Users];
    while (adminResponse.NextToken) {
      params.NextToken = adminResponse.NextToken;
      adminResponse = await cognitoidentityserviceprovider.listUsersInGroup(params).promise();
      users = [...users, ...adminResponse.Users];
    };
    while (superAdminResponse.NextToken) {
      superparams.NextToken = superAdminResponse.NextToken;
      superAdminResponse = await cognitoidentityserviceprovider.listUsersInGroup(superparams).promise();
      users = [...users, ...superAdminResponse.Users];
    };
    const expectedAttributes = ["custom:mobile","custom:smsAlerts","custom:emailAlerts","custom:companyId","custom:company","name","custom:companyStartDate","email"];
    const formattedAttributeNew = [];
    for (let i = 0; i < users.length; i++) {
      let user = users[i];
      let newData = [];
      for (let j = 0; j < user.Attributes.length; j++) {
        let { Name, Value } = user.Attributes[j];
        if (expectedAttributes.indexOf(Name) >= 0) {
          let newObj = {
            Name,
            Value
          };
          newData.push(newObj);
        };
      }
      let newAttribute = {};
      for (let i = 0; i < newData.length; i++) {
        let key = newData[i].Name;
        let val = newData[i].Value;
        newAttribute[key] = val;
      }
      user.Attributes = newAttribute;
      formattedAttributeNew.push(user.Attributes);
    };
    return formattedAttributeNew;
  }
  catch (e) {
    console.log("e", e);
    return;
  };
};
/**
 * Get all companies and their Id then return a formatted string for each company
 * @returns Array<String>
 */
export const getAllCompaniesFromMasterTable = async() => {
  const allCompanyQuery = {
    TableName: 'company_identifier_master'
  };
  const responseData = (await dynamoDb.scan(allCompanyQuery).promise()).Items;
  // console.log('total',responseData.length)
  const allCompaniesFormatted = responseData.map((comp) => {
    const {id,company,date,inputsFromUser} = comp;
    const startDate = date.startDate;
    return {id,company,startDate,inputsFromUser};
  });
  return allCompaniesFormatted;
};
/**
 * Returns all the sites in a company
 * @param {} companyDetails
 * @param {String} year
 * @returns Array
 */
export const getAllCompanySites = async (companyDetails, year) => {
  const { company, id } = companyDetails;
  const companyName = `${id}_${company}_allReports`;
  const allSitesQuery = {
    TableName: companyName,
    KeyConditionExpression: 'site = :allSites',
    ProjectionExpression: `totalWaste`,
    ExpressionAttributeValues: {
      ":allSites": `allSites_${year}`,
    }
  };
  const responseData = (await dynamoDb.query(allSitesQuery).promise()).Items;
  const allSites = responseData[0].totalWaste.sites.map(site => site.siteName);
  return {allSites,totalWaste:responseData[0].totalWaste};
};

/**
 * Get all the capping data set by user
 * @param {String} id
 * @param {String} companyName
 * @param {String} siteId
 * @returns
 */
export const getAllCappingsData = async (id, companyName, siteId) => {
  const cappingDataQuery = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: 'site = :cappingData',
    ProjectionExpression: `cappingValue`,
    ExpressionAttributeValues: {
      ":cappingData": `${siteId}_capping`,
    }
  };
  const responseData = (await dynamoDb.query(cappingDataQuery).promise()).Items;
  // console.log(responseData[0],id,companyName,siteId)
  return responseData[0].cappingValue;
};
/**
 * Get the weekly waste sum data
 * @param {String} id
 * @param {String} companyName
 * @param {String} siteId
 * @param {String} year
 * @returns {Promise<Array>}
 */
export const getWeeklyWasteData = async (id, companyName, siteId, year) => {
  const weeklyDataQuery = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: 'site = :weeklyWaste',
    ProjectionExpression: `siteName, weeklyWasteSum`,
    ExpressionAttributeValues: {
      ":weeklyWaste": `${siteId}_weeklyWaste_${year}`,
    }
  };
  const responseData = (await dynamoDb.query(weeklyDataQuery).promise()).Items;
  return responseData[0].weeklyWasteSum;
};
/**
 * Get monthly waste data value
 * @param {String} id
 * @param {String} companyName
 * @param {String} siteId
 * @param {String} year
 * @returns
 */
export const getMonthlyWasteData = async (id, companyName, siteId, year) => {
  const monthlyDataQuery = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: 'site = :monthlyWaste',
    ProjectionExpression: `siteName, monthlyValue`,
    ExpressionAttributeValues: {
      ":monthlyWaste": `${siteId}_monthlyWaste_${year}`,
    }
  };
  const defaultMonthlyWaste = {
    coverWaste: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    preparationWaste: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    spoilageWaste: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  };
  const responseData = (await dynamoDb.query(monthlyDataQuery).promise()).Items;
  if (responseData && responseData[0]) {
    return responseData[0].monthlyValue.monthly;
  }
  else {
    return defaultMonthlyWaste;
  };
};
/**
 * Get AI prediction for monthly forecast
 * @param {String} id
 * @param {String} companyName
 * @param {String} siteId
 * @param {String} year
 * @returns
 */
export const getAiPredictionData = async (id, companyName, siteId, year) => {
  const aiPredictionDataQuery = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :aiPrediction',
    ProjectionExpression: `aiPrediction`,
    ExpressionAttributeValues: {
      ":aiPrediction": `${siteId}_aiPrediction_${year}`
    }
  };
  const responseData = (await dynamoDb.query(aiPredictionDataQuery).promise()).Items;
  return responseData[0].aiPrediction;
};
/**
 * Returns all the companies
 * @param {Array<Object>} usersList
 * @returns
 */
export const getAllCompanies = (usersList) => {
  const uniqueUserArray = createUniqueArrayOfObjects(usersList);
  const allCompanies = uniqueUserArray.map((company) => {
    return {
      id: company['custom:companyId'],
      company: company['custom:company'],
      startDate: company['custom:companyStartDate']
    };
  });
  return allCompanies;
};
/**
 * Returns the weekly coverinputs data
 * @param {string} id
 * @param {string} companyName
 * @param {string} siteId
 * @param {string} year
 * @returns {Promise<Array>}
 */
export const getWeeklyCoverInputs = async(id,companyName,siteId,year) => {
  const coverInputsQuery = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :coverInputs',
    ProjectionExpression: `weeklyCovers`,
    ExpressionAttributeValues: {
      ":coverInputs": `${siteId}_weeklyCoversInput_${year}`
    }
  };
  const responseData = (await dynamoDb.query(coverInputsQuery).promise()).Items;
  return responseData[0].weeklyCovers;
};
/**
 * Returns the weekly coverinputs data
 * @param {string} id
 * @param {string} companyName
 * @param {string} siteId
 * @param {string} year
 * @returns {Promise<Array>}
 */
 export const getWeeklySalesInput = async(id,companyName,siteId,year) => {
  const salesInputsQuery = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :salesInputs',
    ProjectionExpression: `weeklySales`,
    ExpressionAttributeValues: {
      ":salesInputs": `${siteId}_weeklySalesInput_${year}`
    }
  };
  const responseData = (await dynamoDb.query(salesInputsQuery).promise()).Items;
  return responseData[0].weeklySales;
};
/**
 * Returns the weekly menuinputs data
 * @param {string} id
 * @param {string} companyName
 * @param {string} siteId
 * @param {string} year
 * @returns {Promise<Array>}
 */
 export const getWeeklyMenuInput = async(id,companyName,siteId,year) => {
  const salesInputsQuery = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :menuInput',
    ProjectionExpression: `menuWaste`,
    ExpressionAttributeValues: {
      ":menuInput": `${siteId}_menuInput_${year}`
    }
  };
  const responseData = (await dynamoDb.query(salesInputsQuery).promise()).Items;
  return responseData[0].menuWaste;
};

export const getRecommendedTargetPercent = async(id,companyName,siteId,year) => {
  const query = {
    TableName: `${id}_${companyName}_${allReports}`,
    KeyConditionExpression: 'site = :recommendedTargets',
    ProjectionExpression: `recommendedTargets`,
    ExpressionAttributeValues: {
      ":recommendedTargets": `${siteId}_recommendedTargets`
    }
  };
  const responseData = (await dynamoDb.query(query).promise()).Items;
  return responseData[0].recommendedTargets.targets.percents;
};
/**
 * Get the carbon municipal value for a company
 * @param {string} id
 * @param {string} companyName
 * @returns
 */
export const getCarbonMunicipalValue = async(id,companyName) => {
  const query = {
    TableName: "company_identifier_master",
    KeyConditionExpression: "company = :companyName and id = :companyId",
    ProjectionExpression: `CarbonMunicipalValue`,
    ExpressionAttributeValues: {
      ":companyId": id,
      ":companyName": companyName,
    },
  };
  const responseData = (await dynamoDb.query(query).promise()).Items;
  return responseData[0].CarbonMunicipalValue;
};

/**
 * Get the getMunicipalCostPerTonne for a company
 * @param {string} id
 * @param {string} companyName
 * @returns
 */
 export const getMunicipalCostPerTonne = async(id,companyName) => {
  const query = {
    TableName: "company_identifier_master",
    KeyConditionExpression: "company = :companyName and id = :companyId",
    ProjectionExpression: `municipalCostPerTonne`,
    ExpressionAttributeValues: {
      ":companyId": id,
      ":companyName": companyName,
    },
  };
  const responseData = (await dynamoDb.query(query).promise()).Items;
  return responseData[0].municipalCostPerTonne;
};

/** Get Green Savings
* @param {String} id
* @param {String} companyName
* @param {String} siteId
* @param {String} year
*/
export const getGreenSavings = async(id,companyName,siteId,year) => {
  const weeklyDataQuery = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: 'site = :greenSavings',
    ProjectionExpression: `siteName, weeklyWaste`,
    ExpressionAttributeValues: {
      ":greenSavings": `${siteId}_greenSavings_${year}`,
    }
  };
  console.log("weeklyDataQuery",weeklyDataQuery);

  const responseData = (await dynamoDb.query(weeklyDataQuery).promise());
  console.log("responseData",responseData);
  return responseData.Items[0].weeklyWaste;
};

/** getSurveyContent
* @param {String} id
* @param {String} companyName
* @param {String} siteId
* @param {String} year
*/
export const getSurveyContent = async(id,companyName,siteId,year) => {
  const params = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: "site = :survey",
    ExpressionAttributeValues: {
      ":survey": `${siteId}_weeklySurveyResults_${year}`,
    },
};
  console.log("params",params);

  const responseData = (await dynamoDb.query(params).promise());
  console.log("responseData",responseData);
  return responseData;
};

/** getIdCustomerWaste
* @param {String} id
* @param {String} companyName
* @param {String} siteId
* @param {String} year
*/
export const getIdCustomerWaste = async(id,companyName,siteId,year) => {
  const params = {
    TableName: `${id}_${companyName}_allReports`,
    KeyConditionExpression: "site = :idCustomerWaste",
    ExpressionAttributeValues: {
      ":idCustomerWaste": `${siteId}_idCustomerWaste_${year}`,
    },
};
  console.log("params",params);

  const responseData = (await dynamoDb.query(params).promise());
  console.log("responseData",responseData);
  return responseData;
};
