/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require("express");

var googlemaps_api = MAPS_API_KEY;

var agent = require("bluemix-autoscaling-agent");

//load Cloudant
var Cloudant = require("cloudant");

var Holidays = require("date-holidays");
var hd = new Holidays("CA");

var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

var https = require("https");

var watson = require("watson-developer-cloud");

var clinic_key = GENERATED_KEY_CLINICS;
var clinic_pw = GENERATED_PASSWORD_CLINICS;

var session_key = GENERATED_KEY_SESSION;
var session_pw = GENERATED_PASSWORD_SESSION;

//Initializes tradeoff analytics tool
var tradeoff_analytics = watson.tradeoff_analytics({
	username: "b96aa311-d0ef-427b-baa8-cabaa7d5b196",
	password: "mtwa8nXbLXR4",
	version: "v1"
});

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require("cfenv");

// create a new express server
var app = express();

// serve the files out of ./public as our main files
app.use(express.static(__dirname + "/public"));

var me = "nbrons";

// Initialize the library with my account. 
var cloudant = Cloudant({
	account: me,
	key: session_key,
	password: session_pw
});

var sessions = cloudant.db.use("sessions");


// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

//var appEnv = cfenv.getAppEnv();
var host = process.env.VCAP_APP_HOST || "localhost";
var port = process.env.VCAP_APP_PORT || 3001;

var server = app.listen(port, host, function() {
	console.log("server starting on " + host + ":" + port);
});



var bodyParser = require("body-parser")
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));


var authorization = require("auth-header");

//********CHECKIN*********//


var checkin = function(clinic, uuid, res) {
	var clinic_id = clinic.id;

	var start = Date.now();

	sessions.get(uuid, function(err, body) {
		if (!err) {
			var latestRev = body._rev;

			if (body !== null && body.end !== 0) {

				sessions.insert({
					old_id: uuid,
					clinic_id: clinic_id,
					start: start,
					end: 0
				}, function(err, body, header) {
					if (err) {
						return console.log(err.message);
					}
					console.log("duplicated");
				});

				sessions.destroy(body._id, latestRev, function(err, body, header) {
					if (!err) {
						console.log("Successfully deleted doc");


						sessions.insert({
							_id: uuid,
							clinic_id: clinic_id,
							start: start,
							end: 0
						}, function(err, body, header) {
							if (err) {
								return console.log(err.message);
							}


							console.log("inserted");
							//console.log(body);

							res.send(body);
						});

					}
				});
			} else {
				res.send("{\"message\":\"UUID " + uuid + " already checked in.\"}");
			}

		} else {
			sessions.insert({
				_id: uuid,
				clinic_id: clinic_id,
				start: start,
				end: 0
			}, function(err, body, header) {
				if (err) {
					return console.log(err.message);
				}


				console.log("inserted");
				//console.log(body);

				res.send(body);
			});
		}
	});




	//res.send(clinic);
};

app.get("/checkin", function(req, res) {
	var clinic_id = req.query.clinic_id;
	var uuid = req.query.uuid;

	checkin(clinic_id, uuid, res);

});

app.post("/checkin", function(req, res) {

	// Something messed up. 
	function fail() {
		res.set("WWW-Authenticate", authorization.format("Basic"));
		res.status(401).send();
	}

	// Get authorization header. 
	var auth = authorization.parse(req.get("authorization"));

	// No basic authentication provided. 
	if (auth.scheme !== "Basic") {
		return fail();
	}

	// Get the basic auth component. 
	var splits = Buffer(auth.token, "base64").toString().split(":", 2);
	var pw = splits[1];
	var un = splits[0];

	// Verify authentication. 
	if (un !== "admin" || pw !== "GWdkkjnj,VVk") {
		return fail();
	}

	var clinic_id = req.body.clinic_id;
	var uuid = req.body.uuid;

	checkin(clinic_id, uuid, res);

});

//********IS_LOCATED*********//


