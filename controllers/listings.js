const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async(req, res) => {
    const allListings = await Listing.find({});

    res.render("listings/index.ejs", {
        allListings
    });
};

module.exports.renderNewForm = (req, res) => {

    res.render("listings/new.ejs");

};


module.exports.showListing = async(req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    console.log("Listing owner:", listing.owner);

    res.render("listings/show.ejs", {
        listing,
        currUser: req.user
    });
};


module.exports.createListing = async(req, res) => {
    let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        })
        .send();

    if (response.body.features.length === 0) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;

    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};
module.exports.renderEditForm = async(req, res) => {

    let { id } = req.params;

    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload/w_250");
    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl
    });

};

module.exports.updateListing = async(req, res) => {
    let { id } = req.params;

    let listing = await Listing.findByIdAndUpdate(id, {
        ...req.body.listing
    });
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    return res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async(req, res) => {

    let { id } = req.params;

    const deletedListing =
        await Listing.findByIdAndDelete(id);

    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");

};


module.exports.index = async(req, res) => {
    const { search, category } = req.query;

    const conditions = [];

    // 1. Destination search: title, location, country, or description
    if (search && search.trim()) {
        const escapedSearch = search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const searchRegex = new RegExp(escapedSearch, "i");

        conditions.push({
            $or: [
                { title: searchRegex },
                { location: searchRegex },
                { country: searchRegex },
                { description: searchRegex }
            ]
        });
    }

    // 2. Category filtering
    const categoryKeywords = {
        rooms: ["room", "apartment", "suite"],
        "iconic-cities": ["city", "urban", "downtown"],
        mountains: ["mountain", "hill", "cabin"],
        castles: ["castle"],
        "amazing-pools": ["pool", "swimming"],
        camping: ["camping", "campsite", "tent"],
        farms: ["farm", "rural", "countryside"],
        arctic: ["arctic", "snow", "polar", "igloo"],
        deserts: ["desert", "dunes"]
    };

    const validCategories = [
        "trending",
        ...Object.keys(categoryKeywords)
    ];

    const selectedCategory = validCategories.includes(category) ?
        category :
        null;

    if (selectedCategory && selectedCategory !== "trending") {
        const categoryConditions = [
            { category: selectedCategory }
        ];

        const keywords = categoryKeywords[selectedCategory] || [];

        if (keywords.length > 0) {
            const keywordRegex = new RegExp(
                keywords
                .map(word => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("|"),
                "i"
            );

            categoryConditions.push({
                $or: [
                    { title: keywordRegex },
                    { description: keywordRegex },
                    { location: keywordRegex },
                    { country: keywordRegex }
                ]
            });
        }

        conditions.push({ $or: categoryConditions });
    }

    const filter = conditions.length > 0 ?
        { $and: conditions } :
        {};

    const allListings = await Listing.find(filter);

    res.render("listings/index.ejs", {
        allListings,
        search: search || "",
        selectedCategory: selectedCategory || ""
    });
};