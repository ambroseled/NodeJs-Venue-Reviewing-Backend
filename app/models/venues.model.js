const db = require("../../config/db");


exports.makePhotoPrimary = async function (id) {

};

exports.removePhoto = async function (id) {

};

exports.getOnePhoto = async function (id, filename) {

};

exports.addNewPhoto = async function () {

};

exports.getAllCategories = async function (done) {
    new Promise((resolve, reject) => {
        let sqlQuery = "SELECT category_Id AS categoryId, category_name AS categoryName, category_description AS categoryDescription FROM VenueCategory";
        db.getPool().query(sqlQuery, function(err, rows) {
            if (err) reject(err);
            resolve(rows);
        });

    }).then((rows) => {
        done(null, rows);
    }, reason => {
        throw new Error(reason);
    }).catch((reason => {
        console.log(reason);
        done(reason, null);
    }));
};

exports.updateVenue = async function (id) {

};

exports.getVenue = async function (id) {
    let queryString = "SELECT venue_name, admin_id, username, Venue.category_id, category_name, category_description, " +
        "city, short_description, long_description, date_added, address, latitude, longitude FROM Venue JOIN User ON " +
        "Venue.admin_id = User.user_id JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id WHERE " +
        "Venue.venue_id = ?";

    let photoQueryString = "SELECT photo_filename, photo_description, is_primary FROM VenuePhoto WHERE venue_id = ?";

    try {
        let venueRows = await db.getPool().query(queryString, id);

        if (venueRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        } else {
            let photoRows = db.getPool().query(photoQueryString, venueRows[0]['admin_id']);
            return Promise.resolve(venueRows[0], photoRows);
        }
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.addNewVenue = async function () {

};

exports.getAllVenues = async function (startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy, reverseSort, myLatitude, myLongitude) {

    //TODO Handle the params
    let promises = [];
    let sql = "SELECT * FROM Venue";
    promises.push(db.getPool().query(sql));
    return Promise.all(promises);
};


exports.getReview = async function (id) {
    let promises = [];
    let sql = "SELECT * FROM Review WHERE review_id = ?";
    promises.push(db.getPool().query(sql, id));
    return Promise.all(promises);
};


exports.saveReview = async function (id) {

};

