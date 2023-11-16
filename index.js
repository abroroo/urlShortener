const dotenv = require("dotenv");  //require dotenv package
dotenv.config({ path: "./config.env" })
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
let mongo = require('mongodb')
let mongoose = require('mongoose')
const { MongoClient, ServerApiVersion } = require('mongodb');

// Basic Configuration
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  console.log('This is the root page for views: ', process.cwd())
  res.sendFile(process.cwd() + '/views/index.html');
});



// Connection to Database
let URI = process.env.MONGO_URI;

// mongoose.connect(URI, {
//   useUnifiedTopology: true,
//   serverSelectionTimeoutMS: 5000
// })

// const connection = mongoose.connection;

// connection.on('error', console.error.bind(console, "connection error"))
// connection.once('open', () => {
//   console.log('MongoDB database connection has been established successfully')
// })




// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


// creating a schema for the model
let urlSchema = mongoose.Schema({
  original: { type: String, required: true },
  short: { type: Number }
})
// creating the actual model
let Url = mongoose.model('Url', urlSchema);



// Your first API endpoint

const responseObj = {};

app.post('/api/shorturl', bodyParser.urlencoded({ extended: false }), (req, res) => {
  let urlInput = req.body.url

  let urlRegex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi)

  if (!urlInput.match(urlRegex)) {
    res.json({ error: 'Invalid URL' })
    return
  }

  responseObj["original_url"] = urlInput;

  let shortUrl = 1

  Url.findOne({})
    .sort({ short: 'desc' })
    .exec((error, result) => {
      if (!error && result != undefined) {
        shortUrl = result.short + 1
      }
      if (!error) {
        Url.findOneAndUpdate(
          { original: urlInput },
          { original: urlInput, short: shortUrl },
          { new: true, upsert: true },
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

app.get('/api/shorturl/:input', (req, res) => {
  let input = req.params.input

  Url.findOne({ short: input }, (error, result) => {
    if (!error && result != undefined) {
      res.redirect(result.original)
    } else {
      res.json("URL Not Found")
    }
  })

})


const port = process.env.PORT || 3000;

// listen for requests :)
var listener = app.listen(port, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});