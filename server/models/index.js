import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import User from './User.js';
import Pin from './Pin.js';
import Webpage from './Webpage.js';
import Note from './Note.js';
import Image from './Image.js';
import Tags from './Tags.js';
import Item_Tags from './Item_Tags.js';

dotenv.config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const models = {
  User: User(sequelize),
  Pin: Pin(sequelize),
  Webpage: Webpage(sequelize),
  Note: Note(sequelize),
  Image: Image(sequelize),
  Tags: Tags(sequelize),
  Item_Tags: Item_Tags(sequelize),
};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

export { sequelize };
export default models;