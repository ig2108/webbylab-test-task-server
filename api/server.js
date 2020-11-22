const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const filmRouter = require('./films/film.router');

require('dotenv').config();

// const PORT = process.env.PORT || 3096;

module.exports = class FilmServer {
  constructor() {
    this.server = null;
  }

  async start() {
    this.initServer();
    this.initMiddlewares();
    this.initRoutes();
    await this.initDataBase();
    this.startListening();
  }

  initServer() {
    this.server = express();
  }

  initMiddlewares() {
    this.server.use(cors({ origin: '*' }));
    this.server.use(express.json());
    this.server.use(express.urlencoded({ extended: true }));
    this.server.use(morgan('combined'));
  }

  initRoutes() {
    // this.server.use('/', filmRouter)
    this.server.use('/films', filmRouter);
  }

  async initDataBase() {
    try {
      await mongoose.connect(process.env.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
      });
      console.log('Database connection successful!');
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  }

  startListening() {
    const PORT = process.env.PORT || 3096;

    this.server.listen(PORT, () => {
      console.log('Server started listening on port', PORT);
    });
  }
};
