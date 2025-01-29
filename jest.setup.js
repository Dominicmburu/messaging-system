// jest.setup.js
// const { TextEncoder } = require('util');
// global.TextEncoder = TextEncoder;

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

