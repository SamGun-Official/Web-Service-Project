const {Model,DataTypes, Op} = require('sequelize');
const { getDB } = require("../config/sequelize");
const Accomodation = require('./accomodation');
const User = require('./user');
const H_trans = require('./h_trans');
const sequelize = getDB();


class PriceList extends Model {
   //association
  }

  PriceList.init({
    id:{
      type: DataTypes.INTEGER,
      allowNull:false,
      primaryKey:true,
      autoIncrement:true
    },
    feature_name:{
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey:false,
      autoIncrement:false
    },
    url_endpoint: {
      type: DataTypes.STRING,
      allowNull:false,
      primaryKey:false,
      autoIncrement:false,
    },
    price: {
      type:DataTypes.INTEGER,
      allowNull:false,
      primaryKey:false,
      autoIncrement:false
    },
    status:{
      type: DataTypes.INTEGER,
      allowNull:false,
      primaryKey:false,
      autoIncrement:false
    }
  }, {
    sequelize,
    modelName: 'Pricelist',
    tableName: 'pricelists',
    paranoid:false,
    underscored:false,
    timestamps:true
  });

module.exports = PriceList;

