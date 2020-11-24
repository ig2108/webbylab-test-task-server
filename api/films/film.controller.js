const Joi = require('joi');
const filmModel = require('./film.model');
const {
  Types: { ObjectId },
} = require('mongoose');

class FilmController {

  // CREATE

  async createFilm(req, res, next) {
    try {
      const film = await filmModel.create(req.body);

      return res.status(201).json(film);
    } catch (error) {
      next(error);
    }
  }

  // READ

  async getFilms(req, res, next) {
    try {
      const films = await filmModel.find();
      return res.status(200).json(films);
    } catch (error) {
      next(error);
    }
  }

  async getFilmById(req, res, next) {
    try {
      const filmId = req.params.id;

      const film = await filmModel.findById(filmId);
      if (!film) {
        return res.status(404).send();
      }

      return res.status(200).json(film);
    } catch (error) {
      next(error);
    }
  }

  // DELETE

  async deleteFilmById(req, res, next) {
    try {
      const filmId = req.params.id;

      const deletedFilm = await filmModel.findByIdAndDelete(filmId);
      if (!deletedFilm) {
        return res.status(404).send();
      }

      const films = await filmModel.find();
      return res.status(202).send(films);
    } catch (error) {
      next(error);
    }
  }

  // VALIDATION FUNCTIONS

  validateCreateFilm(req, res, next) {
    const validationRules = Joi.object({
      title: Joi.string().required(),
      releaseYear: Joi.number().required(),
      format: Joi.string().required(),
      stars: Joi.array().required(),
    });
    const validationResult = Joi.validate(req.body, validationRules);
    if (validationResult.error) {
      return res.status(400).send(validationResult.error);
    }

    next();
  }

  validateId(req, res, next) {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send();
    }

    next();
  }
}

module.exports = new FilmController();
