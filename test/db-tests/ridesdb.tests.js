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
  describe('getRideMatchesForTripBoundary', () => {
    let travelDate = new Date("3/31/2018");
    let ride = new Ride({
      "userId": uuid(),
      "startLocation" : {latitude:60.2,longitude:15.2,address:"623 Main Street",city:"Bloomington"},
      "endLocation" : {latitude:61.2,longitude:16.2,address:"623 Washington Street",city:"Bloomington"},
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
      ride.rideId = rideResult.rideId;
    });

    after(async() => {
      let query = 'MATCH (d:Ride{rideId:{rideId}})' + endOfLine;
      query += 'DETACH DELETE d';
      await neo4j.execute(query,{rideId: ride.rideId});
      query = 'MATCH(u:User{userId:{userId}}) DETACH DELETE u';
      await neo4j.execute(query,{userId: ride.userId});
    });

    it('should return created ride when provided tripboundary including ride', async() => {
      let results = await rideDB.getRideMatchesForTripBoundary(rideTripBoundary, ride.travelDate);
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.not.be.null;
      chai.expect(rideResult.userId).to.be.equal(ride.userId);
    });

    it('should not return created ride when provided trip boundary that does not include ride', async() => {
      let startPoint = new GeoPoint(-10,-10);
      let endPoint = new GeoPoint(-11,-11);
      let tripBoundary = TripBoundary.calculateBoundaryAroundPoints(startPoint, endPoint, tripBoundaryDistance);
      let results = await rideDB.getRideMatchesForTripBoundary(tripBoundary, ride.travelDate);
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.be.undefined;
    });

    it('should not return created ride when provided different travel date', async() => {
      let results = await rideDB.getRideMatchesForTripBoundary(rideTripBoundary, new Date('4/30/2018'));
      let rideResult = results.find((r) => {
        return r.rideId === ride.rideId;
      });
      chai.expect(rideResult).to.be.undefined;
    });
  });
});