var is_located = function(lat, lon, uuid, callback, res) {
	var options = {
		host: "nbrons.cloudant.com",
		path: "/clinics_geo_details/_design/geoix/_geo/geoix?lat=" + lat + "&lon=" + lon + "&radius=10&include_docs=true",
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Basic "+CLOUDANT_API_KEY
		}
	};


	var reqq = https.get(options, function(ress) {
		console.log("STATUS: " + ress.statusCode);
		console.log("HEADERS: " + JSON.stringify(ress.headers));

		// Buffer the body entirely for processing as a whole.
		var bodyChunks = [];
		ress.on("data", function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
		}).on("end", function() {
			var body = Buffer.concat(bodyChunks);
			console.log("BODY: " + body);
			var idclinic = JSON.parse(body).rows;
			// res.send(JSON.stringify(JSON.parse(body).rows));
			if (idclinic.length > 0) {
				callback(idclinic[0], uuid, res);
				// res.send(body.rows);
			} else {
				res.send("{\"located\":\"false\"}");
			}

		});
	});

	reqq.on("error", function(e) {
		console.log("ERROR: " + e.message);
	});

};


app.get("/is_located", function(req, res) {
	var lat = req.query.lat;
	var lon = req.query.lon;
	var uuid = req.query.uuid;
	if (typeof uuid !== "undefined" && uuid !== null && req.query.uuid) {
		is_located(lat, lon, uuid, checkin, res);
	} else {
		res.send("{\"error\":\"please include a valid uuid\"}");
	}

});


app.post("/is_located", function(req, res) {

	// Something messed up. 
	function fail() {
		res.set("WWW-Authenticate", authorization.format("Basic"));
		res.status(401).send();
	}

	// Get authorization header. 
	var auth = authorization.parse(req.get("authorization"));

	// No basic authentication provided. 
	if (auth.scheme !== "Basic") {
		return fail();
	}

	// Get the basic auth component. 
	var splits = Buffer(auth.token, "base64").toString().split(":", 2);
	var pw = splits[1];
	var un = splits[0];

	// Verify authentication. 
	if (un !== "admin" || pw !== "GWdkkjnj,VVk") {
		return fail();
	}


	var lat = req.body.lat;
	var lon = req.body.lon;
	var uuid = req.body.uuid;
	if (typeof uuid !== "undefined" && uuid !== null && req.body.uuid) {
		is_located(lat, lon, uuid, checkin, res);
	} else {
		res.send("{\"error\":\"please include a valid uuid\"}");
	}

});


//********CHECKOUT*********//



app.get("/checkout", function(req, res) {
	var uuid = req.query.uuid;

	if (typeof uuid !== "undefined" && uuid !== null && req.query.uuid) {
		sessions.get(uuid, function(err, data) {
			if (err) {
				res.send("{\"error\":\"uuid does not exist, please checkin first\"}");
			} else {

				if (data.end === 0) {
					sessions.insert({
						_id: uuid,
						clinic_id: data.clinic_id,
						_rev: data._rev,
						start: data.start,
						end: Date.now()
					}, function(err, body, header) {
						if (err) {
							res.send("{\"error\":\"uuid does not exist, please checkin first\"}");
						} else {
							console.log("updated");
							//			console.log(body);
							res.send(body);
						}
					});
				} else {
					res.send("{\"error\":\"session is already checked out\"}");
				}

			}
		});
	} else {
		res.send("{\"error\":\"please include a valid uuid\"}");
	}




});



app.post("/checkout", function(req, res) {

	// Something messed up. 
	function fail() {
		res.set("WWW-Authenticate", authorization.format("Basic"));
		res.status(401).send();
	}

	// Get authorization header. 
	var auth = authorization.parse(req.get("authorization"));

	// No basic authentication provided. 
	if (auth.scheme !== "Basic") {
		return fail();
	}

	// Get the basic auth component. 
	var splits = Buffer(auth.token, "base64").toString().split(":", 2);
	var pw = splits[1];
	var un = splits[0];

	// Verify authentication. 
	if (un !== "admin" || pw !== "GWdkkjnj,VVk") {
		return fail();
	}



	var uuid = req.body.uuid;

	if (typeof uuid !== "undefined" && uuid !== null && req.body.uuid) {
		sessions.get(uuid, function(err, data) {
			if (err) {
				res.send("{\"error\":\"uuid does not exist, please checkin first\"}");
			} else {

				if (data.end === 0) {
					sessions.insert({
						_id: uuid,
						clinic_id: data.clinic_id,
						_rev: data._rev,
						start: data.start,
						end: Date.now()
					}, function(err, body, header) {
						if (err) {
							res.send("{\"error\":\"uuid does not exist, please checkin first\"}");
						} else {
							console.log("updated");
							//			console.log(body);
							res.send(body);
						}
					});
				} else {
					res.send("{\"error\":\"session is already checked out\"}");
				}

			}
		});
	} else {
		res.send("{\"error\":\"please include a valid uuid\"}");
	}




});




