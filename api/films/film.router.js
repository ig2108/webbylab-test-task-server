const { Router } = require('express');
const filmController = require('./film.controller');

const filmRouter = Router();

filmRouter.post(
  '/',
  filmController.validateCreateFilm.bind(filmController),
  filmController.createFilm,
);

filmRouter.post(
  '/upload',
  filmController.uploadFilms.bind(filmController),
);

filmRouter.get('/', filmController.getFilms);

filmRouter.get(
  '/:id',
  filmController.validateId,
  filmController.getFilmById,
);

filmRouter.delete(
  '/:id',
  filmController.validateId,
  filmController.deleteFilmById,
);

module.exports = filmRouter;
