const Joi = require('joi');
const filmModel = require('./film.model');
const {
  Types: { ObjectId },
} = require('mongoose');

const fs = require('fs');

class FilmController {

  validationFilmFormTemplate = Joi.object({
    title: Joi.string().required(),
    releaseYear: Joi.number().integer().min(1850).max(2020).required(),
    format: Joi.string().required(),
    stars: Joi.array().unique().required(),
  });

  // CREATE

  async createFilm(req, res, next) {
    try {
      const film = await filmModel.create(req.body);
      return res.status(201).json(film);
    } catch (error) {
      next(error);
    };
  };

  async setUploadFilmsFromFileToReqBody(req, res, next) {
    try {
      let message;
      const tmpPath = "./tmp/filmsToAdd.txt";
      // FOR PRODUCTION VERSION !!!
      const uploadFile = req.files.file.data;

      // FOR DEVELOPMENT VERSION !!!
      // const uploadFile = req.files.data.data;

      fs.writeFileSync(tmpPath, uploadFile);
      const txtFilmFile = fs.readFileSync(tmpPath, {encoding:'utf8'});
      if (txtFilmFile.length === 0) {
        message = 'File is empty! Please load file with data';
        return res.status(400).send(message);
      };

      // make an array, every element of array is the separate film
      const filmsArrayFromTxt = txtFilmFile.split("\n\n");

      const filmsToAdd = this.transformFileToArrayOfObjects(filmsArrayFromTxt);

      req.body = filmsToAdd;

      next();

    } catch (error) {
      next(error);
    };
  };

  async createUploadsFilms (req, res, next) {
    try {
      for (let film of req.body) {
        await filmModel.create(film);
      };
      return res.status(200).send('Films successfully added!');
    } catch (error) {
      next(error);
    };
  };

  // READ

  async getFilms(req, res, next) {
    try {
      const films = await filmModel.find();
      return res.status(200).json(films);
    } catch (error) {
      next(error);
    };
  };

  async getFilmById(req, res, next) {
    try {
      const filmId = req.params.id;

      const film = await filmModel.findById(filmId);
      if (!film) {
        return res.status(404).send();
      };

      return res.status(200).json(film);
    } catch (error) {
      next(error);
    };
  };

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
    };
  };

  // VALIDATION FUNCTIONS

  async validateCreateFilm (req, res, next) {
    const validationRules = this.validationFilmFormTemplate;
    const validationResult = Joi.validate(req.body, validationRules);

    if (validationResult.error) {
      return res.status(400).send(validationResult.error);
    };

    const isFilmDuplicated = await this.validateOnDuplicates(req.body);

    if (isFilmDuplicated) {
      return res.status(400).send('DB already have similar film!');
    };

    next();
  };

  async validateUploadFilm (req, res, next) {
    const validationRules = Joi.array().items(this.validationFilmFormTemplate);
    const validationResult = Joi.validate(req.body, validationRules);

    if (validationResult.error) {
      return res.status(400).send(validationResult.error);
    };

    for (let film of req.body) {
      const isFilmDuplicated = await this.validateOnDuplicates(film);

      if (isFilmDuplicated) {
        return res.status(400).send('DB already have similar film!');
      };
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

  async validateOnDuplicates(film) {
    const {title, stars, releaseYear} = film;
    const findByTitleFilms = await filmModel.find({title: title});
    let isFilmDuplicated;

    if (findByTitleFilms.length > 0) {
      isFilmDuplicated = this.isFilmDuplicateByYearOrActors(findByTitleFilms, releaseYear, stars);
    };

    return isFilmDuplicated;
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

  transformFileToArrayOfObjects = (file) => {
    let jsonString = '[{';
    file.map(el => {
      const objEnteries = el.split("\n");
      const params = objEnteries.join(",").replace(/:\s+/g, ':');
      const items = params.split(',');
      jsonString += this.setStringToJsonType(items);
    });
    jsonString = this.changeLastNumberOfValuesInString(jsonString, 2,']');

    const arrayOfObjects = JSON.parse(jsonString);
    return arrayOfObjects;
  };

  setStringToJsonType (items) {
    let stringToJson = '';
    for (let i = 0; i < items.length; i++) {
      const currentItem = items[i].split(':');
      let keyValue;
      if (currentItem[0] !== '' ) {
        keyValue = this.makeInStringFirstLetterSmall(currentItem[0]).replace(/\s+/g, '');
      };

      // if there are empty string, it will be miss;
      if (currentItem[0] === '') {
        console.log("empty string is missed");
      }

      // Check, if there value of key is an array
      else if(keyValue === "stars") {
        stringToJson += '"' + keyValue + '":' + '["' + currentItem[1] + '",';
      }

      // identify is the element belong to array and add in array
      else if (currentItem.length === 1) {
        stringToJson += '"' + currentItem[0].trim() + '",';
      }

      // default set key:value
      else {
        stringToJson += '"' + keyValue + '":"' + currentItem[1] + '",';
      };
    };

    stringToJson = this.changeLastNumberOfValuesInString(stringToJson, 1,']},{');
    return stringToJson;
  };

  makeInStringFirstLetterSmall (string) {
    return string[0].toLowerCase() + string.substring(1);
  };

  changeLastNumberOfValuesInString (string, numberOfValues, newValue) {
    let newString = string.substring(0, string.length - numberOfValues);
    return newString += newValue;
  };
};

module.exports = new FilmController();
