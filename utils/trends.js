const roundedUpNumberAndTurnBackToNumber = (data) => {
    if (data) {
      let changeToNumber = parseFloat(data);
      let roundUp = parseInt(changeToNumber.toFixed(0));
      return parseInt(roundUp);
    };
    if (0) {
      return parseInt(data);
    };
    if ("0") {
      return parseInt(data);
    };
};

/**
 * Returns the weekly trends
 * @param {Array} currentWeeklyWasteValues
 * @param {Array} lastWeekWasteValues
 * @returns
 */
 export const calculateWeeklyTrends = (currentWeeklyWasteValues, lastWeekWasteValues) => {

    // expects currentWeeklyWasteValues and lastWeekWasteValues to be:
    // [ { data:
    //     { coverWaste: [Array],
    //       preparationWaste: [Array],
    //       spoilageWaste: [Array],
    //        } } ]

    let weeklyWasteTrend = [];

    currentWeeklyWasteValues.map((data, i) => {

        const coverWaste = data.data.coverWaste[i] - lastWeekWasteValues[i].data.coverWaste[0];
        const preparationWaste = data.data.preparationWaste[i] - lastWeekWasteValues[i].data.preparationWaste[0];
        const spoilageWaste = data.data.spoilageWaste[i] - lastWeekWasteValues[i].data.spoilageWaste[0];

        weeklyWasteTrend = [{
            totalWaste: parseFloat((coverWaste + preparationWaste + spoilageWaste).toFixed(2)),
            coverWaste: parseFloat(coverWaste.toFixed(2)),
            prepWaste: parseFloat(preparationWaste.toFixed(2)),
            spoilageWaste: parseFloat(spoilageWaste.toFixed(2)),
        }];

    });
    return weeklyWasteTrend;
};

/**
 * Returns the monthly trends array
 * @param {Array} currentWaste
 * @param {Array} prevWaste
 * @param {number} monthNumber

 * @returns
 */

export const calculateMontlyChanges = (currentWaste, prevWaste, monthNumber) => {
    let wasteType = [];

    for (let i = 0; i <= monthNumber; i++) {
        if (i === 0) {

          if (prevWaste[11]) {

            let differences;

            if (prevWaste[11]==0) {
                differences = 0;
            } else {
                differences = roundedUpNumberAndTurnBackToNumber(currentWaste[0] - prevWaste[11]);
            };

            wasteType.push(differences);

          } else {
            let differences = roundedUpNumberAndTurnBackToNumber(currentWaste[0] - 0);
            wasteType.push(differences);
          };

        } else {
          let differences = roundedUpNumberAndTurnBackToNumber(currentWaste[i] - currentWaste[i - 1]);
            wasteType.push(differences);
        };
    };
    return wasteType;
};