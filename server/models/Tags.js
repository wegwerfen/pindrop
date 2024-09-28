import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Tags extends Model {
    static associate(models) {
      Tags.belongsToMany(models.Pin, { through: 'Item_Tags', foreignKey: 'tagId' });
    }
  }

  Tags.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  }, {
    sequelize,
    modelName: 'Tags',
    tableName: 'Tags',
  });

  return Tags;
};
