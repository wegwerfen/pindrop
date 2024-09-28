import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Item_Tags extends Model {
    static associate(models) {
      // No need to define associations here as they are defined in Pin and Tags models
    }
  }

  Item_Tags.init({
    pinId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Pins',
        key: 'id'
      }
    },
    tagId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      references: {
        model: 'Tags',
        key: 'id'
      }
    },
  }, {
    sequelize,
    modelName: 'Item_Tags',
    tableName: 'Item_Tags',
    timestamps: false,
  });

  return Item_Tags;
};
