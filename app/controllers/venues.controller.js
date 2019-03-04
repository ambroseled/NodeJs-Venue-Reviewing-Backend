const Venues = require('../models/venues.model');

exports.viewAll = async function (req, res) {
    try {
        await Venues.getAllVenues();
        res.statusMessage = 'OK';
        res.status(200)
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
    try {
        await Venues.getVenue(req.params.id);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses - 404 Not Found
    }
};

exports.updateDetails = async function (req, res) {
    try {
        await Venues.updateVenue(req.params.id);
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses - see spec
    }
};

exports.getCategories = async function (req, res) {
    try {
        await Venues.getAllCategories();
        res.statusMessage = 'OK';
        res.status(200)
            .send();
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
        await Venues.getOnePhoto(req.params.id);
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


