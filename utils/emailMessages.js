import { formatSiteName, formatCompanyName } from '../utils/common';
export const emailTemplate = (companyData, coverInputs, salesInputs) => {
    return `<html>
    <head>
        <style>
            p {margin:0;padding:0;}
            div {margin-bottom: 1rem;}
            span {font-weight: bold;}
        </style>
    </head>
    <body>
        <left>
            <a href="www.greenkode.net"><img src="https://i.imgur.com/qJ5bLiR.jpg" title="source: imgur.com" style="object-fit:fill;width:200px;height:auto;"/></a>
        </left>
        <h3>GREEN + KODE FOOD WASTE REPORT</h3>
        <div></div>
        <div>
            <p>Hello ${companyData.userName},</p>
            <div></div>
            <p>Here is your food waste report from <span>${companyData.lastWeekStartDate}</span> to <span>${companyData.lastWeekEndDate}</span></p>
            <p>The company <span>${formatCompanyName(companyData.companyName)}</span> has <span>${companyData.activeSites} active sites:</span></p>
        </div>
        ${companyData.siteData.map((site,index) => {
        return `
            <div>
                <p><span>${index+1}. Site summary ${formatSiteName(site.siteName)}</span> from ${companyData.lastWeekStartDate} to ${companyData.lastWeekEndDate} Last Week</p>
            </div>
            <div>
                <p><span>TOTAL WASTE OF FOOD:</span> ${site.totalFoodWaste} Kg/ ${site.totalMoneyConversion}</p>
                <p><span>TOTAL WASTE OF CO2:</span> ${site.totalCabonDioxide}</p>
                <p><span>TOTAL WASTE OF MEALS:</span> ${site.totalWasteOfMeals}</p>
                <div></div>
                <p><span>TOTAL WASTE OF PREPARATION:</span> ${site.preparationWaste} Kg. ${site.moneyConversionPrep} TREND (${site.sumTrendPrep} Kg)</p>
                <p><span>TOTAL WASTE OF COVER:</span> ${site.coverWaste} Kg. ${site.moneyConversionCover} TREND (${site.sumTrendCover} Kg)</p>
                <p><span>TOTAL WASTE OF SPOILAGE:</span> ${site.spoilageWaste} Kg. ${site.moneyConversionSpoil} TREND (${site.sumTrendSpoil} Kg)</p>
            </div>
            ${site.specificWasteStreamArray.map((wasteStream) => {
            return `
                <div>
                    <p>Specific food waste stream : <span>${wasteStream.type.toUpperCase()}</span></p>
                    <p>The weekly waste amount of ${wasteStream.type} food waste this week is ${wasteStream.thisWeekVal}/ ${wasteStream.moneyConversion}</p>
                    <p>The weekly trend for last week ${wasteStream.emailText[0]} ${wasteStream.difference}/ ${wasteStream.diffMoneyConversion}</p>
                    <p>${wasteStream.emailText[1]} <span>${wasteStream.type.toUpperCase()}</span> food waste</p>
                </div>

                <div>Weekly average Waste per Cover</div>
                ${site.coverInputs == 0 ? "No inputs available for weekly number of customers" : (parseFloat(wasteStream.thisWeekVal) / site.coverInputs).toFixed(2)};
                <div>(${wasteStream.thisWeekVal} waste Kg / ${site.coverInputs} people)</div>

                <div>Weekly average Waste per Cover</div>
                ${site.salesInputs == 0 ? "No inputs available for weekly number of customers" : (parseFloat(wasteStream.thisWeekVal) / site.salesInputs).toFixed(2)};
                <div>(${wasteStream.thisWeekVal} waste Kg / ${site.salesInputs} people)</div>

                `;
            })}
            `;
        })}

        <div></div>
        <p><span>Thank you</span><p>
        <p><span>Green + Kode </span><p>
        <p><span>email : contact@greenkode.net </span></p>
    </body>
    </html>`;
};

export const weeklyTrendsEmailTemplate = (companyData) => {
    return `<html>
    <head>
        <style>
            p {margin:0;padding:0;}
            div {margin-bottom: 1rem;}
            span {font-weight: bold;}
        </style>
    </head>
    <body>
        <left>
            <a href="www.greenkode.net"><img src="https://i.imgur.com/qJ5bLiR.jpg" title="source: imgur.com" style="object-fit:fill;width:200px;height:auto;"/></a>
        </left>
        <h3>GREEN + KODE FOOD WASTE TREND REPORT</h3>
        <div></div>
        <div>
            <p>Hello ${companyData.userName},</p>
            <div></div>
            <p><span>${formatCompanyName(companyData.companyName)} Trends</span></p>
            <p>The company <span>${formatCompanyName(companyData.companyName)}</span> has <span>${companyData.activeSites} active sites:</span></p>
        </div>
        <div>
            <p><span>Weekly Food Waste Trends</span></p>
            <p>Here is your food waste trend report from <span>${companyData.lastWeekStartDate}</span> to <span>${companyData.lastWeekEndDate}</span></p>
        </div>
        ${companyData.siteData.map((site,index) => {
        return `
            <div>
                <p><span>${index+1}. The difference between this and last week at ${formatSiteName(site.siteId)}:</span></p>
                <p><span>${site.siteMessages[0]}</span></p>
                <p><span>${site.siteMessages[1]}</span></p>
                <p><span>${site.siteMessages[2]}</span></p>
            </div>
            `;
        })}
        <div></div>
        <p><span>Thank you</span><p>
        <p><span>Green + Kode </span><p>
        <p><span>email : contact@greenkode.net </span></p>
    </body>
    </html>`;
};

