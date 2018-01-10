# thumb-api
Thumb API powers Thumb Web and Mobile Apps

## Getting Started

### Pre-requisites 
Expects a Mongo daemon running locally at default Port (27017).

### Tech
MongoDB, Node.js (with Express)

### Dev
Connects to MongoDB 'thumb'.
> NODE_ENV=dev npm start

### Test 
Connects to MongoDB 'thumb-test'.
> npm test

## Contributing

### Branching

#### master
Contains all the stable, released code.

#### develop
Development mainstream.
Inherited from latest master.
Should be rebased from master each time master is changed.

#### Conventions
Branch names should be sensible, concise and self-explanatory.
Should begin with the following texts:
New Features- "feature-"
Bugs- "bug-"
Improvements- "improvement-"

### Pull Request Process
Should create a pull request against "develop" branch.
Commits should be sensible, concise and self-explanatory.
Should pass all the existing tests.
New features should be shipped along with the tests.
Should include updates to README or any other documentation files if needed.

## License
See LICENSE.md for details.