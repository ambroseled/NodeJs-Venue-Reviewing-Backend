const db = require("../../config/db");
const fs = require('mz/fs');


//TODO Test categories fail cases

/**
 * Getting the user related to a passed token
 * @param token the token for the user to get
 * @returns null for an invalid token, the user_id for a valid token
 */
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

/**
 * Makes a passed photo filename the primary photo for a passed venue
 * @param id the venue id
 * @param token the users auth token
 * @param filename the photo filename
 * @returns the result of the update query
 */
exports.makePhotoPrimary = async function (id, token, filename) {
    // Checking the users auth
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Forming queries that are used to update primary photo
    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let checkPhoto = "SELECT COUNT(*) FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    let setPhoto = "UPDATE VenuePhoto SET is_primary = 1 WHERE venue_id = ? AND photo_filename = ?";
    let clearPrimary = "UPDATE VenuePhoto SET is_primary = 0 WHERE venue_id = ?";
    
    try {
        // Getting the venues admin and checking that it is the user attempting the operation
        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        // checking the photo filename passed is present in the database
        let photoResult = await db.getPool().query(checkPhoto, [id, filename]);
        if (photoResult[0]["COUNT(*)"] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        // Removing all the old primary photos
        let resultClear = await db.getPool().query(clearPrimary, id);
        // Setting the new primary photo
        let result = await db.getPool().query(setPhoto, [id, filename]);
        return Promise.resolve(result);
    } catch (err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Removing a photo from a venue
 * @param id the venue id
 * @param token the users auth token
 * @param filename the photo filename
 * @returns the result of the remove
 */
exports.removePhoto = async function (id, token, filename) {
    // Checking the users auth
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Forming the queries used
    let getAdminQuery = "SELECT * FROM Venue WHERE venue_id = ?";
    let checkPhoto = "SELECT is_primary FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    let removePhoto = "DELETE FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    let getPhotos = "SELECT photo_filename FROM VenuePhoto WHERE venue_id = ?";
    let setPrimary = "UPDATE VenuePhoto SET is_primary = 1 WHERE photo_filename = ? AND venue_id = ?";

    try {
        // Checking the user is the admin of the venue
        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        // checking the photo exists
        let photoResult = await db.getPool().query(checkPhoto, [id, filename]);
        if (photoResult.length < 1) {
            return Promise.reject(new Error("Not Found"));
        }
        // Removing the photo from local storage
        await fs.unlink("storage/photos/" + filename);
        // Removing the photo from the database
        let result = await db.getPool().query(removePhoto, [id, filename]);
        if (photoResult[0]['is_primary']) {

            let photos = await db.getPool().query(getPhotos, id);
            console.log(photos);
            if (photos.length >= 1) {
                let updateResult = await db.getPool().query(setPrimary, [photos[0]['photo_filename'], id]);
            }
        }
        return Promise.resolve(result);
    } catch (err) {
        console.log(err);
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Gets a photo from that database using the passed venue id and filename
 * @param id the venue id of the photo
 * @param filename the filename of the photo
 * @returns {Promise<*|undefined>}
 */
exports.getOnePhoto = async function (id, filename) {
    // Forming query to get the photo
    let queryString = "Select COUNT(*) FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    try {
        // Querying for the photo
        let photoRows = await db.getPool().query(queryString, [id, filename]);
        // Checking the photo is in the database
        if (photoRows[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        // Reading photo and returning it
        return Promise.resolve(fs.readFile('storage/photos/' + filename));
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Adding a new photo to a venue
 * @param id the venue id
 * @param token the users auth token
 * @param filename the photo filename
 * @param description the photo description
 * @param makePrimary boolean to show if photo should be primary
 * @param buffer the photo data
 * @returns the result of the insert
 */
exports.addNewPhoto = async function (id, token, filename, description, makePrimary, buffer) {
    // Checking the users auth
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Validating the makePrimary field
    if (makePrimary !== 'true' && makePrimary !== 'false') {
        return Promise.reject(new Error("Bad Request"));
    }
    makePrimary = makePrimary === 'true';
    // Checking all other fields
    if (!filename || !description || makePrimary === undefined) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Forming the queries used
    let checkPrimaries = "SELECT COUNT(*) FROM VenuePhoto WHERE venue_id = ? AND is_primary";
    let clearPrimary = "UPDATE VenuePhoto SET is_primary = FALSE WHERE venue_id = ?";
    let venueQuery = "SELECT COUNT(*) FROM Venue WHERE venue_id = ?";
    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let photoQuery = "INSERT INTO VenuePhoto (venue_id, photo_filename, photo_description, is_primary) VALUES (?, ?, ?, ?)";
    let values = [id, filename, description, makePrimary];
    try {
        // Checking if there are any other primary photos
        let resultPrimary = await db.getPool().query(checkPrimaries, id);
        if (resultPrimary[0]['COUNT(*)'] === 0) {
            // Making this photo primary if there are no others
            makePrimary = true; //TODO test this more
        }
        // Checking the venue id is valid
        let resultVenue = await db.getPool().query(venueQuery, id);
        if (resultVenue[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        // Checking the user is the admin of the venue
        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        // Clearing the old primary photos
        if (makePrimary) {
            let resultClear = await db.getPool().query(clearPrimary, id);
        }
        // Creating photo directory if it does not exist
        let filePath = "storage/photos/" + filename;
        await fs.mkdir('storage/photos/', {recursive: true}).then(
            {}, (err) => {
                if(err.code !== 'EEXIST') return Promise.reject(err);
            }
        );
        // Writing the photo to local storage
        await fs.writeFile(filePath, buffer);
        // Writing the photo to the database
        let values = [id, filename, description, makePrimary];
        let result = await db.getPool().query(photoQuery, values);
        return Promise.resolve(result);
    } catch (err) {
        // Catching errors
        console.log(err);
        return Promise.reject(err);
    }
};

/**
 * Gets all categories out of the database
 * @returns {Promise<*|undefined>}
 */
exports.getAllCategories = async function () {
    // Forming the query to get the categories
    let queryString = "Select * FROM VenueCategory";
    try {
        // Getting the categories out of the database
        let categoryRows = await db.getPool().query(queryString);
        // Returning the result of the query
        return Promise.resolve(categoryRows);
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Updating a venues details
 * @param venueBody the information on the venue
 * @param id the venue id
 * @param token the users auth token
 * @returns {Promise<*>}
 */
exports.updateVenue = async function (venueBody, id, token) {
    // Checking the users auth
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Getting new information for the venue
    let latitude = venueBody['latitude'];
    let longitude = venueBody['longitude'];
    let address = venueBody['address'];
    let longDes = venueBody['longDescription'];
    let shortDes = venueBody['shortDescription'];
    let categoryId = venueBody['categoryId'];
    let city = venueBody['city'];
    let venueName = venueBody['venueName'];
    // Validating the new information
    let latitudeValid = true;
    let longitudeValid = true;
    let addressValid = true;
    let longDesValid = true;
    let shortDesValid = true;
    let categoryIdValid = true;
    let cityValid = true;
    let venueNameValid = true;

    let setArgs = [];
    let values = [];

    if (!latitude) {
        latitudeValid = false;
    } else if (latitude < -180 || latitude > 180) {
        return Promise.reject(new Error("Bad Request"));
    } else {
        setArgs.push("latitude = ?");
        values.push(latitude);
    }
    if (!longitude) {
        longitudeValid = false;
    }  else if (longitude < -90 || longitude > 90) {
        return Promise.reject(new Error("Bad Request"));
    } else {
        setArgs.push("longitude = ?");
        values.push(longitude);
    }
    if (!address) {
        addressValid = false;
        if (address !== undefined && address.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("address = ?");
        values.push(address);
    }
    if (!longDes) {
        longDesValid = false;
        if (longDes !== undefined && longDes.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("long_description = ?");
        values.push(longDes);
    }
    if (!shortDes) {
        shortDesValid = false;
        if (shortDes !== undefined && shortDes.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("short_description = ?");
        values.push(shortDes);
    }
    if (categoryId === undefined) {
        categoryIdValid = false;
    } else {
        setArgs.push("category_id = ?");
        values.push(categoryId);
    }
    if (!city) {
        cityValid = false;
        if (city !== undefined && city.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("city = ?");
        values.push(city);
    }
    if (!venueName) {
        venueNameValid = false;
        if (venueName !== undefined && venueName.length < 1) {
            return Promise.reject(new Error("Bad Request"));
        }
    } else {
        setArgs.push("venue_name = ?");
        values.push(venueName);
    }
    // Returning bad request if all fields are invalid
    if (!venueNameValid && !cityValid && !addressValid && !longDesValid && !shortDesValid && !categoryIdValid && !longitudeValid && !latitudeValid) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Forming queries for update
    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let idCheck = "SELECT COUNT(*) FROM Venue WHERE venue_id = ?";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";
    let queryString = "Update Venue Set " + setArgs.join(", ") + " WHERE venue_id = ?";
    values.push(id);
    try {
        // Checking the venue exists
        let resultId = await db.getPool().query(idCheck, id);
        if (resultId[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        // Checking the user is the admin of the venue
        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        // Checking that the category is valid
        if (categoryIdValid) {
            let categoryResult = await db.getPool().query(categoryCheck, categoryId);
            if (categoryResult[0]['COUNT(*)'] === 0) {
                return Promise.reject(new Error("Bad Request"));
            }
        }
        // Performing the update
        let result = await db.getPool().query(queryString, values);
        return Promise.resolve();
    } catch(err) {
        // Catching errors
        console.log(err);
        return Promise.reject(err);
    }
};

/**
 * Getting a venue using a passed id
 * @param id the venue id
 * @returns the promise data
 */
exports.getVenue = async function (id) {
    // Forming query string for getting the venue data
    let queryString = "SELECT venue_name, admin_id, username, Venue.category_id, category_name, category_description, " +
        "city, short_description, long_description, date_added, address, latitude, longitude FROM Venue JOIN User ON " +
        "Venue.admin_id = User.user_id JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id WHERE " +
        "Venue.venue_id = ?";
    let photoQueryString = "SELECT photo_filename, photo_description, is_primary FROM VenuePhoto WHERE venue_id = ?";
    try {
        // Getting the venue data
        let venueRows = await db.getPool().query(queryString, id);
        // Checking the venue data
        if (venueRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        } else {
            // Getting the venue rows
            let photoRows = await db.getPool().query(photoQueryString, id);
            return Promise.resolve([venueRows[0], photoRows]);
        }
    } catch(err) {
        // Catching errors
        return Promise.reject(err);
    }
};

/**
 * Adding a new vneue to the database
 * @param venueBody the information of the venue
 * @param token the users auth token
 * @returns the result of the add
 */
exports.addNewVenue = async function (venueBody, token) {
    // Checking the users auth
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Validating the venue information passed
    if (!venueBody['city'] || venueBody['longitude'] < -180.0 || venueBody['latitude'] > 90.0 || venueBody['city'].length === 0) {
        return Promise.reject(new Error('Bad Request'));
    }
    // Forming query strings for the add operation
    let queryString = "INSERT INTO Venue (venue_name, admin_id, category_id, city, short_description, long_description, address, " +
        "latitude, longitude, date_added) VALUES (?, ?, ?, ? ,?, ?, ?, ?, ?, ?)";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";
    let values = [venueBody['venueName'], 1, venueBody['categoryId'], venueBody['city'], venueBody['shortDescription'],
    venueBody['longDescription'], venueBody['address'], venueBody['latitude'], venueBody['longitude'], new Date(new Date().toUTCString())];
    try {
        // Adding the venue
        let categoryResult = await db.getPool().query(categoryCheck, venueBody['categoryId']);
        if (categoryResult[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Bad Request"));
        } else {
            let result = await db.getPool().query(queryString, values);
            return Promise.resolve(result);
        }
    } catch(err) {
        return Promise.reject(err);
    }
};

/**
 * Getting all venues in the database
 * @param startIndex the start index
 * @param count the count of venues to be shown
 * @param city the city for venus to be in
 * @param q venue title is like this
 * @param categoryId the category id for venues
 * @param minStarRating the min star rating for a venue
 * @param maxCostRating the max cost rating for a venue
 * @param adminId the admin id of the venues
 * @param sortBy the attribute to sort the venus by
 * @param reverseSort boolean to reverse the sort of the venues
 * @param myLatitude latitude value used t show distance
 * @param myLongitude longitude value to show distance
 * @returns the venues found
 */
exports.getAllVenues = async function (startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy, reverseSort, myLatitude, myLongitude) {
    // Checking star and cost rating are valid
    if (minStarRating > 5 || minStarRating < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (maxCostRating > 4 || maxCostRating < 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Forming the conditional query
    let argsWhere = [];
    let argsValues = [];
    let argsSort = null;
    let argsHaving = [];
    let havingValues = [];
    let orderDist = false;
    if (city) {
        argsWhere.push("city = ?");
        argsValues.push(city);
    } if (q) {
        argsWhere.push("venue_name LIKE ?");
        argsValues.push('%' + q + '%');
    } if (categoryId) {
        argsWhere.push("category_id = ?");
        argsValues.push(categoryId);
    } if (minStarRating) {
        argsHaving.push("AVG(star_rating) >= ?");
        havingValues.push(minStarRating);
    } if (maxCostRating) {
        argsHaving.push("AVG(cost_rating) <= ?");
        havingValues.push(maxCostRating);
    } if (adminId) {
        argsWhere.push("admin_id = ?");
        argsValues.push(adminId);
    } if (sortBy) {
        if (sortBy === 'COST_RATING') {
            argsSort = ' ORDER BY mode_cost_rating';
        } else if (sortBy === 'DISTANCE') {
            if (!myLongitude || !myLatitude) {
                return Promise.reject("Bad Request");
            } else {
                orderDist = true;
            }
        }
    }
    // Forming bulk of queries
    let queryString = "SELECT Venue.venue_id, venue_name, category_id, city, short_description, latitude, longitude, " +
        "AVG(star_rating), mode_cost_rating FROM Venue LEFT OUTER JOIN Review on Venue.venue_id = reviewed_venue_id LEFT OUTER JOIN ModeCostRating M ON Venue.venue_id = M.venue_id";
    let primaryPhotoQuery = "SELECT Venue.venue_id, photo_filename FROM Venue LEFT OUTER JOIN VenuePhoto VP on Venue.venue_id = VP.venue_id";
    // Forming query for distance
    let distValues = null;
    if (myLatitude && myLongitude) {
        queryString = "SELECT Venue.venue_id, venue_name, category_id, city, short_description, latitude, longitude, " +
            "AVG(star_rating), mode_cost_rating, ( 3959 * acos( cos( radians( ? ) ) * cos( radians( latitude ) ) * cos( " +
            "radians( longitude ) - radians( ? ) ) + sin( radians( ? ) ) * sin(radians(latitude)) ) ) AS distance FROM " +
            "Venue LEFT OUTER JOIN Review on Venue.venue_id = reviewed_venue_id LEFT OUTER JOIN ModeCostRating M ON " +
            "Venue.venue_id = M.venue_id";
        distValues = [myLatitude, myLongitude, myLatitude];
    }
    // Forming where extra for query
    if (argsWhere.length > 0) {
        queryString += " WHERE " + argsWhere.join(" AND ");
    }
    queryString += " GROUP BY Venue.venue_id";
    if (argsHaving.length > 0) {
        queryString += " HAVING " + argsHaving.join(" AND ");
    }
    if (argsSort) {
        queryString += argsSort;
    } else if (orderDist) {
        queryString += " ORDER BY distance"
    } else {
        queryString += ' ORDER BY AVG(star_rating)';
    }
    // Setting sort value of query
    if (reverseSort === 'true') {
        queryString += ' ASC';
    } else {
        queryString += ' DESC';
    }
    // Setting count for query
    if (startIndex && count) {
        queryString += ' LIMIT ' + count + ' OFFSET ' + startIndex;
    } else if (count) {
        queryString += ' LIMIT ' + count;
    } else if (startIndex) {
        queryString += ' LIMIT 18446744073709551615 OFFSET ' + startIndex; // 18446744073709551615 is used as limit is required and this is the max value possible
    }
    try {
        let venuseRows;
        // Querying for distance if latitude and longitude are present
        if (myLatitude && myLongitude) {
            venueRows = await db.getPool().query(queryString, distValues.concat(argsValues.concat(havingValues)));
        } else {
            // Querying without distance
            venueRows = await db.getPool().query(queryString, argsValues.concat(havingValues));
        }
        // Getting venue photos
        let photoRows = await db.getPool().query(primaryPhotoQuery);
        let rows = [venueRows, photoRows];
        // Returning the venue data
        return Promise.resolve(rows);
    } catch(err) {
        return Promise.reject(err);
    }
};

/**
 * Getting all reviews for a given venue
 * @param id
 * @returns {Promise<*|undefined>}
 */
exports.getReviews = async function (id) {
    // Forming query to get reviews
    let queryString = "Select review_author_id, username, review_body, star_rating, cost_rating, time_posted " +
        "FROM Review JOIN User ON review_author_id = user_id WHERE reviewed_venue_id = ? " +
        "ORDER BY time_posted DESC";
    try {
        // Getting the review data from the database
        let reviewRows = await db.getPool().query(queryString, id);
        if (reviewRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        // returning the review data
        return Promise.resolve(reviewRows);
    } catch(err) {
        return Promise.reject(err);
    }
};

/**
 * Adding a new review for a venue
 * @param reviewBody the review body
 * @param starRating the star rating for the review
 * @param costRating the cost rating for the review
 * @param id the id of the venue
 * @param token the users auth token
 * @returns the result of the insert
 */
exports.saveReview = async function (reviewBody, starRating, costRating, id, token) {
    // Checking the users auth
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    // Validating the data for the new review
    if (!reviewBody || !starRating || costRating === undefined || (starRating % 1) !== 0 || (costRating % 1) !== 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (reviewBody.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (starRating > 5 || starRating < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (costRating > 5 || costRating < 0) {
        return Promise.reject(new Error("Bad Request"));
    }
    // Forming queries for the insert
    let queryString = "INSERT INTO Review (reviewed_venue_id, review_author_id, review_body, star_rating, cost_rating, " +
        "time_posted) VALUES (?, ?, ?, ?, ?, NOW())";
    let queryAdmin = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let queryPreviousReview = "SELECT COUNT(*) FROM Review WHERE reviewed_venue_id = ? AND review_author_id = ?";

    let values = [id, user, reviewBody, starRating, costRating];

    try {
        // Checking that the user is the admin of the venue
        let admin = await db.getPool().query(queryAdmin, id);
        if (user === admin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        // Checking that the user has not already reviewed the venue
        let previous = await db.getPool().query(queryPreviousReview, [id, user]);
        if (previous[0]['COUNT(*)'] > 0) {
            return Promise.reject(new Error("Forbidden"));
        }
        // Saving the review to the database
        let result = await db.getPool().query(queryString, values);
        return Promise.resolve(result);
    } catch(err) {
        console.log(err);
        return Promise.reject(err);
    }
};








