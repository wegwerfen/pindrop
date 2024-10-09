import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Webpage extends Model {
    static associate(models) {
      Webpage.belongsTo(models.Pin, { foreignKey: 'pinId' });
    }
  }

  Webpage.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pinId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    textContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    cleanContent: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    length: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    summary: {  
      type: DataTypes.TEXT,
      allowNull: true,
    },
    byline: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    siteName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lang: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    published: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    screenshot: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    classification: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Rename 'notes' to 'comments'
    comments: {  
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Webpage',
    tableName: 'Webpages',
  });

  return Webpage;
};