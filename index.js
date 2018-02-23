"use strict";

var express = require('express');
var bodyParser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;

class MongoAbstraction {
  constructor(mongourl) {
    this.url = mongourl || "mongodb://mongodb:27017";
  }

  getClient() {
    return new Promise((resolve, reject) => {
      if (this.client){
        resolve(this.client);
      } else {
        MongoClient.connect(this.url, (err, client) => {
          if (err) {
            reject(err);
          }
          this.client = client;
          resolve(this.client);
        });
      }
    })
  }
}

var mongoConnection = new MongoAbstraction();

const app = express();
app.use(bodyParser.json()); // for parsing application/json

//
// TODO think of a reporting API for billing to consume from
//
app.get('/audit/api/report', (req, res) => {
  /*
   * Endpoint used to retrieve aggregated report
   */
  mongoConnection.getClient().then((client) => {
    const collection = client.db('audit').collection('api');
    collection.aggregate([
      {"$group": {
        "_id":{"endpoint": "$request.uri", "status": "$response.status", "username": "$consumer.username"},
        "count": {"$sum": 1}
      }}
    ], (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).send('Failed to generate report');
      }

      results.toArray().then((array) => {
        console.log(array);
        res.status(200).send(array);
      }).catch((error) => {
        console.error("failed to parse results", error);
        res.status(500).send('failed to parse report results');
      });
    })
  })
})


app.post('/audit/api/trail', (req, res) => {
  /*
   * Endpoint used to receive audit trail data from  kong
   */

  let breadcrumb = req.body;

  const unwanted = ['api', 'authenticated_entity', 'tries'];
  for (let k of unwanted) {
    if (breadcrumb.hasOwnProperty(k)){
      delete breadcrumb[k];
    }
  }

  if (breadcrumb.response.hasOwnProperty('headers')) {
    delete breadcrumb.response.headers;
  }

  if (breadcrumb.request.hasOwnProperty('headers')) {
    delete breadcrumb.request.headers;
  }

  mongoConnection.getClient().then((client) => {
    const collection = client.db('audit').collection('api');
    collection.insert(breadcrumb).then(() => {
      // console.log('entry persisted', breadcrumb);
      return res.status(200).send();
    }).catch((error) => {
      console.error(error);
      return res.status(500).send('Failed to persist breadcrumb');
    })
  }).catch((error) => {
    console.error(error);
    return res.status(500).send('Failed to obtain database connection');
  })
});

app.listen(80, () => {console.log('--- auditing service running (port 80) ---')});
