

const db = require("../../config/db");


exports.makePhotoPrimary = async function (id) {

};

exports.removePhoto = async function (id) {

};

exports.getOnePhoto = async function (id) {

};

exports.addNewPhoto = async function () {

};

exports.getAllVCategories = async function () {

};

exports.updateVenue = async function (id) {

};

exports.getVenue = async function (id) {
    let promises = [];
    let sql = "SELECT * FROM Venue WHERE venue_id = " + id;
    promises.push(db.getPool().query(sql));
    return Promise.all(promises);
};

exports.addNewVenue = async function () {

};

exports.getAllVenues = async function (startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy, reverseSort, myLatitude, myLongitude) {
    let promises = [];
    let sql = "SELECT * FROM Venue";
    promises.push(db.getPool().query(sql));
    return Promise.all(promises);
};
