const db = require("../../config/db");

exports.getOneUser = async function (id) {
    let queryString = "Select username, email, given_name, family_name FROM User WHERE user_id = ?";
    try {
        let userRows = await db.getPool().query(queryString, id);

        if (userRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve(userRows[0]);
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.getAllReviews = async function (id) {
    let queryString = "Select review_author_id, username, review_body, star_rating, cost_rating, time_posted, venue_id, " +
        "venue_name, category_name, city, short_description FROM Review JOIN User ON review_author_id = " +
        "user_id JOIN Venue ON venue_id = reviewed_venue_id WHERE review_author_id = ?";
    try {

        let reviewRows = await db.getPool().query(queryString, id);

        if (reviewRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve(reviewRows);
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.getOnePhoto = async function (id, filename) {
    // TODO work out where profile photos are stored
    /**
    let queryString = "Select  FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    try {
        let photoRows = await db.getPool().query(queryString, [id, filename]);

        if (photoRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve(photoRows[0]);
    } catch(err) {
        return Promise.reject(err);
    }*/
    Promise.reject("Noot");
};


exports.addUser = async function (reviewBody, starRating, costRating, id) {
    return Promise.reject(new Error("Noot"));
};

exports.patchUser = async function (reviewBody, starRating, costRating, id) {
    return Promise.reject(new Error("Noot"));
};
