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
app.get('/api/activities', passport.authenticate('basic', {session: false}), function(req, res) {
  Activities.find({}).then(function(results) {
    res.json(results);
  });
});

// create a new activity to track
// in an application with a front end I would name the req.
app.post('/api/activities', passport.authenticate('basic', {session: false}), function(req, res) {
  const activity = new Activities({
    activityName: req.body.activityName
  }).save().then(function(result) {
    var data = {date: req.body.data[0].date, amount: req.body.data[0].amount};
    result.data.push(data);
    result.save().then(function() {
      res.json({});
    });
  });

});

// show information about one activity that I am tracking, and give me the data I have recorded for that activity
app.get('/api/activities/:id', passport.authenticate('basic', {session: false}), function(req, res) {
  var id = req.params.id;
 Activities.findOne({_id: id}).then(function(result) {
    res.json(result);
 });
});

// update one activity I am tracking, changing attributes. But since tracked data cant be changed, I changed this to a patch instead of a put
app.patch('/api/activities/:id', passport.authenticate('basic', {session: false}), function(req, res) {
  var id = req.params.id;
  var newActivity = req.body.activityName;
  var msg = '';
 Activities.findOne({_id: id}).then(function(result) {
   if (req.body.activityName) {
     result.activityName = req.body.activityName;
     result.save();
     res.json(result);
   } else {
     msg = 'Please submit a new activity';
     res.status(404).json(msg);
   }
 });
});

// delete an activity that Im tracking... removes all tracked data as well
app.delete('/api/activities/:id', passport.authenticate('basic', {session: false}), function(req, res) {
  var id = req.params.id;
  Activities.deleteOne({_id: id}).then(function() {
    res.json({});
  });
});

// Add tracked data for a day, should include the day tracked, and if the day is the same, you can override the previous data--upsert
app.post('/api/activities/:id/stats', passport.authenticate('basic', {session: false}), function(req, res) {
  var id = req.params.id;
  var newDate = req.body.date;
  var newDateObject = new Date(newDate);
  var newAmount = req.body.amount;

  Activities.findOne({_id: id}).then(function(item) {
    for(var i = 0; i < item.data.length; i++) {
      var dbDate = item.data[i].date;
      if (dbDate.getTime() === newDateObject.getTime()) {
        console.log('working!');
        item.data[i].amount = newAmount;
        console.log('replaced amount ', item.data[i].amount);
        item.save().then(function() {
          res.json(item);
        });
        return;
      } else {
        console.log('not going to replace');
        item.data.push({
          date: newDate,
          amount: newAmount
        });
        item.save().then(function(){
          console.log('pushed and saved');
          res.json({});
        });
        return;
      }
    }
  });
});

// remove tracked data for a day
app.delete('/api/stats/:id', passport.authenticate('basic', {session: false}), function(req, res) {
  var id = req.params.id;
  var dataId = req.body.dataId;
  Activities.update({_id: id}, {$pull: {data: {_id: dataId}}}).then(function(result) {
    res.json(result);
  });
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
