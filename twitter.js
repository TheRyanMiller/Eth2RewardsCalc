const Twitter = require('twitter');
const eth2calc = require('./eth2calc');
const cron = require('node-cron');
require('dotenv').config();

let client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});
let client2 = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY2,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET2,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY2,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET2
});

let cronValue = "34 0,6,12,18 * * *";

const test = () => {
    eth2calc().then(data=>{
        let status = buildTweet(data);
        // client2.post('statuses/update', {
        //     status
        // },function(error, tweet, response) {
        //     if(error) console.log(error);
        //     else{                                  
        //         console.log("Tweet successful.");
        //     }
        // })
    });
}

if(process.env.ISPROD==="true"){
    let postTask = cron.schedule(cronValue, () => {
        eth2calc().then(data=>{
            let status = buildTweet(data);
            client.post('statuses/update', {
                //status
            },function(error, tweet, response) {
                if(error) console.log(error);
                else{                                  
                    console.log("Tweet successful.");
                }
            })
        });
    })
}
else{
    test();
}

const buildTweet = (data) =>{
    console.log(data);
    console.log("\n");
    let tweet = "---Current Network---\n";
    tweet+="🤑 Reward rate: "+data.rewardRate+"\n";
    tweet+="👨‍🌾 Participation rate: "+data.participationRate+"\n";
    tweet+="💻 Active validators: "+data.numActiveValidators+"\n\n";
    tweet+="---Queue---\n"
    tweet+="⏰ Wait time: "+data.humanReadableWait+"\n";
    tweet+="💻 Validators: "+data.queueLength+"\n\n";
    tweet+="---Projected Annual Returns---\n"
    tweet+="Ξ "+data.annualEthReturns+" ("+data.annualDollarReturns+")";
    console.log(tweet+"\n\n");
    return tweet;
}