require("dotenv").config();

const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const Listing = require("./models/listing");

const geocodingClient = mbxGeocoding({
    accessToken: process.env.MAP_TOKEN
});

async function updateCoordinates() {
    await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");

    const listings = await Listing.find({});

    for (let listing of listings) {
        if (
            listing.geometry &&
            listing.geometry.coordinates &&
            listing.geometry.coordinates.length === 2
        ) {
            console.log("Already has coordinates:", listing.title);
            continue;
        }

        try {
            const response = await geocodingClient.forwardGeocode({
                query: listing.location,
                limit: 1
            }).send();

            if (response.body.features.length === 0) {
                console.log("Location not found:", listing.title);
                continue;
            }

            listing.geometry = response.body.features[0].geometry;
            await listing.save();

            console.log("Coordinates added:", listing.title);
        } catch (err) {
            console.log("Error:", listing.title, err.message);
        }
    }

    await mongoose.disconnect();
    console.log("Finished updating listings!");
}

updateCoordinates().catch(console.error);