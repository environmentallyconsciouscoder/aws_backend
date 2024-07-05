const AWS = require('aws-sdk');
const SES = new AWS.SES();
const SNS = new AWS.SNS({ apiVersion: '2010-03-31' });

export const sendSmsAlert = async(message,phoneNumber) => {
  const AttributeParams = {
    attributes: {
      DefaultSMSType: 'Promotional',
      DefaultSenderID: 'GreenKode'
    }
  };
  const messageParams = {
    Message: message,
    PhoneNumber:phoneNumber
  };
  try {
      await SNS.setSMSAttributes(AttributeParams).promise();
      let res = await SNS.publish(messageParams).promise();
      console.log('sentsms', res.$response.data);
      return;
  } catch (error) {
      console.log('error', error);
      return;
  };
};

export const sendEmailReport = async(to,subject,body) => {
  const params = {
    Destination: {
        ToAddresses: [ to ]
    },
    Message: {
        Body: {
            Html: { Data: body }
        },
        Subject: { Data: subject}
    },
    Source: "greenkodelimited@gmail.com"
  };
  try {
    await SES.sendEmail(params).promise();
    return;
  }
  catch (error) {
    console.log("error",error);
    return;
  }
};