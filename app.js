const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const parseurl = require('parseurl');
const Activities = require('./models/activities');
const Users = require('./models/users');
const passport = require("passport");
const BasicStrategy = require("passport-http").BasicStrategy;


mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost:27017/jbstats');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

passport.use(new BasicStrategy(
  function(username, password, done) {
    Users.findOne({username: username, password: password}).then(function(user) {
      if(!user) {
        return done(null, false);
      } else {
        return done(null, username);
      }
    });
  }
));

app.use(function(req, res, next) {
  passport.authenticate('basic', {session: false});
  next();
});

// REQUESTS

// show a list of all the activities I am tracking, and links to their pages
app.get('/api/activities', function(req, res) {
  Activities.find({}).then(function(results) {
    res.json(results);
  });
});

// create a new activity to track
app.post('/api/activities', function(req, res) {
  const activity = new Activities({
    activityName: req.body.activity,
    data: [{
      date: req.body.date,
      amount: req.body.amount
    }]
  }).save();
  res.json({});
});

// show information about one activity that I am tracking, and give me the data I have recorded for that activity
app.get('/api/activities/:id', function(req, res) {
  var id = req.params.id;
 Activities.findOne({_id: id}).then(function(result) {
    res.json(result);
 });
});

// update one activity I am tracking, changing attributes. But since tracked data cant be changed, I changed this to a patch instead of a put
app.patch('/api/activities/:id', function(req, res) {
  var id = req.params.id;
  var newActivity = req.body.activity;
  var msg = '';
 Activities.findOne({_id: id}).then(function(result) {
   if (req.body.activity) {
     result.activityName = newActivity;
     result.save();
     res.json(result);
   } else {
     msg = 'Please submit a new activity';
     res.status(404).json(msg);
   }
 });
});

// delete an activity that Im tracking... removes all tracked data as well
app.delete('/api/activites/:id', function(req, res) {
  Activities.deleteOne({_id: id}).then(function() {
    res.json({});
  });
});

// Add tracked data for a day, should include the day tracked, and if the day is the same, you can override the previous data--upsert
app.post('/api/activities/:id/stats', function(req, res) {
  var id = req.params.id;
  var newDate = req.body.data.date;

  Activities.findOneAndUpdate({_id: id}, {data: [{date: }]}).then(function(req, res) {

  });
});

// remove tracked data for a day
app.delete('/api/stats/:id', function(req, res) {

});

app.listen(3000, function() {
  console.log('successfully initiated express application');
});

// -------ADDING DATA TO DATABASE

// const activity = new Activities({
//   activityName: 'push ups',
//   data: [{
//     amount: 20
//   }]
// });
//
// activity.save();

// const user = new Users({
//   username: 'Matthew',
//   password: '1234'
// });
//
// user.save();
