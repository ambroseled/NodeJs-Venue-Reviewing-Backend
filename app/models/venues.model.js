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

exports.getVenue = async function (id, done) {
    new Promise((resolve, reject) => {
        let sqlQuery = "SELECT venue_id, venue_name, user_id, username, Venue.category_id, category_name, category_description, short_description, city, long_description, date_added, address, latitude, longitude FROM Venue JOIN User ON Venue.admin_id = User.user_id JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id WHERE venue_id = ?";
        db.getPool().query(sqlQuery, id, function(err, rows) {
            if (rows.length === 0) return reject(new Error('404 Venue Not Found'));
            else if (err) reject(err);
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
