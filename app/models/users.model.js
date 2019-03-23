const db = require("../../config/db");
const passwords = require('../../config/passwords');
// Importing used modules
const emailValidator = require("email-validator");
const UIDGenerator = require('uid-generator');
const uidgen = new UIDGenerator();
const fileType = require('file-type');
const fs = require('mz/fs');

/**
 * Getting the user related to a passed token
 * @param token the token for the user to get
 * @returns null for an invalid token, the user_id for a valid token
 */
async function getUser(token) {
    // Checking the token is present
    if (!token) {
        return null;
    }
    // Querying for the user
    let queryString = "SELECT user_id FROM User WHERE auth_token = ?";
    let userRow = await db.getPool().query(queryString, token);
    if (userRow.length < 1) {
        // Returning null as no user was returned
        return null;
    }
    // Returning the user id
    return userRow[0]['user_id'];
}

/**
 * Checking if a user exists through a user id
 * @param id the user id
 * @returns a boolean true for user exists
 */
async function checkUserExists(id) {
    // Querying for the user
    let query = "SELECT COUNT(*) FROM User WHERE user_id = ?";
    let result = await db.getPool().query(query, id);
    return result[0]['COUNT(*)'] === 0;
}

/**
 * Getting pne user out of the database
 * @param id the id of the user to get
 * @param token the auth token for the user
 * @returns the user data from teh database
 */
