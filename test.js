let hexString = "8032136ccef5c74f27339838c5b14b498752dafc16c425dd77a288229931b6ad6c306e4bb26135e6137cd5c694a3b729";
let hex2 ="943fcbb4a086f71960ddffcdcf25b3b350738cb53c871566f8bde93a24c0d01ee987b3e5a444d934c2e5cf818925804e"
base64String = Buffer.from(hex2, 'hex').toString('base64');
let encoded = encodeURIComponent(base64String)
console.log(encoded);