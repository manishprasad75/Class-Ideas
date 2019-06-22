var mongoose = require("mongoose");
var passportLocalmongoose = require("passport-local-mongoose");

//SCHEMA

var userSchema = new mongoose.Schema({
    username: String,
    passport: String,
});

userSchema.plugin(passportLocalmongoose);

module.exports = mongoose.model("User", userSchema);
