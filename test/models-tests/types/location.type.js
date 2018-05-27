const chai = require('chai');
const should = chai.should();
const mongoose = require('mongoose');
const locationTypes = require('../../../src/models/types/location.type.js');
const LocationSchema = mongoose.Schema.Types.LocationSchema;

describe.only('Location Schema', () => {
  describe('constructor', () => {
    const address = '1275 E. Tenth Street Bloomington, IN 47405';
    const city = 'Bloomington';
    const latitude = 39.172450;
    const longitude = -86.519487;

    it('should throw exception when no address is provided', () => {
      const loc = {
        city: city,
        latitude: latitude,
        longitude: longitude
      };

      let l = function() {new LocationSchema(loc);}
      chai.expect(l).to.throw(TypeError);
    });

    it('should throw exception when no city is provided', () => {
      const loc = {
        address: address,
        latitude: latitude,
        longitude: longitude
      };

      let l = function() {new LocationSchema(loc);}
      chai.expect(l).to.throw(TypeError);
    });

    it('should throw exception when no latitude is provided', () => {
      const loc = {
        address: address,
        city: city,
        longitude: longitude
      };

      let l = function() {new LocationSchema(loc);}
      chai.expect(l).to.throw(TypeError);
    });

    it('should throw exception when no longitude is provided', () => {
      const loc = {
        address: address,
        city: city,
        latitude: latitude
      };

      let l = function() {new LocationSchema(loc);}
      chai.expect(l).to.throw(TypeError);
    });

    it('should construct location object when provided valid object', () => {
      const loc = {
        address: address,
        city: city,
        latitude: latitude,
        longitude: longitude
      };

      let l = new LocationSchema(loc);
      l.path.address.should.equal(address);
      l.path.city.should.equal(city);
      l.path.coordinates.latitude.should.equal(latitude);
      l.path.coordinates.longitude.should.equal(longitude);
    });
  });
});
