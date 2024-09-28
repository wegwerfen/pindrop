import { DataTypes, Model } from 'sequelize';

export default (sequelize) => {
  class Note extends Model {
    static associate(models) {
      Note.belongsTo(models.Pin, { foreignKey: 'pinId' });
    }
  }

  Note.init({
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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Note',
    tableName: 'Notes',
  });

  return Note;
};