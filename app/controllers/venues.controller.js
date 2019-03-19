const Venues = require('../models/venues.model');
const fs = require('fs');


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
        .then((rows) => {
                let venueRows = rows[0];
                let photoRows = rows[1];
                let  venues =[];
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

                res.statusMessage = 'OK';
                res.status(200);
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

    await Venues.addNewVenue(venueBody, req.headers['x-authorization'])
        .then((result) => {
            let toDisplay = {
                "venueId" : result['insertId']
            };
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
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.getOne = async function (req, res) {
    await Venues.getVenue(req.params.id)
        .then((data) => {
           let  photos =[];
           if (data[1]) {
               for (let i = 0; i < data[1].length; i++) {
                   photos.push(
                       {
                           "photoFilename" : data[1][i]['photo_filename'],
                           "photoDescription" : data[1][i]['photo_description'],
                           "isPrimary" : data[1][i]['is_primary']
                       }
                   )
               }
           }

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

            res.statusMessage = 'OK';
            res.status(200);
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

    //TODO return 400 when no changes given

    await Venues.updateVenue(venueBody, id, req.headers['x-authorization'])
        .then((result) => {
                res.statusMessage = 'OK';
                res.status(200);
                res.send("Venue updated");
            },
            (err) => {
                if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                }else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                }
            }).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
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
                res.status(200);
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

    if (!req.file) {
        res.statusMessage = 'Bad Request';
        res.status(400).send('Bad Request');
    } else {
        await Venues.addNewPhoto(req.params.id, req.headers['x-authorization'], req.file["originalname"], req.body["description"], req.body["makePrimary"])
            .then((result) => {

                let filePath = "images/" + req.file["originalname"];// + "." + req.file["mimetype"].split("/")[1];

                fs.writeFile(filePath, req.file['buffer'], function(err) {
                    if (err) throw err;
                });

                res.status(201).send('OK');

            }, (err) => {
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
                    res.status(404).send('Not Found');
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


exports.getPhoto = async function (req, res) {
    let contentType = req.get("content-type");

    await Venues.getOnePhoto(req.params.id, req.body.photo, req.body.description, req.body.makePrimary)
        .then((photoRow) => {
                res.statusMessage = 'OK';//TODO set content type
                res.contentType(contentType);
                res.status(200);
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
    await Venues.removePhoto(req.params.id, req.headers['x-authorization'])
        .then((result) => {

        }, (err) => {
            if (err.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else if (err.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (err.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(403).send('Bad Request');
            }
        });
};


exports.setPrimaryPhoto = async function (req, res) {
    await Venues.makePhotoPrimary(req.params.id, req.headers['x-authorization'])
        .then((result) => {

        }, (err) => {
            if (err.message === 'Unauthorized') {
                res.statusMessage = 'Unauthorized';
                res.status(401).send('Unauthorized');
            } else if (err.message === 'Forbidden') {
                res.statusMessage = 'Forbidden';
                res.status(403).send('Forbidden');
            } else if (err.message === 'Bad Request') {
                res.statusMessage = 'Bad Request';
                res.status(403).send('Bad Request');
            }
        });
};


exports.getReview = async function (req, res) {
    await Venues.getReviews(req.params.id)
        .then((reviewRows) => {
            //TODO don't show venue details if not logged in
            let reviews = [];
                if (reviewRows) {
                    for (let i = 0; i < reviewRows.length; i++) {
                        reviews.push(
                            {
                                "reviewAuthor" :
                                    {
                                        "userID" : reviewRows[i]['review_author_id'],
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


            res.statusMessage = 'OK';
            res.status(200);
            res.send(reviews);
            },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
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
    await Venues.saveReview(req.body.reviewBody, req.body.starRating, req.body.costRating, req.params.id, req.headers['x-authorization'])
        .then(() => {
                res.statusMessage = 'Created';
                res.status(201);
                res.send('Created');
            },
            (err) => {
                if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
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

