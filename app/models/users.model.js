const db = require("../../config/db");
const passwords = require('../../config/passwords');

const emailValidator = require("email-validator");
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();


async function getUser(token) {
    if (!token) {
        return null;
    }
    let queryString = "SELECT user_id FROM User WHERE auth_token = ?";
    let userRow = await db.getPool().query(queryString, token);
    if (userRow.length < 1) {
        return null;
    }
    return userRow[0]['user_id'];
}


exports.getOneUser = async function (id, token) {

    let queryString = "Select username, email, given_name, family_name, user_id FROM User WHERE user_id = ?";
    try {
        let userRows = await db.getPool().query(queryString, id);

        if (userRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }

        let user = await getUser(token);

        if (user === userRows[0]['user_id']) {
            return Promise.resolve([userRows[0], true]);
        } else {
            return Promise.resolve([userRows[0], false]);
        }

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


        return Promise.resolve(result);
    } catch(err) {
        return Promise.reject(err);
    }
};



exports.patchUser = async function (givenName, familyName, password, token, id) {
    let user = await getUser(token);
    console.log("beans");

    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (user !== parseInt(id, 10)) {
        return Promise.reject(new Error("Forbidden"));
    }

    console.log(!!password, password.length > 1, (typeof password) === "string");
    let givenValid = true;
    let familyValid = true;
    let passValid = true;

    if (!givenName) {
        givenValid = false;
    }
    console.log("ree");
    if (givenName !== undefined && givenName.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    console.log("noot");
    if (!familyName) {
        familyValid = false;
    }
    if (familyName !== undefined && familyName.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (!password) {
        passValid = false;
    }
    if (password !== undefined && password.length < 1 || (typeof password) !== "string") {
        return Promise.reject(new Error("Bad Request"));
    }

    if (!givenValid && !familyValid && !passValid) {
        return Promise.reject(new Error("Bad Request"));
    }


    let setArgs = [];
    let queryValues = [];

    if (givenValid) {
        setArgs.push("given_name = ?");
        queryValues.push(givenName);
    }
    if (familyValid) {
        setArgs.push("family_name = ?");
        queryValues.push(familyName);
    }
    if (passValid) {
        setArgs.push("password = ?");
        queryValues.push(await passwords.hash(password));
    }


    let updateQuery = "UPDATE User SET " + setArgs.join(", ") + " WHERE user_id = ?";
    queryValues.push(id);

    try {

        let result = await db.getPool().query(updateQuery, queryValues);
        console.log(result);
        return Promise.resolve(result);

    } catch(err) {
        return Promise.reject(err);
    }
};


exports.logout = async function (token) {
    let user = await getUser(token);

    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }

    let updateQuery = "UPDATE User SET auth_token = null WHERE user_id = ?";
    try {

        let result = await db.getPool().query(updateQuery, user);
        console.log(result);
        return Promise.resolve(result);

    } catch(err) {
        return Promise.reject(err);
    }
};


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


    try {
        let result = await db.getPool().query(queryString, values);


        if (result.length === 0) {
            return Promise.reject(new Error('Bad Request'));
        }

        if (await passwords.compare(result[0]['password'], password)) {
            let token = await uidgen.generate();

            await db.getPool().query("UPDATE User SET auth_token = ? WHERE user_id = ?", [token, result[0]['user_id']]);

            return Promise.resolve([result, token]);
        } else {
            return Promise.reject(new Error('Bad Request'));
        }

    } catch(err) {
        return Promise.reject(err);
    }
};



