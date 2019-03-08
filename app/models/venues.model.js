

const db = require("../../config/db");


exports.makePhotoPrimary = async function (id) {

};

exports.removePhoto = async function (id) {

};

exports.getOnePhoto = async function (id, filename) {

};

exports.addNewPhoto = async function () {

};

exports.getAllCategories = async function () {
    let promises = [];
    let sql = "SELECT * FROM VenueCategory";
    promises.push(db.getPool().query(sql));
    return Promise.all(promises);
};

exports.updateVenue = async function (id) {

};

exports.getVenue = async function (id, done) {
    let promises = [];
    let sql = "SELECT * FROM Venue WHERE venue_id = ?";
    promises.push(db.getPool().query(sql, id, function(err, rows) {
        if (rows.length === 0) {
            return done({"ERROR":'Venue id: ' + id + ' not found'});
        }
        console.log(rows);
        return done(rows);
    }));
    return Promise.all(promises);
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
