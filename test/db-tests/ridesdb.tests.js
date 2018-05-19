const neo4j = require('../../src/extensions/neo4j.js');
const rideDB = require('../../src/db/rides.js');
const Ride = require('../../src/models/ride.model.js');
const GeoPoint = require('thumb-utilities').GeoPoint;
const TripBoundary = require('thumb-utilities').TripBoundary;
const uuid = require('uuid/v1');
const endOfLine = require('os').EOL;

const chai = require('chai');
const should = chai.should();

describe('Rides DB', () => {
  describe('getRideMatchesForTrip', () => {
    let travelDate = new Date("3/31/2018");
    let ride = new Ride({
      "userId": uuid(),
      "startLocation" : {latitude:60.2,longitude:15.2,address:"623 Main Street"},
      "endLocation" : {latitude:61.2,longitude:16.2,address:"623 Washington Street"},
      "travelDate": travelDate,
      "travelTime": [3, 7],
      "travelDescription" : 'Ride DB Tests'
    });
    let tripBoundaryDistance = 32186.9;
    let rideTripBoundary = TripBoundary.calculateBoundaryAroundPoints(ride.startLocation.coordinates, ride.endLocation.coordinates, tripBoundaryDistance);

    before(async() => {
      let query = 'CREATE (u:User{userId:{userId}}) RETURN u';
      await neo4j.execute(query,{userId: ride.userId});
      let rideResult = await rideDB.saveRide(ride);
      console.log(rideResult);
      ride.rideId = rideResult.rideId;
    });

    after(async() => {
      /*let query = 'MATCH (d:Ride{rideId:{rideId}})' + endOfLine;
      query += 'DETACH DELETE d';
      await neo4j.execute(query,{rideId: ride.rideId});
      query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
      await neo4j.execute(query,{userId: ride.userId});*/
    });
    it('should return created ride when provided tripboundary including ride', async() => {
      let results = await rideDB.getRideMatchesForTrip(rideTripBoundary, ride.travelDate);
      console.log(ride);
      console.log(results);
    });
  });
});
