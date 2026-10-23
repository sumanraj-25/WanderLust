const mongoose = require("mongoose");

const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");

    // Check what data.js is actually giving us
    console.log("Number of listings:", initData.data.length);
    console.log("First listing:", initData.data[0]);

    await Listing.deleteMany({});
    initData.data.map((obj) => ({...obj, owner: "6acce03dac0cef85a654eb13" }));
    await Listing.insertMany(initData.data);

    console.log("data was initialized");

    await mongoose.connection.close();
}

main().catch((err) => {
    console.log(err);
});