exports.getOneUser = async function (id, token) {
    // Forming the query to get the user
    let queryString = "Select username, email, given_name, family_name, user_id FROM User WHERE user_id = ?";
    try {
        // Querying the database for the user
        let userRows = await db.getPool().query(queryString, id);
        // Checking that user data was returned
        if (userRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        // Checking if the user has an auth
        let user = await getUser(token);
        // If the user has is authenticated and looking for their own data email will also be shown
        if (user === userRows[0]['user_id']) {
            return Promise.resolve([userRows[0], true]);
        } else {
            return Promise.resolve([userRows[0], false]);
        }
    } catch(err) {
        // Rejecting promise as an error was thrown
        return Promise.reject(err);
    }
};

/**
 * Getting all the reviews out of the database for a passed user id
 * @param id the id of teh user
 * @returns the review data
 */
exports.getAllReviews = async function (id) {
    // Forming the query string
    let queryString = "Select review_author_id, username, review_body, star_rating, cost_rating, time_posted, Venue.venue_id, " +
        "venue_name, category_name, city, short_description FROM Review JOIN User ON review_author_id = " +
        "user_id JOIN Venue ON venue_id = reviewed_venue_id JOIN VenueCategory VC ON VC.category_id = Venue.category_id" +
        " WHERE review_author_id = ?";
    // Forming query string to get venue photos
    let photoQuery = "SELECT Venue.venue_id, photo_filename FROM Review JOIN User ON review_author_id = user_id JOIN Venue ON venue_id " +
        "= reviewed_venue_id JOIN VenuePhoto VP on Venue.venue_id = VP.venue_id WHERE user_id = ? AND is_primary";
    try {
        // Querying the data base
        let reviewRows = await db.getPool().query(queryString, id);
        if (reviewRows.length === 0) {
            // Rejecting if no results were returned
            return Promise.reject(new Error('Not Found'));
        }
        // Getting teh venue photos from teh database
        let photoRows = await db.getPool().query(photoQuery, id);

        let photos = [];
        // Making a photo list the same length as the reviews response so they can be added to teh response message correctly
        for (let i = 0; i < reviewRows.length; i++) {
            if (photoRows.length <= i) {
                photos.push({"photo_filename" : ""});
            } else if (reviewRows[i]['venue_id'] === photoRows[i]['venue_id']) {
                photos.push({"photo_filename" : photoRows[i]["photo_filename"]});
            } else {
                photos.push({"photo_filename" : ""});
            }
        }
        // Returning the review and photo data
        return Promise.resolve([reviewRows, photos]);
    } catch(err) {
        // Catching a rejecting any errors
        console.log(err);
        return Promise.reject(err);
    }
};

/**
 * Saving a passed photo to the database and local storage
 * @param id The user id
 * @param token the users authentication token
 * @param buffer the image buffer
 * @returns the return code for the http response
 */
exports.savePhoto = async function (id, token, buffer) {
    // Checking the users token
    let user = await getUser(token);
    // Checking the result of checking the token
    if (await checkUserExists(id)) {
        return Promise.reject(new Error("Not Found"));
    }
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (user !== parseInt(id, 10)) {
        return Promise.reject(new Error("Forbidden"));
    }

    // Forming the image filename
    let filename = "user" + id + "_profile_photo." + fileType(buffer)['ext'];
    // Forming the queries to be used
    let checkPhoto = "SELECT profile_photo_filename FROM User WHERE user_id = ?";
    let updateQuery = "UPDATE User SET profile_photo_filename = ? WHERE user_id = ?";

    try {
        let returnCode = 200;
        // Checking the user photo
        let checkResult = await db.getPool().query(checkPhoto, id);
        if (!checkResult[0]['profile_photo_filename']) {
            returnCode = 201;
        } else {
            // Removing old profile photo
            await fs.unlink("storage/photos/" + checkResult[0]['profile_photo_filename']);
        }
        // Checking photo directory is present, creating it if not
        await fs.mkdir('storage/photos/', {recursive: true}).then(
            {}, (err) => {
                if(err.code !== 'EEXIST') return Promise.reject(err);
            }
        );
        // Writing the photo to local storage
        await fs.writeFile("storage/photos/" + filename, buffer);
        // Saving the photo in the database
        let result = await db.getPool().query(updateQuery, [filename, id]);
        // Resolving the promise
        return Promise.resolve(returnCode);
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Getting the users profile photo
 * @param id the users id
 * @returns the photo data
 */
exports.getOnePhoto = async function (id) {
    // Checking that the users exists
    if (await checkUserExists(id)) {
        return Promise.reject(new Error("Not Found"));
    }
    // Forming query to get photo filename
    let queryString = "SELECT profile_photo_filename FROM User WHERE user_id = ?";
    try {
        // Querying for the photo filename
        let resultCheck = await db.getPool().query(queryString, id);
        let filename = resultCheck[0]['profile_photo_filename'];
        if (!filename) {
            return Promise.reject(new Error("Not Found"));
        }
        // Returning the photo data
        return Promise.resolve(await fs.readFile('storage/photos/' + filename));
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Adding a new user to the system
 * @param username the new username
 * @param email the new email
 * @param given_name the new given name
 * @param family_name the new family name
 * @param password the new password
 * @returns the result of the insert query
 */
exports.addUser = async function (username, email, given_name, family_name, password) {
    // Checking if any required fields are missing
    if (!password || !username || !email || !given_name || !family_name) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Checking the password is long enough
    if (password.length === 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Checking the email is valid
    if (!emailValidator.validate(email)) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Forming query to insert the new user into the database
    let queryString = "INSERT INTO User (username, email, given_name, family_name, password) VALUES (?, ?, ?, ?, ?)";

    try {
        // Inserting the user into the database
        let result = await db.getPool().query(queryString, [username, email, given_name, family_name, await passwords.hash(password)]);
        // Returning the result
        return Promise.resolve(result);
    } catch(err) {
        // Catching any errors
        return Promise.reject(err);
    }
};

/**
 * Updating a users details in teh database
 * @param givenName the new given name
 * @param familyName the new family name
 * @param password the new password
 * @param token the auth token
 * @param id the user if
 * @returns the result of the update query
 */
exports.patchUser = async function (givenName, familyName, password, token, id) {
    // Checking the users auth token
    let user = await getUser(token);
    // Handling teh results of the auth check
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (user !== parseInt(id, 10)) {
        return Promise.reject(new Error("Forbidden"));
    }

    let givenValid = true;
    let familyValid = true;
    let passValid = true;

    // Validating the new details of the user
    if (!givenName) {
        givenValid = false;
    }
    if (givenName !== undefined && givenName.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (!familyName) {
        familyValid = false;
    }
    if (familyName !== undefined && familyName.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (!password) {
        passValid = false;
    }
    if (password !== undefined && (password.length < 1 || (typeof password) !== "string")) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (!givenValid && !familyValid && !passValid) {
        return Promise.reject(new Error("Bad Request"));
    }


    let setArgs = [];
    let queryValues = [];
    // Forming the query to update the user
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
        // Performing the update of teh user
        let result = await db.getPool().query(updateQuery, queryValues);
        return Promise.resolve(result);
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Logging the past user out of the system
 * @param token the users auth token
 * @returns the result of the logout
 */
exports.logout = async function (token) {
    // Checking the auth token
    let user = await getUser(token);
    // Handling result of auth check
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Forming query for logout
    let updateQuery = "UPDATE User SET auth_token = null WHERE user_id = ?";
    try {
        // Performing logout query
        let result = await db.getPool().query(updateQuery, user);
        return Promise.resolve(result);
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Logging a passed user into the system
 * @param username the users username
 * @param email the user email
 * @param password the user password
 * @returns the auth token and user id of the logged in user
 */
exports.login = async function (username, email, password) {
    let queryString;
    let values = [];
    // Checking values given and forming query dependent on the values
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
        // Performing login query
        let result = await db.getPool().query(queryString, values);
        // Checking result of the login
        if (result.length === 0) {
            return Promise.reject(new Error('Bad Request'));
        }
        if (await passwords.compare(result[0]['password'], password)) {
            // If password is correct, generating an auth token and storing it in teh user table
            let token = await uidgen.generate();
            await db.getPool().query("UPDATE User SET auth_token = ? WHERE user_id = ?", [token, result[0]['user_id']]);
            return Promise.resolve([result, token]);
        } else {
            // Password is incorrect
            return Promise.reject(new Error('Bad Request'));
        }
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Removing a users primary photo
 * @param token
 * @param id
 * @returns {Promise<*>}
 */
exports.removePrimaryPhoto = async function (token, id) {
    //TODO Test this, all cases

    // Checking users auth token
    let user = await getUser(token);
    // Checking user exists
    if (await checkUserExists(id)) {
        return Promise.reject(new Error("Not Found"));
    }
    // Handling result of auth check
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (user !== parseInt(id, 10)) {
        return Promise.reject(new Error("Forbidden"));
    }
    // Forming queries required
    let queryString = "SELECT profile_photo_filename FROM User WHERE user_id = ?";
    let removeQuery = "UPDATE User SET profile_photo_filename = NULL WHERE user_id = ?";
    try {
        // Getting the users photo filename
        let result = await db.getPool().query(queryString, id);
        if (!result[0]['profile_photo_filename']) {
            return Promise.reject(new Error("Not Found"));
        }
        // Removing the photo from local storage
        await fs.unlink("storage/photos/" + result[0]['profile_photo_filename']);
        // Removing the photo from the database
        let removeResult = await db.getPool().query(removeQuery, id);
        return Promise.resolve();
    } catch(err) {
        // Catching errors
        console.log(err);
        return Promise.reject(err);
    }
};
