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

};

exports.addNewVenue = async function () {

};

exports.getAllVenues = async function () {
    let sql = "SELECT * FROM users";
    return await db.getPool().query(sql);
};
