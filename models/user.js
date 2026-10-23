
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    }
});

// Fix: get the plugin function
userSchema.plugin(
    passportLocalMongoose.default || passportLocalMongoose
);

module.exports = mongoose.model("User", userSchema);