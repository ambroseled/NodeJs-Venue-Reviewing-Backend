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
        let sqlQuery = "SELECT * FROM VenueCategory";
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
    let venuePromise = new Promise((resolve, reject) => {
        let sqlQuery = "SELECT * FROM Venue WHERE venue_id = ?";
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
