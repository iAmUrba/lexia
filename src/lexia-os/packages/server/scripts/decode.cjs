const fs = require('fs');
const auth = require('../.data/.auth_state.json');
const payload = auth.accessToken.split('.')[1];
const buff = Buffer.from(payload, 'base64');
const text = buff.toString('utf-8');
console.log(text);
