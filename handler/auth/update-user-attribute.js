import { success, failure } from "../../libs/response-lib";
const AWS = require('aws-sdk');

import config from "../../config";

export async function main(event, context) {

  // const inputs = JSON.parse(event.body);
  // console.log("event",event);

  // const value = inputs.value.toString();
  // const userName = inputs.username;

  const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  const params = [
    {
      UserAttributes: [
        {
          Name: 'custom:smsAlerts',
          Value: "true"
        },
        {
          Name: 'custom:emailAlerts',
          Value: "true"
        }
      ],
      UserPoolId: config.prod.USER_POOL_ID,
      Username: "gforceup@gmail.com"
    }
  ];

  console.log("params", params);

  try {

    for (let i = 0; i < params.length; i++) {
      await cognitoidentityserviceprovider.adminUpdateUserAttributes(params[i]).promise();
      // return context.succeed(success(event));
    };

    return context.succeed(success(event));

  } catch (e) {
    console.log("e", e);
    return failure({ status: false });
  }
}
