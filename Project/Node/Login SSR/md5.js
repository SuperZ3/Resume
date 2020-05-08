const crypto = require('crypto');

let obj = crypto.createHash('md5');

obj.update('')

obj.digest('hex');