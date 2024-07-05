import { formatSiteName, formatCompanyName } from '../utils/common';
/**
 * Create message body for capping sms alert
 * @param {String} time time of message e.g Hourly,Daily,Monthly e.t.c
 * @param companyData
 */
 export const createCappingMessage = (time,companyData) => {
  let message =
  `GREEN + KODE FOOD WASTE WARNING\n\nHello ${companyData.userName}\n\n${formatCompanyName(companyData.companyName)}\n\n${time} waste capping alert:\n\nNUMBER OF SITES: ${companyData.activeSites}\n\n${companyData.siteData.map((site,index) => {
    return `${index+1}. ${formatSiteName(site.siteId)}:\n[Capping - Actual]\n${site.finalMessage.map(msg => { return `${msg}\n`; }) }\n`; })}Thank you\nGreen + Kode`;
  message = message.replace(/,/g,'');
  return message;
};
/**
 * Create message body for inputs sms alert
 * @param companyData
 */
 export const createInputMessage = (companyData) => {
  let message =
  `GREEN + KODE FOOD WASTE WARNING\n\nHello ${companyData.userName}\n\n${formatCompanyName(companyData.companyName)}\n\nInputs Alert:\n\nNUMBER OF SITES: ${companyData.activeSites}\n\n${companyData.siteData.map((site,index) => {
    return `${index+1}. ${formatSiteName(site.siteId)}:\n${site.finalMessage.map(msg => { return ` ${msg}\n`; }) }\n`; })}Thank you\nGreen + Kode`;
  message = message.replace(/,/g,'');
  return message;
};