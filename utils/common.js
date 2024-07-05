import moment from 'moment';
/**
 * Rounds a float to X decimal place
 * @param {Float} num Float to round
 * @param {Number} dp Number of decimal places
 * @returns {Number}
 */
export const roundToX = (num, dp) => {
  return +(Math.round(num + `e+${dp}`) + `e-${dp}`);
};

/**
* Get the number of weeks in each month of the year
* @param {*} year
* @returns {Array<Number>}
*/
export const getWeeksInMonths = (year) => {
  let monthMap = [];
  for (let i = 1; i <= 12; i++) {
    let startDayOfTheWeek = new Date(`${year}-${i}-01`).getDay();
    let numberOfDayInMonth = new Date(year, i, 0).getDate();
    // weekInMonths.push([startDayOfTheWeek,numberOfDayInMonth]);
    let daysBeforeFirstMonday = 0;
    if (startDayOfTheWeek > 1) {
      daysBeforeFirstMonday = 8 - startDayOfTheWeek;
    }
    let numberOfDaysLeft = numberOfDayInMonth - daysBeforeFirstMonday;
    let numberOfWeeks = numberOfDaysLeft / 7;
    if (numberOfWeeks > 4) {
      monthMap.push(5);
    }
    else {
      monthMap.push(4);
    }
  }
  return monthMap;
};
/**
 * Returns the number of weeks in a given year
 * @param {} year
 * @returns {Number}
 */
export const getWeeksInYear = (year) => {
  return moment().isoWeeksInYear(year);
};
/**
 * Return the current week of the year
 * @returns {Number}
 */
export const getCurrentWeek = () => {
  const formattedDate = moment().format('MM-DD-YYYY');
  const currentWeek = moment(formattedDate, "MMDDYYYY").isoWeek();
  return currentWeek;
};
/**
 * Returns the day of the week for a date string
 * @param {String} date  The date string
 * @returns {Number}
 */
export const getDayOfTheWeek = (date) => {
  const formattedDate = moment(date);
  const dayOfTheWeek = formattedDate.day();
  return dayOfTheWeek;
};

export const wasteTypes = {
  coverWaste: 'cw',
  preparationWaste: 'pw',
  spoilageWaste: 'sw'
};
export const allReports = 'allReports';
/**
 * Sorting aray in descending order
 * @example [1,2,4,5].sort(compare) will result in [5,4,2,1]
 * @param {*} a
 * @param {*} b
 * @returns
 */
export const compare = (a, b) => {
  if (a.totalWastePerItem < b.totalWastePerItem) {
    return 1;
  }
  if (a.totalWastePerItem > b.totalWastePerItem) {
    return -1;
  }
  return 0;
};
/**
 * Get capping value for daily,hourly,weekly or monthly for all food wastes
 * @param {Array} cappingData
 * @returns
 */
export const getSpecificCappingData = (cappingData) => {
  let specificCappings = {};
  cappingData.map((data) => {
    specificCappings[data.type] = data.value;
  });
  return specificCappings;
};
/**
 * Returns all the users for a given company
 * @param {Array} allUsers
 * @param {String} company
 * @param {String} companyId
 * @returns
 */
export const getCompanyUsers = (allUsers, company, companyId) => {
  const companyUsers = allUsers.filter((user) => {
    return user['custom:company'] == company && user['custom:companyId'] == companyId;
  });
  return companyUsers;
};
/**
 * Format phoneNumber
 * @param {String} phoneNumber
 * @returns String
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (phoneNumber.slice(0, 3) === '+44') {
    return phoneNumber;
  }
  if (phoneNumber.slice(0, 2) === '44') {
    phoneNumber = '+' + phoneNumber;
    return phoneNumber;
  }
  else {
    return phoneNumber.replace(phoneNumber[0], '+44');
  }
};

/**
 * remove all duplicated objects inside an array
 * @param {Array Object} arrayOfObjects
 * @returns Array Object
 */

export const createUniqueArrayOfObjects = (arrayOfObjects) => {
  // creates array of array
  const arrayOfArray = arrayOfObjects.map(item => {
    return [JSON.stringify(item), item];
  });
  // create key value pair from array of array
  const newKeyPairValue = new Map(arrayOfArray);
  //converting back to array from mapobject
  const newArray = [...newKeyPairValue.values()];
  return newArray;
};

/**
 * Check if a user should receive monthly trend alert.Returns false if this is the first month of user
 * @param {Number} startYear
 * @param {Number} startMonth
 * @returns {Boolean}
 */
export const canReceiveMonthlyTrendAlert = (startYear, startMonth) => {
  if (startYear < new Date().getFullYear()) {
    return true;
  }
  if (startMonth < new Date().getMonth()) {
    return true;
  }
  return false;
};
/**
 * Check if a user should receive weekly trend alert..Returns false if this is the first week of user
 * @param {Number} startYear
 * @param {Number} startMonth
 * @param {Number} startDate
 * @returns {Boolean}
 */
