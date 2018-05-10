let mongoose = require('mongoose');
let Schema = mongoose.Schema;
let thumbUtil = require('thumb-utilities');

function TripBoundarySchema(key, options) {
  mongoose.SchemaType.call(this, key, options, 'TripBoundarySchema');
}
TripBoundarySchema.prototype = Object.create(mongoose.SchemaType.prototype);

// `cast()` takes a parameter that can be anything. You need to
// validate the provided `val` and throw a `CastError` if you
// can't convert it.
TripBoundarySchema.prototype.cast = function(val) {
  return new thumbUtil.TripBoundary(val.startOffset1, val.startOffset2, val.endOffset1, val.endOffset2);
};

mongoose.Schema.Types.TripBoundarySchema = TripBoundarySchema;