//********GET_WAIT_TIMES*********//



var deg2rad = function(deg) {
	return deg * (Math.PI / 180);
};

var getDistanceFromLatLonInKm = function(lat1, lon1, lat2, lon2, callback) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1); // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
		Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	callback(d);
};


var getDrivingTime = function(lat1, long1, lat2, lon2, callback) {

	var options = {
		host: "maps.googleapis.com",
		path: "/maps/api/distancematrix/json?units=metric&origins=" + lat1 + "," + long1 + "&destinations=" + lat2 + "," + lon2 + "&key="+MAPS_API_KEY,
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		}
	};


	var reqq = https.get(options, function(ress) {
		console.log("STATUS: " + ress.statusCode);
		console.log("HEADERS: " + JSON.stringify(ress.headers));

		// Buffer the body entirely for processing as a whole.
		var bodyChunks = [];
		ress.on("data", function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
		}).on("end", function() {
			var body = Buffer.concat(bodyChunks);
			console.log("BODY: " + body);
			var time_raw = JSON.parse(body).rows[0].elements[0].duration.value;
			console.log(time_raw);
			//callback(time_raw);
		});
	});

	reqq.on("error", function(e) {
		console.log("ERROR: " + e.message);
	});


};


//recursive function which gets the wait times for the top 5 clinics
//@param: err - handles potential errors
//@params: clinics - top 5 nearest clinics
//@count: the current item to access in the array
var get_wait_times = function(err, clinics, count, choices, res, lat, lon, callback) {

	if (err) throw err;

	//gets the total length of the clinics
	var n = clinics.length;



	if (count < n) {

		//console.log(count);
		var clinic = clinics[count];
		//var wait = 0;

		callback(clinic.id, function(response) {




			//res.send(clinic);
			getDistanceFromLatLonInKm(lat, lon, clinic.doc.geometry.coordinates[1], clinic.doc.geometry.coordinates[0], function(distance) {
				//pushes the final product to the array

				var d = new Date();

				var day = "";

				if (hd.isHoliday(d) && clinic.doc.properties["Stat"] !== "") {
					day = "Stat";
				} else {
					day = weekday[d.getDay()];
				}

				var time_range = clinic.doc.properties[day];

				if (time_range !== "" && time_range !== "Closed") {

					var time = time_range.split("-");

					var start = time[0].replace("AM", " AM").replace("PM", " PM");
					var end = time[1].replace("AM", " AM").replace("PM", " PM");

					var date = d.getDate();
					var month = d.getMonth() + 1;
					var year = d.getFullYear();


					var d1 = new Date(month + "/" + date + "/" + year + "/" + " " + start);
					var d2 = new Date(month + "/" + date + "/" + year + "/" + " " + end);

					var t1 = d1.getTime();
					var t2 = d2.getTime();

					var t_cur = d.getTime();
					if (t_cur > t1 && t_cur < t2) {
						choices.push({
							key: clinic.id,
							name: clinic.doc.properties.name,
							values: {
								"wait_time": response,
								"distance": distance
							}
						});
					}

				} else if (time_range !== "Closed") {
					choices.push({
						key: clinic.id,
						name: clinic.doc.properties.name,
						values: {
							"wait_time": response,
							"distance": distance
						}
					});
				}
				//Recursively calls the next item in the array
				get_wait_times(err, clinics, count + 1, choices, res, lat, lon, callback);
			});

			//});

		});

	} else {
		if (choices.length === 0) {
			res.send("{\"message\":\"There are no available clinics in your area\"}");
		} else {
			//when the array has been processed, logs the array
			//console.log(choices);
			//res.send(choices);
			//generates the problem statement and options for IBM Tradeoff Analytics
			var problem = {
				"subject": "clinics",
				"columns": [{
					"key": "wait_time",
					"full_name": "Wait",
					"type": "numeric",
					"is_objective": true,
					"goal": "min",
					"significant_gain": 0.7
				}, {
					"key": "distance",
					"full_name": "Distance",
					"type": "numeric",
					"is_objective": true,
					"goal": "min",
					"significant_gain": 0.3
				}],
				"options": choices
			};

			//makes a decision
			tradeoff_analytics.dilemmas(problem, function(err, resolution) {
				if (err)
					console.log(err);
				else
				//prints the decision
				//  console.log(util.inspect(resolution, {showHidden: false, depth: null}));
				// var solution = [resolution, clinics];

					var solution = [];
				for (var i = 0; i < choices.length; i++) {
					var cleaned = {};
					var id = choices[i].key;
					cleaned.values = choices[i].values;
					//console.log(c.key);
					//console.log(choices);
					for (var j = 0; j < choices.length; j++) {
						if (resolution.resolution.solutions[j].solution_ref === id) {
							cleaned.status = resolution.resolution.solutions[j].status;
							//console.log("status");
							break;
						}
					}

					for (var k = 0; k < choices.length; k++) {
						if (clinics[k].id === id) {
							cleaned.properties = clinics[k].doc;
							//console.log("properties");
							break;
						}
					}

					solution.push(cleaned);


					//console.log(cleaned);
				}
				res.send(solution);
				// res.send(clinics[0].doc);
			});
		}
	}
};

