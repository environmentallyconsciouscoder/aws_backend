import * as dynamoDbLib from "../../libs/dynamodb-lib";
import { success, failure } from "../../libs/response-lib";
import { returnAcronym} from '../../utils/common';

let labels = {
  acronyms: {
    c: "C",
    s: "S",
    p: "P"
  },
  titleLabels: {
    c: "cover",
    s: "spoilage",
    p: "preparation"
  },
};

const getWasteLabels = (data) => {
  data.map((val) => {
    val.wasteLabels.map((label) => {
      switch (Object.keys(label)[0]) {
        case 'PP':
          labels.acronyms.p = returnAcronym(label["PP"]);
          labels.titleLabels.p = label["PP"];
          break;
        case 'CC':
          labels.acronyms.c = returnAcronym(label["CC"]);
          labels.titleLabels.c = label["CC"];
          break;
        default:
      };
    });
  });
};

export async function main(event) {

  const companyName = event.queryStringParameters.companyName;
  const companyId = event.queryStringParameters.companyId;
  const siteName = event.queryStringParameters.siteName;

  labels = {
    acronyms: {
      c: "C",
      s: "S",
      p: "P"
    },
    titleLabels: {
      c: "cover",
      s: "spoilage",
      p: "preparation"
    },
  };

  // const companyName = "falmouthUniversity";
  // const companyId = "1000";
  // const siteName = "1_STANNARY";

  // const companyName = "graysons";
  // const companyId = "1006";
  // const siteName = "1006_CRICK";

  const params = {
    TableName: "company_identifier_master",
    KeyConditionExpression: "company = :companyName and id = :companyId",
    ExpressionAttributeValues: {
      ":companyId": companyId,
      ":companyName": companyName,
    },
  };

  try {
    const result = await dynamoDbLib.call("query", params);
    // const result = {
    //   Items: [
    //     {
    //       CarbonMunicipalValue: '2.5335',
    //       user: 'Lee Hallam',
    //       address: '',
    //       workTitle: '',
    //       deviceID:  [{
    //         siteId: '1_STANNARY',
    //         id: [
    //           {
    //             unusedWaste: '',
    //             wasteLabels: [
    //               {
    //               PP: "production prep"
    //             }, {
    //               CC: "cover box"
    //             }
    //           ],
    //             unusedTime: 0,
    //             wasteCat: 'P',
    //             telNo: '447842601125'
    //           }
    //         ]
    //       }],
    //       company: 'falmouthUniversity',
    //       emailAddress: 'contact@greenkode.net',
    //       mobileNumber: '078421601123',
    //       id: '1000',
    //       municipalCostPerTonne: '235'
    //     }
    //   ],
    // };

    // console.log("result",result);

    result.Items.map(item => {
      item.deviceID.map((data) => {
        if (data.siteId == siteName) {
          getWasteLabels(data.id);
        };
      });
    });

    if (result.Items.length > 0) {
      return success(labels);
    } else {
      return success(labels);
    };

  } catch (e) {
    return failure({ status: false });
  };
};
