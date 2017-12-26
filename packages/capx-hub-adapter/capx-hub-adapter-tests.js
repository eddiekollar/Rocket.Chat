// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by capx-hub-adapter.js.
import { name as packageName } from "meteor/capx-hub-adapter";

// Write your tests here!
// Here is an example.
Tinytest.add('capx-hub-adapter - example', function (test) {
  test.equal(packageName, "capx-hub-adapter");
});
