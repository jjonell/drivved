const functions = require('./functions/functions.js');
const express = require('express');
const fileupload = require('express-fileupload');
const cors = require('cors')
const app = express();
const port = 8101;

// TODO: increase security for cors
app.use(cors());
app.use(fileupload());
app.get('/:id', functions.get);
app.post('/', functions.post);
app.listen(port, () => { console.log('server running at port ' + port); });