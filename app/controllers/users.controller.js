const Users = require('../models/users.model');

/**
 * This method calls users.model.getOneUser to get the data for a given user profile,
 * the user data is then sent in teh response
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getUser = async function (req, res) {
    await Users.getOneUser(req.params.id)
        .then((userRow) => {
                // Below blocked used when not authenticated
            //TODO show email when authenticated and getting own user
                let toDisplay =
                    {
                        "username" : userRow['username'],
                        "givenName" : userRow['given_name'],
                        "familyName" : userRow['family_name']
                };

                res.statusMessage = 'OK';
                res.json(toDisplay);
            },
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('User: ' + req.params.id + ' Not Found');
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
 * This method calls users.model.getAllReviews to get data about all reviews related to
 * a certain user
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getReviews = async function (req, res) {
    await Users.getAllReviews(req.params.id)
        .then((reviewRows) => {

            let  reviews = [];
            if (reviewRows) {
                for (let i = 0; i < reviewRows.length; i++) {
                    reviews.push(
                        {
                            "reviewAuthor":
                                {
                                    "userID": reviewRows[i]['review_author_id'],
                                    "username": reviewRows[i]['username']
                                },
                            "reviewBody": reviewRows[i]['review_body'],
                            "starRating": reviewRows[i]['star_rating'],
                            "costRating": reviewRows[i]['cost_rating'],
                            "timePosted": reviewRows[i]['time_posted'],
                            "venue" :
                                {
                                    "venueId" : reviewRows['venue_id'],
                                    "venueName" : reviewRows['venue_name'],
                                    "categoryName" : reviewRows['category_name'],
                                    "city" : reviewRows['city'],
                                    "shortDescription" : reviewRows['short_description'],
                                    "primaryPhoto" : reviewRows['photo_filename']
                                }
                        }
                    )
                }
            }
            res.statusMessage = 'OK';
            res.send(reviews);
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

/**
 * This method calls users.model.addUser to add passed user data to the database
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.register = async function(req, res) {
    await Users.addUser(req.body.username, req.body.email, req.body.givenName, req.body.familyName, req.body.password)
        .then((result) => {
                let toDisplay = {
                    "userId": result['insertId']
                };

                res.statusMessage = 'Created';
                res.status(201).json(toDisplay);
            },
            (err) => {
                if (err.message === 'Bad Request' || err.code === 'ER_DUP_ENTRY') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
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

exports.updateDetails = async function(req, res) {
    //TODO
    res.statusMessage = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
};

/**
 * This method calls users.model.getOnePhoto to get the primary photo of a user
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getPhoto = async function(req, res) {
    await Users.getOnePhoto(req.params.id, req.params.photoFileName)
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

exports.setPhoto = async function(req, res) {
    //TODO
    res.statusMessage = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
};

exports.removePhoto = async function(req, res) {
    //TODO
    res.statusMessage = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
};

exports.logout = async function(req, res) {
    //TODO
    res.statusMessage = 'Internal Server Error';
    res.status(500).send('Internal Server Error');
};

/**
 * This method calls users.model.login to attempt to login into the application using
 * the passed credentials
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.login = async function(req, res) {
    await Users.login(req.body.username, req.body.email, req.body.password)
        .then((result) => {
                let toDisplay = {
                    "userId": result[0]['user_id'],
                    "token": result[0]['auth_token']
                };

                res.statusMessage = 'OK';
                res.json(toDisplay);
            }
        ).catch(
            (error) => {
                console.error(error);
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};