const venues = require('../controllers/venues.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/venues')
        .get(venues.viewAll)
        .post(venues.addNew);

    app.route(app.rootUrl + '/venues/:id')
        .get(venues.getOne)
        .patch(venues.updateDetails);

    app.route(app.rootUrl + '/categories')
        .get(venues.getCategories);
};