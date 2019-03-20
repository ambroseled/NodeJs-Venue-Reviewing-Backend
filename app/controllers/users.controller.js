const Users = require('../models/users.model');


/**
 * This method calls users.model.getOneUser to get the data for a given user profile,
 * the user data is then sent in teh response
 * @param req the request
 * @param res the response
 * @returns {Promise<void>}
 */
exports.getUser = async function (req, res) {
    await Users.getOneUser(req.params.id, req.headers['x-authorization'])
        .then((result) => {
            let toDisplay;
                if (result[1]) {
                    toDisplay =
                        {
                            "username" : result[0]['username'],
                            "email" : result[0]['email'],
                            "givenName" : result[0]['given_name'],
                            "familyName" : result[0]['family_name']
                        };
                } else {
                    toDisplay =
                        {
                            "username" : result[0]['username'],
                            "givenName" : result[0]['given_name'],
                            "familyName" : result[0]['family_name']
                        };
                }


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
    await Users.patchUser(req.body.givenName, req.body.familyName, req.body.password, req.headers['x-authorization'], req.params.id)
        .then((result) => {
                res.statusMessage = 'OK';
                res.status(200).send('User Updated');
            },
            (err) => {
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
    await Users.getOnePhoto(req.params.id, req.params.photoFileName)
        .then((photoRow) => {
                res.statusMessage = 'OK';
                res.send(photoRow);
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

exports.setPhoto = async function(req, res) {
    console.log(req.body);
    let contentType = req.headers['content-type'];
    console.log(contentType);
    await Users.savePhoto(req.params.id, req.headers['x-authorization'])
        .then((photoRow) => {
                res.statusMessage = 'OK';
                res.send(photoRow);
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
                } else if (err.message === 'Not Found') {
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

exports.removePhoto = async function(req, res) {
    await Users.removePrimaryPhoto(req.headers['x-authorization'], req.params.id)
        .then((result) => {
                res.statusMessage = 'OK';
                res.status(200).send();
            }, (err) => {
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
                }
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Internal Server Error';
                res.status(500).send('Internal Server Error');
            }
        );
};

exports.logout = async function(req, res) {
    await Users.logout(req.headers['x-authorization'])
        .then((result) => {
                res.statusMessage = 'OK';
                res.status(200).send();
            }, (err) => {
                if (err.message === 'Unauthorized') {
                    res.statusMessage = 'Unauthorized';
                    res.status(401).send('Unauthorized');
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
    await Users.login(req.body.username, req.body.email, req.body.password)
        .then((result) => {
                let toDisplay = {
                    "userId": result[0][0]['user_id'],
                    "token": result[1]
                };

                res.statusMessage = 'OK';
                res.json(toDisplay);
            }
        ).catch(
            (error) => {
                res.statusMessage = 'Bad Request';
                res.status(400).send('Bad Request');
            }
        );
};