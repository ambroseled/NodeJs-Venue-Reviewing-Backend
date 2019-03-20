const db = require("../../config/db");

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

exports.makePhotoPrimary = async function (id, token) {
    let user = await getUser(token);

    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }

    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    
    try {
        let resultAdmin = await db.getPool().query(getAdminQuery, user);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        return Promise.reject(new Error("Bad Request"));
    } catch (err) {
        
    }

    
};

exports.removePhoto = async function (id, token) {
    let user = await getUser(token);

    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }


    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";

    try {
        let resultAdmin = await db.getPool().query(getAdminQuery, user);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }
        return Promise.reject(new Error("Bad Request"));
    } catch (err) {

    }
};

/**
 * Gets a photo from that database using the passed venue id and filename
 * @param id the venue id of the photo
 * @param filename the filename of the photo
 * @returns {Promise<*|undefined>}
 */
exports.getOnePhoto = async function (id, filename, description, makePrimary) {
    let queryString = "Select photo_description FROM VenuePhoto WHERE venue_id = ? AND photo_filename = ?";
    try {
        let photoRows = await db.getPool().query(queryString, [id, filename]);

        if (photoRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        }
        return Promise.resolve(photoRows[0]);
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.addNewPhoto = async function (id, token, filename, description, makePrimary) {
    let user = await getUser(token);

    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }

    if (makePrimary !== 'true' && makePrimary !== 'false') {
        return Promise.reject(new Error("Bad Request"));
    }
    makePrimary = makePrimary === 'true';

    if (!filename || !description || makePrimary === undefined) {
        return Promise.reject(new Error("Bad Request"));
    }

    let checkPrimaries = "SELECT COUNT(*) FROM VenuePhoto WHERE venue_id = ? AND is_primary";
    let clearPrimary = "UPDATE VenuePhoto SET is_primary = FALSE WHERE venue_id = ?";
    let venueQuery = "SELECT COUNT(*) FROM Venue WHERE venue_id = ?";
    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let photoQuery = "INSERT INTO VenuePhoto (venue_id, photo_filename, photo_description, is_primary) VALUES (?, ?, ?, ?)";
    let values = [id, filename, description, makePrimary];

    try {
        let resultPrimary = await db.getPool().query(checkPrimaries, id);
        console.log("Primary result: " + resultPrimary.length + " result " +resultPrimary[0]);
        if (resultPrimary[0]['COUNT(*)'] === 0) {
            makePrimary = true; //TODO test this more
        }
        console.log(makePrimary);

        let resultVenue = await db.getPool().query(venueQuery, id);
        if (resultVenue[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }


        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }


        if (makePrimary) {
            let resultClear = await db.getPool().query(clearPrimary, id);
        }

        let result = await db.getPool().query(photoQuery, values);
        return Promise.resolve(result);
    } catch (err) {

    }
};

/**
 * Gets all categories out of the database
 * @returns {Promise<*|undefined>}
 */
exports.getAllCategories = async function () {
    let queryString = "Select * FROM VenueCategory";
    try {
        let categoryRows = await db.getPool().query(queryString);

        return Promise.resolve(categoryRows);
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.updateVenue = async function (venueBody, id, token) {
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let latitude = venueBody['latitude'];
    let longitude = venueBody['longitude'];
    let address = venueBody['address'];
    let longDes = venueBody['longDescription'];
    let shortDes = venueBody['shortDescription'];
    let categoryId = venueBody['categoryId'];
    let city = venueBody['city'];
    let venueName = venueBody['venueName'];

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
        setArgs.push("venueName = ?");
        values.push(venueName);
    }

    if (!venueNameValid && !cityValid && !addressValid && !longDesValid && !shortDesValid && !categoryIdValid && !longitudeValid && !latitudeValid) {
        return Promise.reject(new Error("Bad Request"));
    }

    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let idCheck = "SELECT COUNT(*) FROM Venue WHERE venue_id = ?";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";
    let queryString = "Update Venue Set " + setArgs.join(", ") + " WHERE venue_id = ?";
    values.push(id);


    try {

        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (user !== resultAdmin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }

        if (categoryIdValid) {
            let categoryResult = await db.getPool().query(categoryCheck, categoryId);
            if (categoryResult[0]['COUNT(*)'] === 0) {
                return Promise.reject(new Error("Bad Request"));
            }
        }

        let resultId = await db.getPool().query(idCheck, id);
        if (resultId[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }

        let result = await db.getPool().query(queryString, values);

        return Promise.resolve();
    } catch(err) {
        console.log(err);
        return Promise.reject(err);
    }
};

exports.getVenue = async function (id) {
    let queryString = "SELECT venue_name, admin_id, username, Venue.category_id, category_name, category_description, " +
        "city, short_description, long_description, date_added, address, latitude, longitude FROM Venue JOIN User ON " +
        "Venue.admin_id = User.user_id JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id WHERE " +
        "Venue.venue_id = ?";

    let photoQueryString = "SELECT photo_filename, photo_description, is_primary FROM VenuePhoto WHERE venue_id = ?";

    try {
        let venueRows = await db.getPool().query(queryString, id);

        if (venueRows.length === 0) {
            return Promise.reject(new Error('Not Found'));
        } else {
            let photoRows = await db.getPool().query(photoQueryString, id);
            return Promise.resolve([venueRows[0], photoRows]);
        }
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.addNewVenue = async function (venueBody, token) {
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }

    if (!venueBody['city'] || venueBody['longitude'] < -180.0 || venueBody['latitude'] > 90.0 || venueBody['city'].length === 0) {
        return Promise.reject(new Error('Bad Request'));
    }
    let queryString = "INSERT INTO Venue (venue_name, admin_id, category_id, city, short_description, long_description, address, " +
        "latitude, longitude, date_added) VALUES (?, ?, ?, ? ,?, ?, ?, ?, ?, ?)";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";
    let values = [venueBody['venueName'], 1, venueBody['categoryId'], venueBody['city'], venueBody['shortDescription'],
    venueBody['longDescription'], venueBody['address'], venueBody['latitude'], venueBody['longitude'], new Date(new Date().toUTCString())];

    try {
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

exports.getAllVenues = async function (startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy, reverseSort, myLatitude, myLongitude) {
    if (minStarRating > 5 || minStarRating < 1) {
        return Promise.reject(new Error("Bad Request"));
    }

    if (maxCostRating > 4 || maxCostRating < 0) {
        return Promise.reject(new Error("Bad Request"));
    }

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

    let queryString = "SELECT Venue.venue_id, venue_name, category_id, city, short_description, latitude, longitude, " +
        "AVG(star_rating), mode_cost_rating FROM Venue LEFT OUTER JOIN Review on Venue.venue_id = reviewed_venue_id LEFT OUTER JOIN ModeCostRating M ON Venue.venue_id = M.venue_id";
    let primaryPhotoQuery = "SELECT Venue.venue_id, photo_filename FROM Venue LEFT OUTER JOIN VenuePhoto VP on Venue.venue_id = VP.venue_id";

    let distValues = null;
    if (myLatitude && myLongitude) {
        queryString = "SELECT Venue.venue_id, venue_name, category_id, city, short_description, latitude, longitude, " +
            "AVG(star_rating), mode_cost_rating, ( 3959 * acos( cos( radians( ? ) ) * cos( radians( latitude ) ) * cos( " +
            "radians( longitude ) - radians( ? ) ) + sin( radians( ? ) ) * sin(radians(latitude)) ) ) AS distance FROM " +
            "Venue LEFT OUTER JOIN Review on Venue.venue_id = reviewed_venue_id LEFT OUTER JOIN ModeCostRating M ON " +
            "Venue.venue_id = M.venue_id";
        distValues = [myLatitude, myLongitude, myLatitude];
    }

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

    if (reverseSort === 'true') {
        queryString += ' ASC';
    } else {
        queryString += ' DESC';
    }


    if (startIndex && count) {
        queryString += ' LIMIT ' + count + ' OFFSET ' + startIndex; //TODO Investigate why this does work as a wild card
    } else if (count) {
        queryString += ' LIMIT ' + count;
    } else if (startIndex) {
        queryString += ' LIMIT 18446744073709551615 OFFSET ' + startIndex; // 18446744073709551615 is used as limit is required and this is the max value possible
    }


    try {
        let venuseRows;
        if (myLatitude && myLongitude) {
            venueRows = await db.getPool().query(queryString, distValues.concat(argsValues.concat(havingValues)));
        } else {
            venueRows = await db.getPool().query(queryString, argsValues.concat(havingValues));
        }


        let photoRows = await db.getPool().query(primaryPhotoQuery);
        let rows = [venueRows, photoRows];
        return Promise.resolve(rows);
    } catch(err) {
        return Promise.reject(err);
    }
};


exports.getReviews = async function (id) {

    let queryString = "Select review_author_id, username, review_body, star_rating, cost_rating, time_posted " +
        "FROM Review JOIN User ON review_author_id = user_id WHERE reviewed_venue_id = ? " +
        "ORDER BY time_posted DESC";
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


exports.saveReview = async function (reviewBody, starRating, costRating, id, token) {
    if (!token) {
        return Promise.reject(new Error("Unauthorized"));
    }
    let user = await getUser(token);
    if (!user) {
        return Promise.reject(new Error("Unauthorized"));
    }
    if (!reviewBody || !starRating || costRating === undefined || (starRating % 1) !== 0 || (costRating % 1) !== 0) {
        console.log("noot");
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


    let queryString = "INSERT INTO Review (reviewed_venue_id, review_author_id, review_body, star_rating, cost_rating, " +
        "time_posted) VALUES (?, ?, ?, ?, ?, NOW())";
    let queryAdmin = "SELECT admin_id FROM Venue WHERE venue_id = ?";

    let queryPreviousReview = "SELECT COUNT(*) FROM Review WHERE reviewed_venue_id = ? AND review_author_id = ?";

    let values = [id, user, reviewBody, starRating, costRating];

    try {
        let admin = await db.getPool().query(queryAdmin, id);

        if (user === admin[0]['admin_id']) {
            return Promise.reject(new Error("Forbidden"));
        }

        let previous = await db.getPool().query(queryPreviousReview, [id, user]);
        if (previous[0]['COUNT(*)'] > 0) {
            return Promise.reject(new Error("Forbidden"));
        }

        let result = await db.getPool().query(queryString, values);

        return Promise.resolve(result);
    } catch(err) {
        console.log(err);
        return Promise.reject(err);
    }
};








