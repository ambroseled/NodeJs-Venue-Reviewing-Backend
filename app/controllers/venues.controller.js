const Venue = require('../models/venues.model');

exports.viewAll = async function (req, res) {
    try {
        // await #TODO Add func here
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
        // await #TODO Add func here
        res.statusMessage = 'Created';
        res.status(201)
            .send();
    } catch (err) {
        // #TODO Create error responses - see spec
    }
};

exports.getOne = async function (req, res) {
    try {
        // await #TODO Add func here
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses - 404 Not Found
    }
};

exports.updateDetails = async function (req, res) {
    try {
        // await #TODO Add func here
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses - see spec
    }
};

exports.getCategories = async function (req, res) {
    try {
        // await #TODO Add func here
        res.statusMessage = 'OK';
        res.status(200)
            .send();
    } catch (err) {
        // #TODO Create error responses
    }
};