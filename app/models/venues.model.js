const db = require("../../config/db");


exports.makePhotoPrimary = async function (id) {
    Promise.reject("Noot");
};

exports.removePhoto = async function (id) {
    Promise.reject("Noot");
};

/**
 * Gets a photo from that database using the passed venue id and filename
 * @param id the venue id of the photo
 * @param filename the filename of the photo
 * @returns {Promise<*|undefined>}
 */
exports.getOnePhoto = async function (id, filename) {
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

exports.addNewPhoto = async function () {
    Promise.reject("Noot");
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

exports.updateVenue = async function (venueBody, id) {
    let latitude = venueBody['latitude'];
    let longitude = venueBody['longitude'];
    let address = venueBody['address'];
    let longDes = venueBody['longDescription'];
    let shortDes = venueBody['shortDescription'];
    let categoryId = venueBody['categoryId'];
    let city = venueBody['city'];
    let venueName = venueBody['venueName'];





    let getAdminQuery = "SELECT admin_id FROM Venue WHERE venue_id = ?";
    let idCheck = "SELECT COUNT(*) FROM Venue WHERE venue_id = ?";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";
    let queryString = "";
    let values = [];


    if (longDes.length >= 1 && shortDes.length >= 1) {
        console.log("nooy");
        queryString = "UPDATE Venue SET venue_name = ?, category_id = ?, city = ?, short_description = ?," +
            "long_description = ?, address = ?, latitude = ?, longitude = ? WHERE venue_id = ?";
        values = [venueName, categoryId, city, shortDes, longDes, address, latitude, longitude, id];
    } else if (longDes.length >= 1) {
        queryString = "UPDATE Venue SET venue_name = ?, category_id = ?, city = ?, " +
            "long_description = ?, address = ?, latitude = ?, longitude = ? WHERE venue_id = ?";
        values = [venueName, categoryId, city, longDes, address, latitude, longitude, id];
    } else {
        queryString = "UPDATE Venue SET venue_name = ?, category_id = ?, city = ?, short_description = ?," +
            " address = ?, latitude = ?, longitude = ? WHERE venue_id = ?";
        values = [venueName, categoryId, city, shortDes, address, latitude, longitude, id];
    }



    if (latitude < -180 || latitude > 180) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (longitude < -90 || longitude > 90) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (address.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (city.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (venueName.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }


    try {

        let resultAdmin = await db.getPool().query(getAdminQuery, id);
        if (true === false) { // TODO check against current user once done
            return Promise.reject(new Error("Forbidden"));
        }

        //TODO Unauthorized

        let categoryResult = await db.getPool().query(categoryCheck, categoryId);
        if (categoryResult[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Bad Request"));
        }

        let resultId = await db.getPool().query(idCheck, id);
        if (resultId[0]['COUNT(*)'] === 0) {
            return Promise.reject(new Error("Not Found"));
        }
        console.log(queryString, values);
        let result = await db.getPool().query(queryString, values);

        return Promise.resolve();
    } catch(err) {
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
            let photoRows = db.getPool().query(photoQueryString, venueRows[0]['admin_id']);
            return Promise.resolve(venueRows[0], photoRows);
        }
    } catch(err) {
        return Promise.reject(err);
    }
};

exports.addNewVenue = async function (venueBody) {
    if (venueBody['city'].length === 0) {
        return Promise.reject(new Error('No City'));
    } else if (venueBody['latitude'] > 90.0) {
        return Promise.reject(new Error('Invalid latitude'));
    } else if (venueBody['longitude'] < -180.0) {
        return Promise.reject(new Error('Invalid longitude'));
    }
    let queryString = "INSERT INTO Venue (venue_name, admin_id, category_id, city, short_description, long_description, address, " +
        "latitude, longitude) VALUES (?, ?, ?, ? ,?, ?, ?, ?, ?)";
    let categoryCheck = "SELECT COUNT(*) FROM VenueCategory WHERE category_id = ?";

    let values = [venueBody['venueName'], 1, venueBody['categoryId'], venueBody['city'], venueBody['shortDescription'],
    venueBody['longDescription'], venueBody['address'], venueBody['latitude'], venueBody['longitude']];

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
                //TODO Calc distance and set sort
            }
        }
    }

    let queryString = "SELECT Venue.venue_id, venue_name, category_id, city, short_description, latitude, longitude, AVG(star_rating), mode_cost_rating FROM Venue LEFT OUTER JOIN Review on Venue.venue_id = reviewed_venue_id LEFT OUTER JOIN ModeCostRating M ON Venue.venue_id = M.venue_id";
    let primaryPhotoQuery = "SELECT Venue.venue_id, photo_filename FROM Venue LEFT OUTER JOIN VenuePhoto VP on Venue.venue_id = VP.venue_id";
    if (argsWhere.length > 0) {
        queryString += " WHERE " + argsWhere.join(" AND ");
    }

    queryString += " GROUP BY Venue.venue_id";

    if (argsHaving.length > 0) {
        queryString += " HAVING " + argsHaving.join(" AND ");
    }

    if (argsSort) {
        queryString += argsSort;
    } else {
        queryString += ' ORDER BY AVG(star_rating)';
    }

    if (reverseSort === 'true') {
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
        let venueRows = await db.getPool().query(queryString, argsValues.concat(havingValues));
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


exports.saveReview = async function (reviewBody, starRating, costRating, id) {
    if (reviewBody.length < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (starRating > 5 || starRating < 1) {
        return Promise.reject(new Error("Bad Request"));
    }
    if (costRating > 5 || costRating < 0) {
        return Promise.reject(new Error("Bad Request"));
    }


    let author_id = 1; //TODO get logged in user
    let time_posted = (new Date()).getTime();
    let queryString = "INSERT INTO Review (reviewed_venue_id, review_author_id, review_body, star_rating, cost_rating, " +
        "time_posted) VALUES (?, ?, ?, ?, ?, ?)";
    let queryAdmin = "SELECT admin_id FROM VENUE WHERE venue_id = ?";
    let queryPreviousReview = "SELECT COUNT(*) FROM REVIEW WHERE reviewed_venue_id = ? AND review_author_id = ?";

    let values = [id, author_id, reviewBody, starRating, costRating, time_posted];

    try {
        console.log(id);
        /**
        let admin = await db.getPool().query(queryAdmin, id);

        if (author_id !== admin[0]['admin_id']) { //TODO check against current user
            return Promise.reject(new Error("Forbidden"));
        }*/
        console.log("noot");

        /**
        let previous = await db.getPool().query(queryString, [id, current_user]);
        if (previous[0]['COUNT(*)'] > 0) { //TODO check against current user
            return Promise.reject(new Error("Forbidden"));
        }*/

        //TODO Unauthorized

        let result = await db.getPool().query(queryString, values);
        return Promise.resolve(result);
    } catch(err) {
        return Promise.reject(err);
    }
};

