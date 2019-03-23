const Users = require('../models/users.model');
const fileType = require('file-type');

/**
 * This method calls users.model.getOneUser to get the data for a given user profile,
 * the user data is then sent in teh response
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getUser = async function (req, res) {
    // Calling model method to get user data
    await Users.getOneUser(req.params.id, req.headers['x-authorization'])
        .then((result) => {
                let toDisplay;
                // Forming the json response
                if (result[1]) {
                    // Json response for an authenticated user
                    toDisplay =
                        {
                            "username" : result[0]['username'],
                            "email" : result[0]['email'],
                            "givenName" : result[0]['given_name'],
                            "familyName" : result[0]['family_name']
                        };
                } else {
                    // Json response for a non authenticated user
                    toDisplay =
                        {
                            "username" : result[0]['username'],
                            "givenName" : result[0]['given_name'],
                            "familyName" : result[0]['family_name']
                        };
                }
                // Sending the response
                res.statusMessage = 'OK';
                res.json(toDisplay);
            },
            (err) => {
            // Catching and responding to errors
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('User: ' + req.params.id + ' Not Found');
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
 * This method calls users.model.getAllReviews to get data about all reviews related to
 * a certain user
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getReviews = async function (req, res) {
    // Calling model method to get review data
    await Users.getAllReviews(req.params.id)
        .then((reviewRows) => {
            let  reviews = [];
            if (reviewRows) {
                // Looping over returned result and forming response
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
            // Sending the response
            res.statusMessage = 'OK';
            res.send(reviews);
            },
                // Catching and responding to errors
            (err) => {
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Review: ' + req.params.id + ' Not Found');
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
 * This method calls users.model.addUser to add passed user data to the database
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.register = async function(req, res) {
    // Calling model method to store user data in database
    await Users.addUser(req.body.username, req.body.email, req.body.givenName, req.body.familyName, req.body.password)
        .then((result) => {
            // Forming response
                let toDisplay = {
                    "userId": result['insertId']
                };
                // Sending response
                res.statusMessage = 'Created';
                res.status(201).json(toDisplay);
            },
            // Handling errors
            (err) => {
                if (err.message === 'Bad Request' || err.code === 'ER_DUP_ENTRY') {
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
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Updating a users details in the database, through the users.model.patchUser
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.updateDetails = async function(req, res) {
    // Calling model method to perform update on user in database
    await Users.patchUser(req.body.givenName, req.body.familyName, req.body.password, req.headers['x-authorization'], req.params.id)
        .then((result) => {
            // Sending result
                res.statusMessage = 'OK';
                res.status(200).send('User Updated');
            },
            (err) => {
                // Handling errors
                if (err.message === 'Bad Request' || err.code === 'ER_DUP_ENTRY') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                } else if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
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
 * This method calls users.model.getOnePhoto to get the primary photo of a user
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getPhoto = async function(req, res) {
    // Calling model to get a user photo
    await Users.getOnePhoto(req.params.id)
        .then((photo) => {
                // Sending response
                res.statusMessage = 'OK';
                res.contentType(fileType(photo)['ext']);
                res.status(200).send(photo);
            },
            (err) => {
                // Handling errors
                if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
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
 * Sets a passed photo to the users primary photo
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.setPhoto = async function(req, res) {
    // Getting the image buffer out of the request
    let buffer = Buffer.from(req.body);
    // Calling model method to store the image and set it to the users primary photo
    await Users.savePhoto(req.params.id, req.headers['x-authorization'], buffer)
        .then((code) => {
                // Sending response
                res.sendStatus(code);
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
                } else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
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
 * Removing a users primary photo from local storage and the database
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.removePhoto = async function(req, res) {
    // Calling model method to remove the photo
    await Users.removePrimaryPhoto(req.headers['x-authorization'], req.params.id)
        .then(() => {
            // Sending response
                res.statusMessage = 'OK';
                res.status(200).send('OK');
            }, (err) => {
                // Handling errors
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                }  else if (err.message === 'Forbidden') {
                    res.statusMessage = 'Forbidden';
                    res.status(403).send('Forbidden');
                }  else if (err.message === 'Bad Request') {
                    res.statusMessage = 'Bad Request';
                    res.status(400).send('Bad Request');
                }   else if (err.message === 'Not Found') {
                    res.statusMessage = 'Not Found';
                    res.status(404).send('Not Found');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * Logging the user out of the system
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.logout = async function(req, res) {
    // Calling model method to log the user out
    await Users.logout(req.headers['x-authorization'])
        .then((result) => {
                // Sending response
                res.statusMessage = 'OK';
                res.status(200).send();
            }, (err) => {
                // Handling errors
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
                } else {
                    console.error(error);
                    res.statusMessage = 'Internal Server Error';
                    res.status(500).send('Internal Server Error');
                }
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

/**
 * This method calls users.model.login to attempt to login into the application using
 * the passed credentials
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.login = async function(req, res) {
    // Calling model method to log the user in
    await Users.login(req.body.username, req.body.email, req.body.password)
        .then((result) => {
                // Forming json response
                let toDisplay = {
                    "userId": result[0][0]['user_id'],
                    "token": result[1]
                };
                // Sending the response
                res.statusMessage = 'OK';
                res.json(toDisplay);
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
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};