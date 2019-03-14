const db = require("../../config/db");
const passwords = require('../../config/passwords');

const cryptoJs = require("crypto");
const emailValidator = require("email-validator");
const jwt = require("jsonwebtoken");

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


exports.addUser = async function (username, email, given_name, family_name, password) {

    if (!password || !username || !email || !given_name || !family_name) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (password.length === 0) {
        return Promise.reject(new Error("Bad Request"));
    }

    if (!emailValidator.validate(email)) {
        return Promise.reject(new Error("Bad Request"));
    }
    //TODO auth token
    let queryString = "INSERT INTO User (username, email, given_name, family_name, password) VALUES (?, ?, ?, ?, ?)";

    try {

        let result = await db.getPool().query(queryString, [username, email, given_name, family_name, await passwords.hash(password)]);
        console.log(result);

        return Promise.resolve(result);
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.patchUser = async function (reviewBody, starRating, costRating, id) {
    return Promise.reject(new Error("Noot"));
};

function getToken(userId, userEmail) {
    const today = new Date();
    let expDate = new Date(today);
    expDate.setDate(today.getDate() + 60);

    return jwt.sign({
       email: userEmail,
        id: userId,
        exp: parseInt(expDate.getTime() / 1000, 10),
    }, 'secret');
}

exports.login = async function (username, email, password) {
    let queryString;
    let values = [];
    if (!username) {
        queryString = "SELECT user_id, password FROM User WHERE email = ?";
        values = [email];
    } else if (!email) {
        queryString = "SELECT user_id, password FROM User WHERE username = ?";
        values = [username];
    } else {
        queryString = "SELECT user_id, password FROM User WHERE username = ? AND email = ?";
        values = [username, email];
    }


    let token = cryptoJs.randomBytes(32).toString('hex');

    try {
        let result = await db.getPool().query(queryString, values);

        if (result.length === 0) {
            return Promise.reject(new Error('Bad Request'));
        }

        await db.getPool().query("UPDATE User SET auth_token = ? WHERE user_id = ?", [token, result[0]]['user_id']);

        if (await passwords.compare(result[0]['password'], password)) {
            return Promise.resolve(result);
        } else {
            return Promise.reject(new Error('Bad Request'));
        }

    } catch(err) {
        return Promise.reject(err);
    }
};