var waiting_time = function(clinic_id, callback) {
	var query1 = {
		"selector": {
			"clinic_id": clinic_id,
			"end": {
				"$gt": 0
			}
		}
	};


	sessions.find(query1, function(er, result) {
		if (er) {
			//  res.send(er);
		}
		var avg = 0;
		var number_of_completed = result.docs.length;
		var sum = 0;

		if (number_of_completed === 0) {
			callback(0);
		} else {
			for (var i = 0; i < result.docs.length; i++) {
				var start_time = new Date(result.docs[i].start * 1000);
				var end_time = new Date(result.docs[i].end * 1000);
				var difference = (start_time - end_time) / 1000;
				// var diff = result.docs[i].end - result.docs[i].start;
				sum = sum + Math.abs(difference);
				//console.log(diff);
			}

			avg = sum / number_of_completed;
			//console.log(sum);
			// callback(avg, clinic_id, res);


			//res.send(avg.toString());
			return callback(avg);
		}
	});
};


var total_time = function(clinic_id, avg) {
	var query1 = {
		"selector": {
			"clinic_id": clinic_id,
			"end": 0
		}
	};


	sessions.find(query1, function(er, result) {
		if (er) {
			//  res.send(er);
		}
		var number_of_incompleted = result.docs.length;

		return avg * number_of_incompleted;

	});
};


var nearest = function(callback, lat, lon, res) {


	var options = {
		host: "nbrons.cloudant.com",
		path: "/clinics_geo_details/_design/geoix/_geo/geoix?lat=" + lat + "&lon=" + lon + "&radius=25000&include_docs=true",
		method: "GET",
		headers: {
			"Content-Type": "application/json",
			"Authorization": "Basic "+CLOUDANT_API_KEY
		}
	};


	var reqq = https.get(options, function(ress) {
		// console.log('STATUS: ' + ress.statusCode);
		// console.log('HEADERS: ' + JSON.stringify(ress.headers));

		// Buffer the body entirely for processing as a whole.
		var bodyChunks = [];
		ress.on("data", function(chunk) {
			// You can process streamed parts here...
			bodyChunks.push(chunk);
		}).on("end", function() {
			var body = Buffer.concat(bodyChunks);
			// console.log('BODY: ' + body);
			//  res.send( JSON.parse(body).rows);

			callback(null, JSON.parse(body).rows, 0, [], res, lat, lon, waiting_time);
		});
	});

	reqq.on("error", function(e) {
		console.log("ERROR: " + e.message);
	});


};


//app.get('/waiting_time', function(req, res) {
//	var clinic_id = parseInt( req.query.clinic_id, 10);
//res.send(clinic_id);
//	waiting_time(clinic_id, res, null);

//});


app.get("/get_best", function(req, res) {
	var lat = req.query.lat;
	var lon = req.query.lon;
	//res.send(clinic_id);


	nearest(get_wait_times, lat, lon, res);
});