import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Pin extends Model {
    static associate(models) {
      Pin.belongsTo(models.User, { foreignKey: 'userId' });
      Pin.hasOne(models.Webpage, { foreignKey: 'pinId' });
      Pin.hasMany(models.Note, { foreignKey: 'pinId' });
      Pin.hasMany(models.Image, { foreignKey: 'pinId' });
      Pin.belongsToMany(models.Tags, { through: 'Item_Tags', foreignKey: 'pinId' });
    }
  }

  Pin.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    thumbnail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Pin',
    tableName: 'Pins',
  });

  return Pin;
};