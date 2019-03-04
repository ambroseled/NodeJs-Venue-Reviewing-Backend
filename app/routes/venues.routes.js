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

    app.route(app.rootUrl + '/venues/:id/photos')
        .post(venues.addPhoto);

    app.route(app.rootUrl + '/venues/:id/photos/:photoFileName')
        .get(venues.getPhoto)
        .delete(venues.deletePhoto);

    app.route(app.rootUrl + '/venues/:id/photos/:photoFileName/setPrimary')
        .post(venues.setPrimaryPhoto);
};