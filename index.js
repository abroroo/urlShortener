require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
let mongo = require('mongodb')
let mongoose = require('mongoose')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});


// Connection to Database

mongoose.connect(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})

const connection = mongoose.connection;

connection.on('error', console.error.bind(console, "connection error"))
connection.once('open', () => {
  console.log('MongoDB database connection has been established successfully')
})

// creating a schema for the model
let urlSchema = mongoose.Schema({
  original: {type: String, required: true},
  short: {type: Number}
})
// creating the actual model
let Url = mongoose.model('Url', urlSchema);


// Your first API endpoint

const responseObj = {};

app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let urlInput = req.body.url
  responseObj["original_url"] = urlInput;

  let shortUrl = 1

  Url.findOne({})
        .sort({short: 'desc'})
        .exec((error, result) => {
          if (!error && result != undefined){
            shortUrl = result.short + 1
          }
          if (!error){
            Url.findOneAndUpdate(
              {original: urlInput},
              {original: urlInput, short: shortUrl},
              {new: true, upsert: true},
              (error, savedUrl) => {
                if (!error) {
                  responseObj["short_url"] = savedUrl.short
                  res.json(responseObj)
                }
              }
            )
          }

        })
          
})

