# @Eth2Bot
This is a Twitter bot used to track rewards rate, network participation rate, and other statistics about Ethereum 2.0.  

## Installation Steps
1. Make a personal copy of [Eth2 Reward Calc Google Sheet](bit.ly/eth2-calc).
1. Clone this repo with `git clone`.
1. Run `cd Eth2RewardsCalc && npm install` to install npm packages.
1. Run `node sheets_demo.js` to generate an access token and credentials.json file used to edit Google.Sheets.
1. Download the `credentials.json` file and save it to project root directory.
1. Make a copy of `.env.example` and rename to `.env`, and update it with your values.
1. Run the bot using `node twitter.js`.


## Contact
Twitter: @real_Mills
Eth: ryanmiller.eth