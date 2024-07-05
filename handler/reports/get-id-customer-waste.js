import { failure, success } from '../../libs/response-lib';
import { getIdCustomerWaste } from '../../utils/Queries';

export const main = async (event, context, callback) => {
  const currYear = new Date().getFullYear();
  // const id = "1000";
  // const companyName = "falmouthUniversity";
  // const siteId = "1_STANNARY";
  // const selected = 0;

  const id = event.queryStringParameters.id;
  const companyName = event.queryStringParameters.companyName;
  const siteId = event.queryStringParameters.siteName;
  const selected = event.queryStringParameters.selected;

  try {
    const results = await getIdCustomerWaste(id, companyName, siteId, currYear);
    // console.log("results",results);

    const numberOfIndex = results.Items.map((data) => {
      return data.eventCustomers.length;
    });
    // console.log("numberOfIndex",numberOfIndex);

    const selectedData = results.Items.map((data) => {
      return data.eventCustomers[selected];
    });

    // console.log("selectedData",selectedData[0].Date);
    const date = selectedData[0].Date;
    const eventName = selectedData[0].eventName;

    // const convertedObjectValueToNumber = selectedData.map((data) => {
    //    return data.allCustomers.filter((item) => {
    //     return item.xCode = parseInt(item.xCode);
    //   });
    // });

    selectedData.map((data) => {
      data.allCustomers.map((item) => {
        item.xCode = parseInt(item.xCode);
     });
   });

  //  console.log("selectedData",selectedData);
    let sortedArr = selectedData[0].allCustomers.sort(({xCode:a}, {xCode:b}) => b-a).reverse();
    // console.log("sortedArr",sortedArr);

    const xaxis = sortedArr.map((data) => {
      return data.xCode;
    });

    const yaxis = sortedArr.map((data) => {
      return data.yWaste;
    });

    const data = {
      // sortedArr: sortedArr,
      numberOfIndex: numberOfIndex,
      xaxis: xaxis,
      yaxis: yaxis,
      date: date,
      eventName: eventName
    };

    return callback(null, success(data));
  } catch (e) {
    return failure(e);
  };
};
