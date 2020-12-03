const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const getBeaconData = require('./getBeaconData');
const commaNumber = require('comma-number');
const axios = require('axios');
const path = require('path');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly','https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

const SPREADSHEET_ID = "18i5jGMIYHGIWiJIqr46uk3vg3198fMv3mP9qpnoD0sU";

// Cell values
const CELL_STAKER_REWARD_CURRENT = 'Eth2 Calculator!F60';
const CELL_ACTIVE_VALIDATORS = 'Eth2 Calculator!F36';
const CELL_STAKER_REWARD_FUTURE = 'Eth2 Calculator!F60';
const CELL_TOTAL_ETH = 'Eth2 Calculator!C40';
const CELL_TOTAL_STAKED_ETH = 'Eth2 Calculator!C38';
const CELL_AVG_NETWORK_ONLINE = 'Eth2 Calculator!C39';
const CELL_TOTAL_VALIDATORS_ONLINE = 'Eth2 Calculator!F36';

const filePath = path.dirname(require.main.filename)+'/credentials.json';
console.log("FILEPATH:",filePath)
let prysmData = {};
// Load client secrets from a local file.
module.exports = () => new Promise ((resolve, reject) => {
  fs.readFile(path.dirname(require.main.filename)+'/credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    
    getBeaconData().then(res=>{
      prysmData = res;
      authorize(JSON.parse(content)).then(oAuth2Client=>{
        updateNetworkOnline(oAuth2Client).then(res=>{
          updateTotalValidatorsOnline(oAuth2Client).then(res=>{
            getRewardRate(oAuth2Client).then(res=>{
              prysmData.rewardRate = res[0];
              getEthPrice().then(res=>{
                prysmData.ethPrice = res;
                let tweetData = processData(prysmData);
                resolve(tweetData);
              }).catch(err=>{
                  console.log("failed getting ETH price from CoinGecko.");
                  reject(err);
              })
            }).catch(err=>{
              console.log("failed getting reward rate from Google Sheets.");
              reject(err);
            })
          }).catch(err=>{
            console.log("failed updating total validators online from Google Sheets.");
            reject(err);
        })
        }).catch(err=>{
          console.log("failed updating total network participation rate from Google Sheets.");
          reject(err);
        })
      }).catch(err=>{
        console.log("Failed authenticating to Google Sheets.");
        reject(err);
    })
    }).catch(err=>{
      console.log("Call to beacon chain data failed.");
      reject(err);
  })
    
  });

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  const authorize = (credentials, callback) => new Promise ((resolve, reject) => {
    const {client_secret, client_id, redirect_uris} = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  })

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }

  /**
   * Prints the names and majors of students in a sample spreadsheet:
   * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
   * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
   */

  const getRewardRate = (auth) => new Promise ((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: CELL_STAKER_REWARD_CURRENT,
    }, (err, res) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        reject(err);
      }
      const rows = res.data.values;
      resolve(res.data.values[0]);
    });
  })

  const getEthPrice = () => new Promise ((resolve, reject) => {
    let url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
    axios.get(url).then(resp => {
      console.log("ETH/USD",resp.data.ethereum.usd)
      resolve(resp.data.ethereum.usd);
    }).catch(err=>{
      console.log(err)
      throw err;
    });
  })

  const updateNetworkOnline = (auth) => new Promise ((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    let values = [[(prysmData.participationRate*100).toFixed(2)+"%"]];
    let body = {values};
    let params = {
      spreadsheetId: SPREADSHEET_ID,
      range: CELL_AVG_NETWORK_ONLINE,
      valueInputOption: 'USER_ENTERED',
      includeValuesInResponse: true,
      responseDateTimeRenderOption: "FORMATTED_STRING",
      responseValueRenderOption: "FORMATTED_VALUE",
      resource: body
    };
    sheets.spreadsheets.values.update(params).then(res => {
      const rows = res.data.values;
      resolve(res.data.updatedData);
    }, err => {
      return console.log('The API returned an error: ' + err);
    });
  })

  const updateTotalValidatorsOnline = (auth) => new Promise ((resolve, reject) => {
    const sheets = google.sheets({version: 'v4', auth});
    let values = [[prysmData.ethAtStake]];
    let body = {values};
    let params = {
      spreadsheetId: SPREADSHEET_ID,
      range: CELL_TOTAL_STAKED_ETH,
      valueInputOption: 'USER_ENTERED',
      includeValuesInResponse: true,
      responseDateTimeRenderOption: "FORMATTED_STRING",
      responseValueRenderOption: "FORMATTED_VALUE",
      resource: body
    };
    sheets.spreadsheets.values.update(params).then(res => {
      const updatedData = res.data.values;
      resolve(updatedData);

    }, err => {
      reject(err);
      return console.log('The API returned an error: ' + err);
    });
  })

  const processData = (prysmData) => {
    prysmData.numActiveValidators = commaNumber(prysmData.numActiveValidators);
    prysmData.netQueueAdd = commaNumber(prysmData.netQueueAdd);
    prysmData.queueLength = commaNumber(prysmData.queueLength);
    prysmData.participationRate = (100*prysmData.participationRate).toFixed(2)+"%";
    let numReturnRate = parseFloat(prysmData.rewardRate.substring(0,prysmData.rewardRate.length-1)).toFixed(2)/100;
    prysmData.annualEthReturns = parseFloat((numReturnRate*32).toFixed(2));
    let dollarReturns = prysmData.ethPrice*prysmData.annualEthReturns;    
    prysmData.dollarReturns = dollarReturns;
    prysmData.annualDollarReturns = "$"+commaNumber(dollarReturns.toFixed(2));
    return prysmData;
  }
})