export const canReceiveWeeklyTrendAlert = (startYear, startMonth, startDate) => {
  if (canReceiveMonthlyTrendAlert(startYear, startMonth)) {
    return true;
  }
  let currentWeek = getCurrentWeek();
  let startWeek = moment(startDate, "YYYY-MM-DD").isoWeek();
  if (startWeek < currentWeek) {
    return true;
  }
  return false;
};

/**
 * format siteid to return in alert message
 * @param {String} siteId
 * @example1 1_STANNARY returns Stannary
 */
export const formatSiteName = (siteId) => {
  const lower =  siteId.split('_')[1].toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};
/**
 * Create message body for capping sms alert
 * @param {String} time time of message e.g Hourly,Daily,Monthly e.t.c
 * @param {String} siteId  id of site e.g 1_STANNARY
 * @param {String} coverWasteMsg message for coverwaste
 * @param {String} prepWasteMsg  message for preparation waste
 * @param {String} spoilageWasteMsg message for spoilage waste
 */
export const createCappingMessage = (time, siteId, coverWasteMsg, prepWasteMsg, spoilageWasteMsg) => {
  let message = `${time} waste capping exceeded:\nTHE ${formatSiteName(siteId)}:capping-actual data\n\nWaste\n${coverWasteMsg}\n${prepWasteMsg}\n${spoilageWasteMsg}`;
  return message;
};
/**
 * Create message body for trend sms alert
 * @param {String} time time of message e.g week,month e.t.c
 * @param {String} siteId  id of site e.g 1_STANNARY
 * @param {String} coverWasteMsg message for coverwaste
 * @param {String} prepWasteMsg  message for preparation waste
 * @param {String} spoilageWasteMsg message for spoilage waste
 */
export const createTrendMessage = (time, siteId, coverWasteMsg, prepWasteMsg, spoilageWasteMsg) => {
  let message = `The difference between this and last ${time} at THE ${formatSiteName(siteId)}:\n${coverWasteMsg}\n${prepWasteMsg}\n${spoilageWasteMsg}`;
  return message;
};

/**
 * This returns a number string with 2 decimal places without rounding up 0.000
 * @param {String} number
 */
export const keepDecimalPlacesWithoutRoundingUp = (num, decimalPlaces) => {
  // console.log("num",num);
  let result = 0;
  if (num !== 0) {
      let str;
      str = num.toString().split('.');
      var res = str[1].slice(0, decimalPlaces);
      result = str[0]+'.'+res;
      return result;
  } else {
      return result;
  };
};

/**
 * Returns unique companies and sites
 * @param {Array<{}>} companyAndSites
 * @returns
 */
export const getUniqueCompanyAndSite = (companyAndSites) => {
  return createUniqueArrayOfObjects(companyAndSites);
};

/**
 * Returns true if number is an integer
 * @param {number}
 * @returns
 */
export const isInt = (n) => {
  return n % 1 === 0;
};

/**
 * Add x days to the supplied date string
 * @param {string} dateString
 * @param {Number} x number of days to add
 * @returns
 */
export const addXDayToDate = (dateString,x) => {
  let newDate = moment(dateString, "YYYY-MM-DD").add(x, 'days');
  return newDate.toISOString().split('T')[0];
};
/**
 * This function returns the string value for start and previous month to be used in montly waste email template
 * @returns
 */
export const startAndPrevMonth = () => {
  const monthMap = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December'
  };
  const monthKey = new Date().getMonth();
  const startMonth = monthMap[`${monthKey}`];
  const prevMonth = monthMap[`${monthKey-1}`];
  return {startMonth,prevMonth};
};

/**
 * Computation for ai email alert target values
 * @param {*} trendData
 * @param {*} targetPercent
 * @param {*} carbonMunicipalValue
 * @returns
 */
export const computeTargetValues = (trendData,targetPercent,carbonMunicipalValue) => {
  targetPercent = Number(targetPercent);
  carbonMunicipalValue = Number(carbonMunicipalValue);
  const {coverWaste,spoilageWaste,preparationWaste} = trendData;
  console.log("coverWaste",coverWaste);
  console.log("spoilageWaste",spoilageWaste);
  console.log("preparationWaste",preparationWaste);

  const total = coverWaste+spoilageWaste+preparationWaste;
  console.log("total",total);
  const totalPercentage = total*(targetPercent/100);
  console.log("totalPercentage",totalPercentage);

  const coverPercent = (coverWaste*(targetPercent/100));
  const prepPercent = (preparationWaste*(targetPercent/100));
  const spoilagePercent = (spoilageWaste*(targetPercent/100));
  const coverWasteReduceBy = Math.round(-((coverPercent*12)/365));
  const prepWasteReduceBy = Math.round(-((prepPercent*12)/365));
  const spoilageWasteReduceBy = Math.round(-((spoilagePercent*12)/365));
  const dailyMealSaving = Math.round(((totalPercentage/0.36)*12)/365);
  const dailyC02Saving = Math.round((totalPercentage*carbonMunicipalValue*12)/365);
  const dailyMoneySaving = Math.round((totalPercentage*2.775*12)/365);
  return {
    coverWasteReduceBy,
    prepWasteReduceBy,
    spoilageWasteReduceBy,
    dailyMealSaving,
    dailyC02Saving,
    dailyMoneySaving,
    targetPercent
  };
};

