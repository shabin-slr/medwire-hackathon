/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express    = require('express'),
  app          = express(),
  watson       = require('watson-developer-cloud'),
  extend       = require('util')._extend,
  i18n         = require('i18next');

//i18n settings
require('./config/i18n')(app);

// Bootstrap application settings
require('./config/express')(app);

const fbpuller = require('./firebasepuller');

// Create the service wrapper
var personalityInsights = watson.personality_insights({
  version: 'v2',
  username: '42f87171-b016-4db3-9c53-be7689bf9bd8',
  password: 'TNQFUZhg4yNx'
});

app.use(express.static(__dirname + '/public'))

app.get('/hospital', function(req, res) {
  res.sendFile(__dirname+'/public/views/hospital.html', { ct: req._csrfToken });
});

app.get('/doh', function(req, res) {
  res.sendFile(__dirname+'/public/views/doh.html', { ct: req._csrfToken });
});

app.get('/:country/disease-report', fbpuller.getCountrynReport);
app.get('/:country/:region/disease-report', fbpuller.getRegionReport);

app.post('/api/profile', function(req, res, next) {
  var parameters = extend(req.body, { acceptLanguage : i18n.lng() });

  personalityInsights.profile(parameters, function(err, profile) {
    if (err)
      return next(err);
    else
      return res.json(profile);
  });
});

app.get('/get-fb-data', fbpuller.getFBData);

app.get('/', function(req, res) {
  res.render(__dirname+'/public/views/index', { ct: req._csrfToken });
});

// error-handler settings
require('./config/error-handler')(app);

var port = process.env.PORT || process.env.VCAP_APP_PORT || 3000;
app.listen(port);
console.log('listening at:', port);
