const Venues = require('../models/venues.model');


/**
 * Getting all of the venues in the system
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.viewAll = async function (req, res) {
    // Getting query parameters out of the request
    let startIndex = req.query.startIndex;
    let count = req.query.count;
    let city = req.query.city;
    let q = req.query.q;
    let categoryId = req.query.categoryId;
    let minStarRating = req.query.minStarRating;
    let maxCostRating = req.query.maxCostRating;
    let adminId = req.query.adminId;
    let sortBy = req.query.sortBy;
    let reverseSort = req.query.reverseSort;
    let myLatitude = req.query.myLatitude;
    let myLongitude = req.query.myLongitude;
    // Calling model method to get the venues from the database
    await Venues.getAllVenues(startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy,
        reverseSort, myLatitude, myLongitude)
        .then((rows) => {
                // Getting the results
                let venueRows = rows[0];
                let photoRows = rows[1];
                let  venues =[];
                // Forming the json result
                if (venueRows) {
                    if (myLongitude && myLongitude) {
                        for (let i = 0; i < venueRows.length; i++) {
                            venues.push(
                                {
                                    "venueId" : venueRows[i]['venue_id'],
                                    "venueName" : venueRows[i]['venue_name'],
                                    "categoryId" : venueRows[i]['category_id'],
                                    "city" : venueRows[i]['city'],
                                    "shortDescription" : venueRows[i]['short_description'],
                                    "latitude" : venueRows[i]['latitude'],
                                    "longitude" : venueRows[i]['longitude'],
                                    "meanStarRating" : venueRows[i]['AVG(star_rating)'],
                                    "modeCostRating" : venueRows[i]['mode_cost_rating'],
                                    "primaryPhoto" : photoRows[i]['photo_filename'],
                                    "distance" : venueRows[i]['distance'],
                                }
                            )
                        }
                    } else {
                        for (let i = 0; i < venueRows.length; i++) {
                            venues.push(
                                {
                                    "venueId" : venueRows[i]['venue_id'],
                                    "venueName" : venueRows[i]['venue_name'],
                                    "categoryId" : venueRows[i]['category_id'],
                                    "city" : venueRows[i]['city'],
                                    "shortDescription" : venueRows[i]['short_description'],
                                    "latitude" : venueRows[i]['latitude'],
                                    "longitude" : venueRows[i]['longitude'],
                                    "meanStarRating" : venueRows[i]['AVG(star_rating)'],
                                    "modeCostRating" : venueRows[i]['mode_cost_rating'],
                                    "primaryPhoto" : photoRows[i]['photo_filename']
                                }
                            )
                        }
                    }

                }
                // Sending the response
                res.statusMessage = 'OK';
                res.status(200);
                res.json(venues);
            }, (err) => {
                // Handling errors
                if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );

};

/**
 * Adding a new venue to the system
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.addNew = async function (req, res) {
    // Getting the request body
    let venueBody = req.body;
    // Using model method to add the venue to the database
    await Venues.addNewVenue(venueBody, req.headers['x-authorization'])
        .then((result) => {
            // Forming json response
            let toDisplay = {
                "venueId" : result['insertId']
            };
            // Sending the response
            res.statusMessage = 'Created';
            res.status(201);
            res.json(toDisplay);
        },
            (err) => {
                if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Getting one venue from the database
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getOne = async function (req, res) {
    // Calling model method to get the venue data
    await Venues.getVenue(req.params.id)
        .then((data) => {
           let  photos =[];
           // Forming the photo response
           if (data[1]) {
               for (let i = 0; i < data[1].length; i++) {
                   photos.push(
                       {
                           "photoFilename" : data[1][i]['photo_filename'],
                           "photoDescription" : data[1][i]['photo_description'],
                           "isPrimary" : (data[1][i]['is_primary'] === 1)
                       }
                   )
               }
           }
            // Forming the full response
            let toDisplay = {
                "venueName" : data[0]['venue_name'],
                "admin" :
                    {
                        "userId" : data[0]['admin_id'],
                        "username" : data[0]['username']
                    },
                "category" :
                    {
                        "categoryId" : data[0]['category_id'],
                        "categoryName" : data[0]['category_name'],
                        "categoryDescription" : data[0]['category_descriptions']
                    },
                "city" : data[0]['city'],
                "shortDescription" : data[0]['short_description'],
                "longDescription" : data[0]['long_description'],
                "dateAdded" : data[0]['date_added'],
                "address" : data[0]['address'],
                "latitude" : data[0]['latitude'],
                "longitude" : data[0]['longitude'],
                "photos" : photos
            };
            // Sending the response
            res.statusMessage = 'OK';
            res.status(200);
            res.json(toDisplay);
        },
            (err) => {
                // Handling errors
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Venue: ' + req.params.id + ' Not Found');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
        (error) => {
            console.error(error);
            res.statusMessage = 'Internal Server Error';
            res.status(500).send('Internal Server Error');
        }
    );

};

/**
 * Updating a venues details
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.updateDetails = async function (req, res) {
    // Getting data out of the request
    let venueBody = req.body;
    let id = req.params.id;

    //TODO return 400 when no changes given

    // Calling model method to update the venue in the database
    await Venues.updateVenue(venueBody, id, req.headers['x-authorization'])
        .then((result) => {
                // Sending the result
                res.statusMessage = 'OK';
                res.status(200);
                res.send("Venue updated");
            },
            (err) => {
                // Handling errors
                if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Getting all categories out of the database
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getCategories = async function (req, res) {
    // Calling model method to get the category data from teh database
    await Venues.getAllCategories()
        .then((categoryRows) => {
                // Forming the json response
                let  categories =[];
                if (categoryRows) {
                    for (let i = 0; i < categoryRows.length; i++) {
                        categories.push(
                            {
                                "categoryId" : categoryRows[i]['category_id'],
                                "categoryName" : categoryRows[i]['category_name'],
                                "categoryDescription" : categoryRows[i]['category_description']
                            }
                        )
                    }
                }
                // Sending the response
                res.statusMessage = 'OK';
                res.status(200);
                res.json(categories);
            },
            (err) => {
                // Handling errors
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Adding a photo to a venue
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.addPhoto = async function (req, res) {
    // Checking a file is present
    if (!req.file) {
        res.statusMessage = 'Bad Request';
        res.status(400).send('Bad Request');
    } else {
        // Calling model method to store the photo
        await Venues.addNewPhoto(req.params.id, req.headers['x-authorization'], req.file["originalname"], req.body["description"], req.body["makePrimary"], req.file['buffer'])
            .then((result) => {
                // Sending response
                res.status(201).send('Created');
            }, (err) => {
                // Handling errors
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else if (err.message === 'Bad Request' || err.code === 'ER_DUP_ENTRY') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }).catch(
                (error) => {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            );
    }
};

/**
 * Getting a photo for a venue
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getPhoto = async function (req, res) {
    // Getting the file name of the photo
    let filename = req.params.photoFileName;
    // Getting the content type of the request
    let contentType;
    if (filename.includes('jpg') || filename.includes('jpeg')) {
        contentType = "image/jpeg";
    } else if (filename.includes('png')) {
        contentType = "image/png";
    } else {
        // invalid content type so error response is sent
        res.statusMessage = 'Not Found';
        res.status(404).send('Photo: ' + filename + ' Not Found');
    }
    // Calling model method to ge the photo from local storage
    await Venues.getOnePhoto(req.params.id, filename)
        .then((image) => {
                // Sending the response
                res.statusMessage = 'OK';
                res.contentType(contentType);
                res.status(200);
                res.send(image);
            },
            (err) => {
                // Handling errors
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Photo: ' + req.params.photoFileName + ' Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Deleting a photo for a certain venue
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.deletePhoto = async function (req, res) {
    // Getting the filename of the photo
    let filename = req.params.photoFileName;
    // Calling model method to remove he photo
    await Venues.removePhoto(req.params.id, req.headers['x-authorization'], filename)
        .then((result) => {
            // Sending the response
            res.statusMessage = 'OK';
            res.status(200);
            res.send("Deleted");
        }, (err) => {
            // Handling errors
            if (err.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else if (err.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (err.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            } else if (err.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Photo: ' + filename + ' Not Found');
            } else {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Setting a venue photo to the venues primary photo
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.setPrimaryPhoto = async function (req, res) {
    // Getting the filename
    let filename = req.params.photoFileName;
    // Calling model method to set the photo as primary
    await Venues.makePhotoPrimary(req.params.id, req.headers['x-authorization'], filename)
        .then((result) => {
            // Sending the response
            res.statusMessage = 'OK';
            res.status(200);
            res.send("OK");
        }, (err) => {
            // Handling errors
            if (err.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else if (err.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (err.message === 'Not Found') {
                res.statusMessage = 'Not Found';
                res.status(404).send('Not Found');
            } else {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Getting the reviews for a venue
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getReview = async function (req, res) {
    // Calling model method to get the reviews
    await Venues.getReviews(req.params.id)
        .then((reviewRows) => {
            //TODO don't show venue details if not logged in

            // Forming the json response
            let reviews = [];
                if (reviewRows) {
                    for (let i = 0; i < reviewRows.length; i++) {
                        reviews.push(
                            {
                                "reviewAuthor" :
                                    {
                                        "userId" : reviewRows[i]['review_author_id'],
                                        "username" : reviewRows[i]['username']
                                    },
                                "reviewBody" : reviewRows[i]['review_body'],
                                "starRating" : reviewRows[i]['star_rating'],
                                "costRating" : reviewRows[i]['cost_rating'],
                                "timePosted" : reviewRows[i]['time_posted']
                            }
                        )
                    }
                }
            // Sending the response
            res.statusMessage = 'OK';
            res.status(200);
            res.send(reviews);
            },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Adding a review for the venue
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.addReview = async function (req, res) {
    // Calling model method to save the review to the database
    await Venues.saveReview(req.body.reviewBody, req.body.starRating, req.body.costRating, req.params.id, req.headers['x-authorization'])
        .then(() => {
                // Sending the response
                res.statusMessage = 'Created';
                res.status(201);
                res.send('Created');
            },
            (err) => {
                // Handling errors
                if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else {
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};