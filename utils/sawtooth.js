import { wasteTypes, roundToX } from './common';

let sawToothArrayForCw = [];
let sawToothArrayForPw = [];
let sawToothArrayForSw = [];
const reducer = (accumulator, currentValue) => accumulator + currentValue;
const checkIfTheChangeIsBigEnough = (differencesBetweenCurrentAndPreviousValues, previousValue, type) => {
  if (differencesBetweenCurrentAndPreviousValues < -3) {
    if (type == wasteTypes.coverWaste) {
      sawToothArrayForCw.push(previousValue);
    }
    if (type == wasteTypes.preparationWaste) {
      sawToothArrayForPw.push(previousValue);
    }
    if (type == wasteTypes.spoilageWaste) {
      sawToothArrayForSw.push(previousValue);
    }
    return;
  }
  return;
};
export const lookForPatterns = (wasteData, type) => {
  // console.log("wasteData", wasteData);

  sawToothArrayForCw = [];
  sawToothArrayForPw = [];
  sawToothArrayForSw = [];

  try {
    let dailyWaste = 0;
    //1) Strip out all the zeros in the array
    const arrayWithOutZeros = wasteData.filter((data) => {
      return data !== 0;
    });
    //If after filtering all zeros,array is empty, then just return zero and exit function
    if (!arrayWithOutZeros.length) {
      return dailyWaste;
    }
    //2)Loop through the array and check the differences between the first and previous value
    let i;
    for (i = 0; i < arrayWithOutZeros.length; i++) {
      if (arrayWithOutZeros[i + 1] !== undefined) {
        let currentValue = arrayWithOutZeros[i + 1];
        let previousValue = arrayWithOutZeros[i];
        let differencesBetweenCurrentAndPreviousValues = roundToX((currentValue - previousValue), 2);
        //3)check if the the value is negative
        if (differencesBetweenCurrentAndPreviousValues < 0) {
          //4) check if the negative is a big change
          checkIfTheChangeIsBigEnough(differencesBetweenCurrentAndPreviousValues, previousValue, type);
        }
      }
    }
    //5)check if sawtootharray exists? , add max value and calculate sum
    if (type == wasteTypes.coverWaste) {
      if (sawToothArrayForCw.length > 0) {
        const maxValue = wasteData[wasteData.length - 1];
        sawToothArrayForCw.push(maxValue);
        dailyWaste = roundToX(sawToothArrayForCw.reduce(reducer), 2);
      } else {
        dailyWaste = Math.max(...wasteData);
      };
    } else if (type == wasteTypes.preparationWaste) {
      if (sawToothArrayForPw.length > 0) {
        const maxValue = wasteData[wasteData.length - 1];
        sawToothArrayForPw.push(maxValue);
        dailyWaste = roundToX(sawToothArrayForPw.reduce(reducer), 2);
      } else {
        dailyWaste = Math.max(...wasteData);
      };
    } else if (type == wasteTypes.spoilageWaste) {
      if (sawToothArrayForSw.length > 0) {
        const maxValue = wasteData[wasteData.length - 1];
        sawToothArrayForSw.push(maxValue);
        dailyWaste = roundToX(sawToothArrayForSw.reduce(reducer), 2);
      } else {
        dailyWaste = Math.max(...wasteData);
      };
    };
    return dailyWaste;
  }
  catch (error) {
    return error.message;
  }
};