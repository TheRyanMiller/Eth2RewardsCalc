let hexString = "example pubkey string";
let hex2 ="example pubkey string"
base64String = Buffer.from(hex2, 'hex').toString('base64');
let encoded = encodeURIComponent(base64String)
console.log(encoded);