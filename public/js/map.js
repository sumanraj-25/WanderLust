mapboxgl.accessToken = mapToken;

if (!listing.geometry || !listing.geometry.coordinates) {
    console.log("Coordinates not available for this listing");
} else {
    const coordinates = listing.geometry.coordinates;

    const map = new mapboxgl.Map({
        container: 'map',
        style: "mapbox://styles/mapbox/streets-v12",
        center: coordinates,
        zoom: 9
    });

    const marker = new mapboxgl.Marker({ color: "red" })
        .setLngLat(coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
                    <h4>${listing.title}</h4>
                    <p>Exact location will be provided after booking</p>
                `)
        )
        .addTo(map);
}