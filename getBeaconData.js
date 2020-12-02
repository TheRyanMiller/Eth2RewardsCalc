const axios = require('axios');
const humanizeDuration = require("humanize-duration");

let participationRate = 0; 
let netQueueAdd = 0;
let numActiveValidators = 0;
let ethAtStake = 0;

module.exports = () => new Promise ((resolve, reject) => {
    let url = "http://192.168.1.100:3500/eth/v1alpha1/validators/queue"
    axios.get(url).then(resp => {
        let queueLength = resp.data.activationPublicKeys.length;
        let exitLength = resp.data.exitPublicKeys.length;
        netQueueAdd = queueLength - exitLength;
        url = "http://192.168.1.100:3500/eth/v1alpha1/validators/participation"
        axios.get(url).then(resp => {
            participationRate = resp.data.participation.globalParticipationRate; // voted / eligble
            ethAtStake = resp.data.participation.eligibleEther / 1000000000;
            url = "http://192.168.1.100:3500/eth/v1alpha1/validators"
            axios.get(url,{params: {active:true}}).then(resp => {
                numActiveValidators = resp.data.totalSize; // voted / eligble
                let timeUntilEmptyQueue = calcWaitTime(netQueueAdd);
                let humanReadableWait = humanizeDuration(timeUntilEmptyQueue*1000,{ round: true, units: ["d", "h"] });
                let payload = {
                    netQueueAdd, 
                    queueLength, 
                    ethAtStake, 
                    participationRate, 
                    numActiveValidators, 
                    timeUntilEmptyQueue,humanReadableWait
                };
                resolve(payload)
            })
        })
    })
})

const calcWaitTime = (queueLength) => {
    //225 Epochs per day (1 epoch = 32 * 12s slots)
    //900 validators can be activated per day (4 per epoch)
    // 1 validator every 96 seconds
    let time = 0;
    if(queueLength>0) time = 96 * queueLength;
    return time;
}