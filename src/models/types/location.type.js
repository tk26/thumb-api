let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let thumbUtil = require('thumb-utilities');

function LocationSchema(key, options) {
  mongoose.SchemaType.call(this, key, options, 'LocationSchema');
}
LocationSchema.prototype = Object.create(mongoose.SchemaType.prototype);

// `cast()` takes a parameter that can be anything. You need to
// validate the provided `val` and throw a `CastError` if you
// can't convert it.
LocationSchema.prototype.cast = function(val) {
  if (!val.address) {
    throw new TypeError('Address is required for a location.');
  }

  if (!val.city) {
    throw new TypeError('City is required for a location.');
  }

  if (!val.latitude) {
    throw new TypeError('Latitude is required for a location.');
  }

  if (!val.longitude) {
    throw new TypeError('Longitude is required for a location.');
  }

  return new thumbUtil.Location(val.address, val.city, val.longitude, val.latitude);
};

mongoose.Schema.Types.LocationSchema = LocationSchema;