export const aiEmailTemplate = (companyData) => {
    return `<html>
    <head>
        <style>
            p {margin:0;padding:0;}
            div {margin-bottom: 1rem;}
            span {font-weight: bold;}
        </style>
    </head>
    <body>
        <left>
            <a href="www.greenkode.net"><img src="https://i.imgur.com/qJ5bLiR.jpg" title="source: imgur.com" style="object-fit:fill;width:200px;height:auto;"/></a>
        </left>
        <h3>GREEN + KODE FOOD AI PREDICTION WASTE TREND REPORT</h3>
        <div></div>
        <div>
            <p>Hello ${companyData.userName},</p>
            <div></div>
            <p><span>${formatCompanyName(companyData.companyName)} Trends</span></p>
            <p>The company <span>${formatCompanyName(companyData.companyName)}</span> has <span>${companyData.activeSites} active sites:</span></p>
        </div>
        <div>
            <p><span>Monthly Food Predicted Waste Trends (end of month)</span></p>
            <p>Here is your predicted food waste trend report from <span>${companyData.previousMonth}</span> to <span>${companyData.startMonth}</span></p>
        </div>
        ${companyData.siteData.map((site,index) => {
        return `
            <div>
                <p><span>${index+1}. ${formatSiteName(site.site.siteId)}:</span></p>
                <p><span> AI Monthly Food Waste Trends (Monthly)</span></p>

                <p>${site.site.wasteMessages[0].monthlyForecastValues[0]}</p>
                <p>${site.site.wasteMessages[0].monthlyForecastValues[1]}</p>
                <p>${site.site.wasteMessages[0].monthlyForecastValues[2]}</p>
                <div></div>
                <p><span> AI Monthly Food Waste Trends (Weekly)</span></p>
                <p>${site.site.wasteMessages[0].weeklyForecastValues[0]}</p>
                <p>${site.site.wasteMessages[0].weeklyForecastValues[1]}</p>
                <p>${site.site.wasteMessages[0].weeklyForecastValues[2]}</p>
            </div>
            <p> In order to reduce <span>${site.targetData.targetPercent}%</span> of your waste for the <span>month of ${companyData.startMonth}</span> with the <span>DAILY</span> benefits:</p>
            <ul>
                <li><p><span> Saving ${site.targetData.dailyMealSaving} meals each day!</span></p></li>
                <li><p><span> Saving ${site.targetData.dailyC02Saving} Kg of CO2 each day!</span></p></li>
                <li><p><span> Saving £${site.targetData.dailyMoneySaving} each day!</span></p></li>
            </ul>
             <p>You need to reduce your food waste streams by:</p>
             <p><span>Cover waste reduce by ${site.targetData.coverWasteReduceBy} Kg</span></p>
             <p><span>Spoilage waste reduce by ${site.targetData.spoilageWasteReduceBy} Kg</span></p>
             <p><span>Preparation waste reduce by ${site.targetData.prepWasteReduceBy} Kg</span></p>
             <p>( EACH DAY! Please change your daily capping limits )</p>
            `;
        })
        }
        <div></div>

        <p><span>Thank you</span><p>
        <p><span>Green + Kode </span><p>
        <p><span>email : contact@greenkode.net </span></p>
    </body>
    </html>`;
};

export const monthlyTrendsEmailTemplate = (companyData) => {
    return `<html>
    <head>
        <style>
            p {margin:0;padding:0;}
            div {margin-bottom: 1rem;}
            span {font-weight: bold;}
        </style>
    </head>
    <body>
        <left>
            <a href="www.greenkode.net"><img src="https://i.imgur.com/qJ5bLiR.jpg" title="source: imgur.com" style="object-fit:fill;width:200px;height:auto;"/></a>
        </left>
        <h3>GREEN + KODE FOOD WASTE TREND REPORT</h3>
        <div></div>
        <div>
            <p>Hello ${companyData.userName},</p>
            <div></div>
            <p><span>${formatCompanyName(companyData.companyName)} Trends</span></p>
            <p>The company <span>${formatCompanyName(companyData.companyName)}</span> has <span>${companyData.activeSites} active sites:</span></p>
        </div>
        <div>
            <p><span>Monthly Food Waste Trends</span></p>
            <p>Here is your food waste trend report from <span>${companyData.previousMonth}</span> to <span>${companyData.startMonth}</span></p>
        </div>
        ${companyData.siteData.map((site,index) => {
        return `
            <div>
                <p><span>${index+1}. The difference between this and last month at ${formatSiteName(site.siteId)}:</span></p>
                <p><span>${site.siteMessages[0]}</span></p>
                <p><span>${site.siteMessages[1]}</span></p>
                <p><span>${site.siteMessages[2]}</span></p>
            </div>
            `;
        })}
        <div></div>
        <p><span>Thank you</span><p>
        <p><span>Green + Kode </span><p>
        <p><span>email : contact@greenkode.net </span></p>
    </body>
    </html>`;
};
