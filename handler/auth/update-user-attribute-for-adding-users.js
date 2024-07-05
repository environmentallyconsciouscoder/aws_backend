import { success, failure } from "../../libs/response-lib";
const AWS = require('aws-sdk');

export async function main(event, context) {

  const inputs = JSON.parse(event.body);
  const value = inputs.value.toString();
  const userName = inputs.username;

  const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  const params = {
    UserAttributes: [
      {
        Name: 'custom:NumberOfUsersSix',
        Value: value
      }
    ],
    UserPoolId: "us-east-1_LYyDatvKz",
    Username: userName
  };

  console.log("params",params);

  try {

    await cognitoidentityserviceprovider.adminUpdateUserAttributes(params).promise();

    return context.succeed(success(event));

  } catch (e) {
    console.log("e",e);
    return failure({ status: false });
  }
}
