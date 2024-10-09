import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Image extends Model {
    static associate(models) {
      Image.belongsTo(models.Pin, { foreignKey: 'pinId' });
    }
  }

  Image.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    pinId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    summary: {  
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Add 'comments' field
    comments: {  
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Image',
    tableName: 'Images',
  });

  return Image;
};