const Venues = require('../models/venues.model');

exports.viewAll = async function (req, res) {
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

    await Venues.getAllVenues(startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy,
        reverseSort, myLatitude, myLongitude)
        .then((venueRows) => {
                let  venues =[];
                if (venueRows) {
                    for (let i = 0; i < venueRows.length; i++) {
                        venues.push(
                            {
                                "venueID" : venueRows[i]['venue_id'],
                                "venueName" : venueRows[i]['venue_name'],
                                "categoryId" : venueRows[i]['category_id'],
                                "city" : venueRows[i]['city'],
                                "shortDescription" : venueRows[i]['short_description'],
                                "latitude" : venueRows[i]['latitude'],
                                "longitude" : venueRows[i]['longitude']
                            }
                        )
                    }
                }

                res.statusMessage = 'OK';
                res.json(venues);
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );

};

exports.addNew = async function (req, res) {
    let venueBody = req.body;
    await Venues.addNewVenue(venueBody)
        .then((result) => {
            let toDisplay = {
                "venueId" : result['insertId']
            };
            res.statusMessage = 'CREATED';
            res.status(201);
            res.json(toDisplay);
        },
            (err) => {
                if (err.message === 'No City') {
                    res.statusMessage = 'Bad Request';
                    res.status(404).send('No city provided');
                }
            },
            (err) => {
                if (err.message === 'Invalid Latitude') {
                    res.statusMessage = 'Bad Request';
                    res.status(404).send('Invalid Latitude');
                }
            },
            (err) => {
                if (err.message === 'Invalid Longitude') {
                    res.statusMessage = 'Bad Request';
                    res.status(404).send('Invalid Longitude');
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};

exports.getOne = async function (req, res) {
    await Venues.getVenue(req.params.id)
        .then((venueRow, photoRows) => {
           let  photos =[];
           if (photoRows) {
               for (let i = 0; i < photoRows.length; i++) {
                   photos.push(
                       {
                           "photoFilename" : photos[i]['photo_filename'],
                           "photoDescription" : photos[i]['photo_description'],
                           "isPrimary" : photos[i]['is_primary']
                       }
                   )
               }
           }

            let toDisplay = {
                "venueName" : venueRow['venue_name'],
                "admin" :
                    {
                        "userId" : venueRow['admin_id'],
                        "username" : venueRow['username']
                    },
                "category" :
                    {
                        "categoryId" : venueRow['category_id'],
                        "categoryName" : venueRow['category_name'],
                        "categoryDescription" : venueRow['category_descriptions']
                    },
                "city" : venueRow['city'],
                "shortDescription" : venueRow['short_description'],
                "longDescription" : venueRow['long_description'],
                "dateAdded" : venueRow['date_added'],
                "address" : venueRow['address'],
                "latitude" : venueRow['latitude'],
                "longitude" : venueRow['longitude'],
                "photos" : photos
            };

            res.statusMessage = 'OK';
            res.json(toDisplay);
        },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Venue: ' + req.params.id + ' Not Found');
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

exports.updateDetails = async function (req, res) {
    let venueBody = req.body;
    let id = req.params.id;
    await Venues.updateVenue(venueBody, id)
        .then((result) => {
                res.statusMessage = 'OK';
                res.json("OK");
            },
            (err) => {
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(404).send('Unauthorized');
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};

exports.getCategories = async function (req, res) {
    await Venues.getAllCategories()
        .then((categoryRows) => {
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

                res.statusMessage = 'OK';
                res.json(categories);
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.addPhoto = async function (req, res) {
    //TODO
};


exports.getPhoto = async function (req, res) {
    await Venues.getOnePhoto(req.params.id, req.params.photoFileName)
        .then((photoRow) => {
                res.statusMessage = 'OK';
                res.send(photoRow);
            },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Photo: ' + req.params.photoFileName + ' Not Found');
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


exports.deletePhoto = async function (req, res) {
    //TODO
};


exports.setPrimaryPhoto = async function (req, res) {
    //TODO
};


exports.getReview = async function (req, res) {
    await Venues.getOneReview(req.params.id)
        .then((reviewRow) => {
            let toDisplay =
                {
                    "reviewAuthor" :
                        {
                            "userID" : reviewRow['review_author_id'],
                            "username" : reviewRow['username']
                        },
                    "reviewBody" : reviewRow['review_body'],
                    "starRating" : reviewRow['star_rating'],
                    "costRating" : reviewRow['cost_rating'],
                    "timePosted" : reviewRow['time_posted']
                }
            res.statusMessage = 'OK';
            res.send(reviewRow);
            },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Review: ' + req.params.id + ' Not Found');
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


exports.addReview = async function (req, res) {
    //TODO
};

