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

  async validateCreateFilm (req, res, next) {
    const validationRules = Joi.object({
      title: Joi.string().required(),
      releaseYear: Joi.number().integer().min(1850).max(2020).required(),
      format: Joi.string().required(),
      stars: Joi.array().unique().required(),
    });
    const validationResult = Joi.validate(req.body, validationRules);

    if (validationResult.error) {
      return res.status(400).send(validationResult.error);
    };

    const {title, stars, releaseYear} = req.body;
    const findByTitleFilms = await filmModel.find({title: title});
    let isFilmDuplicated;

    if (findByTitleFilms.length > 0) {
      isFilmDuplicated = this.isFilmDuplicateByYearOrActors(findByTitleFilms, releaseYear, stars);
    };

    if (isFilmDuplicated) {
      return res.status(400).send('DB already have similar film!');
    };

    next();
  };

  validateId(req, res, next) {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).send();
    };

    next();
  };

  // HELP FUNCTIONS

  findFilmByReleaseYear (year, filmsArray) {
    return filmsArray.find(film => film.releaseYear === year);
  };

  findFilmsByActors (actorsArray, filmsArray) {
    let matchedFilms = [];
    actorsArray.find(actor => {
      if (matchedFilms.length > 0) {
        return;
      };

      filmsArray.find(film => {
        if (film.stars.includes(actor)) {
          matchedFilms.push(film);
        };
      });
    });
    return matchedFilms;
  };

  isFilmDuplicateByYearOrActors (filmsArray, year, actorsArray) {
    const matchedFilmObjByReleaseYear = this.findFilmByReleaseYear(year, filmsArray);
    const matchedFilmsByActors = this.findFilmsByActors(actorsArray, filmsArray);

    if ( matchedFilmObjByReleaseYear || matchedFilmsByActors.length > 0) {
      return true;
    };
    return false;

  };

};

module.exports = new FilmController();
