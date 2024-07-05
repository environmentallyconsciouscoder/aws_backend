import { success, failure } from "../../libs/response-lib";
const AWS = require('aws-sdk');

export async function main(event, context) {
  console.log("event",event);

  const inputs = JSON.parse(event.body);
  console.log("inputs",inputs);

  const groupName = inputs.groupName;
  const userName = inputs.username;

  const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  const params = {
    GroupName: groupName,
    UserPoolId: "us-east-1_LYyDatvKz",
    Username: userName
  };

  try {

    await cognitoidentityserviceprovider.adminAddUserToGroup(params).promise();

    return context.succeed(success(event));

  } catch (e) {
    console.log("e",e);
    return failure({ status: false });
  }
}
