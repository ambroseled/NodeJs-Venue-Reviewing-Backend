const Venues = require('../models/venues.model');

exports.viewAll = async function (req, res) {
    try {
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


        let result = await Venues.getAllVenues(startIndex, count, city, q, categoryId, minStarRating, maxCostRating, adminId, sortBy, reverseSort, myLatitude, myLongitude);
        res.statusMessage = 'OK';
        res.status(200)
            .json(result)
            .send();
    } catch (err) {
        if (!err.hasBeenLogged) console.error(err);
        res.statusMessage = 'Bad Request';
        res.status(400)
            .send();
    }
};

exports.addNew = async function (req, res) {
    try {
        await Venues.addNewVenue();
        res.statusMessage = 'Created';
        res.status(201)
            .send();
    } catch (err) {
        // #TODO Create error responses - see spec
    }
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
    try {
        await Venues.updateVenue();
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses - see spec
    }
};

exports.getCategories = async function (req, res) {
    try {
        await Venues.getAllCategories(function(err, result) {
            if (err) {
                res.statusMessage = "Error retrieving categories";
                res.status(500).send();
            }
            res.statusMessage = 'OK';
            res.json(result);
        });
    } catch (err) {
        // #TODO Create error responses
    }
};

exports.addPhoto = async function (req, res) {
    try {
        await Venues.addNewPhoto();
        res.statusMessage = 'OK';
        res.status(201)
            .send();
    } catch (err) {
        // #TODO Create error responses
    }
};


exports.getPhoto = async function (req, res) {
    try {
        let id = req.query.id;
        let filename = req.query.photoFilename;

        let result = await Venues.getOnePhoto(id, filename);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        console.error(err);
        res.statusMessage = 'Not Found';
        res.status(404)
            .send();
    }
};


exports.deletePhoto = async function (req, res) {
    try {
        await Venues.removePhoto(req.params.id);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        console.error(err);
        // TODO error messages
    }
};


exports.setPrimaryPhoto = async function (req, res) {
    try {
        await Venues.makePhotoPrimary(req.params.id);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        console.error(err);
        // TODO error messages
    }
};


exports.getReview = async function (req, res) {
    try {
        let result = await Venues.getReview(req.params.id);
        res.statusMessage = 'OK';
        res.status(200)
            .json(result)
            .send();
    } catch (err) {
        console.error(err);
        // TODO error messages
    }
};


exports.addReview = async function (req, res) {
    try {
        await Venues.saveReview(req.query.id);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        console.error(err);
        // TODO error messages
    }
};



exports.getVenue = async function (venueID) {
    let getVenueSql = "SELECT venue_name, admin_id, username, Venue.category_id, category_name, category_description, " +
        "city, short_description, long_description, date_added, address, latitude, longitude FROM Venue " +
        "JOIN User ON Venue.admin_id = User.user_id JOIN VenueCategory ON Venue.category_id = VenueCategory.category_id " +
        "WHERE Venue.venue_id = ?";

    let getPhotosSql = "SELECT photo_filename, photo_description, is_primary FROM VenuePhoto WHERE venue_id = ?";
    try {
        let venue = await db.getPool().query(getVenueSql, venueID);
        if (venue.length === 0) {
            return Promise.reject(new Error('404'));
        } else {
            let venueAdmin = venue[0]['admin_id'];
            let photos = await db.getPool().query(getPhotosSql, venueAdmin);
            return Promise.resolve(venue[0], photos);
        }
    } catch (err) {
        return Promise.reject(err);
    }
};


