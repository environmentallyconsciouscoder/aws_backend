const AWS = require('aws-sdk');

const SES = new AWS.SES();

export const verifyEmail = async(email) => {
  const params = {
    EmailAddress: email
  };
  try {
      let res = await SES.verifyEmailIdentity(params).promise();
      console.log('verifyEmail', res.$response.data);
      return;
  } catch (error) {
      console.log('error', error);
      return;
  };
};