/**
 * @param {*} String in camelCase
 */
export const formatCompanyName = (companyNameInCamelCase) => {
  const str = companyNameInCamelCase.replace(/([a-z0-9])([A-Z])/g, '$1 $2');
  const firstCharacterUpperCase = str.charAt(0).toUpperCase() + str.slice(1);
  return firstCharacterUpperCase;
};

/**
 * Get the current day of the year
 * @param {Date} date
 * @returns
 */
export const getCurrentDayOfYear = date =>
  Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
 /**
 * This is add up all numbers from an array
 *  * [1,2,3,4].reduce(reducer); etc
 */
export const reducer = (accumulator, currentValue) => accumulator + currentValue;

/**
 * This function returns the current month as a number from 1- 12
 * @returns
 */
export const getMonthAsAnumber = () => {
  const currentDate = new Date();
  const getMonthAsAnumber = moment(currentDate).format('M');
  return getMonthAsAnumber;
};

/**
 * This function returns the current day as a number  from 0 - 6
 * @returns
 */
 export const getDayAsAnumber = () => {
  const d = new Date();
  const n = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return n;
};

/**ß
 * @param {*} String in date
 */
export const getCurrentWeekNumberInTheYear = (firstDate) => {
  //define a date object variable that will take the current system date
  let todaydate = firstDate;
  //find the year of the current date
  var oneJan =  new Date(todaydate.getFullYear(), 0, 1);
  // calculating number of days in given year before a given date
  var numberOfDays =  Math.floor((todaydate - oneJan) / (24 * 60 * 60 * 1000));
  // adding 1 since to current date and returns value starting from 0
  var result = Math.ceil(( todaydate.getDay() + 1 + numberOfDays) / 7);
  return result - 1;
};

/**
 * @param {*} String in date
 * @returns
 */
 export const recieveMonthAsAnumber = (currentDate) => {
  const getMonthAsAnumber = moment(currentDate).format('M');
  return getMonthAsAnumber;
};

/**
 * Return date 1-30 etc
 * @param {*} String in date
 * @returns {Number}
 */
 export const getDate = (date) => {
  const formattedDate = moment(date).format('DD');
  return formattedDate;
};

/**
 * Return the current week of the year
 * @param {*} String in date
 * @returns {Number}
 */
 export const recieveCurrentWeek = (date) => {
  const formattedDate = moment(date).format('MM-DD-YYYY');
  // console.log("formattedDate",formattedDate)
  const currentWeek = moment(formattedDate, "MMDDYYYY").isoWeek();
  return currentWeek;
};

/**
 * Acronym
 * @param {*} String two strings with space
 * @returns {uppercase first char of two strings joined}
 */
 export const returnAcronym = (data) => {
  const stringArray = data.split(/(\s+)/);
  const removeSpace = stringArray.filter((data) => data !== " ");
  const firstChar = removeSpace.map((data) => data.charAt(0));
  return firstChar.join('').toUpperCase();
};

/**
 * This function returns the current month as a number from 1- 12
 * @returns
 */
 export const formateDate = (startDate) => {
  const dateObj = new Date(startDate);
  const momentObj = moment(dateObj);
  const momentString = momentObj.format('MMM Do YYYY');
  return momentString;
};

/**
 * Returns day of the year
 * @param {number}
 * @returns
 */
 export const dayOfTheYear = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const day = Math.floor(diff / oneDay);
  // console.log('Day of year: ' + day);
  return day;
};

/**
 * Returns daily electrical daily of a specific day
 * @param day {number}
 * @param dailyElectricalData {object}
 * @returns
 */
 export const getSpecificDailyElectricalData = (dailyElectricalData,day) => {
  return dailyElectricalData.map((obj) => {
    return obj.dayOfTheYear.filter((obj) => {
      return obj.dayOfYear == day;
    });
  });
};

/**
 * Returns weekly value of specific week
 * @param weekNumber {number}
 * @param weeklyData {object}
 * @returns
 */
 export const getSpecificWeeklyData = (weeklyData,weekNumber) => {
  return weeklyData.filter((data) => {
    return data.weekOfYear == weekNumber;
  });
};