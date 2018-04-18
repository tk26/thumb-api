let mongoose = require('mongoose');
let Schema = mongoose.Schema;

function Location(key, options) {
  mongoose.SchemaType.call(this, key, options, 'Location');
}
Location.prototype = Object.create(mongoose.SchemaType.prototype);

// `cast()` takes a parameter that can be anything. You need to
// validate the provided `val` and throw a `CastError` if you
// can't convert it.
Location.prototype.cast = function(val) {
  if (!val.address) {
    throw new Error('Location: address is required for a location.');
  }

  if (!val.latitude) {
    throw new Error('Location: latitude is required for a location.');
  }

  if (!val.longitude) {
    throw new Error('Location: longitude is required for a location.');
  }
  return {
    address: val.address,
    latitude: val.latitude,
    longitude: val.longitude
  }
};

mongoose.Schema.Types.Location = Location;
