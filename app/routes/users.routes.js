const users = require('../controllers/users.controller');

module.exports = function (app) {
    app.route(app.rootUrl + '/users')
        .post(users.register);

    app.route(app.rootUrl + '/users/:id')
        .get(users.getUser)
        .patch(users.updateDetails);

    app.route(app.rootUrl + '/users/:id/reviews')
        .get(users.getReviews);

    app.route(app.rootUrl + '/users/:id/photos')
        .get(users.getPhoto)
        .put(users.setPhoto)
        .delete(users.removePhoto);

    app.route(app.rootUrl + '/users/login')
        .post(users.login);

    app.route(app.rootUrl + '/users/logout')
        .post(users.logout);

};