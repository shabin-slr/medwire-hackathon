var admin = require("firebase-admin");

var serviceAccount = require("./fire-config.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hackathon-7th-july.firebaseio.com"
});

var db = admin.database();
var ref = db.ref("/patients");

ref.once("value", function(snap) {
  var diagnosis = snap.val();
  var countries = Object.keys(diagnosis);
  console.log(countries);
  countries.forEach ( country => {
		var regions = Object.keys(diagnosis[country]);
		console.log(regions);

		regions.forEach(region => {
				var regionsDiagnosis = diagnosis[country][region];
				regionsDiagnosis = Object.keys(regionsDiagnosis).map( x => regionsDiagnosis[x]);
				console.log(regionsDiagnosis.filter(diag => diag.diagnosis == "Cholera").length);
		})
		
	})
});



module.exports = {
	getFBData : function(req, res, next) {
		ref.once("value", function(snap) {
		  var diagnosis = JSON.stringify(snap.val());
		  res.send(snap.val());
		});
	},

	getRegionReport : function(req, res, next) {
		console.log( req.params.country);
		console.log( req.params.region);
		var ref = db.ref("/patients/" + req.params.country + "/" +req.params.region);
		ref.once("value", function(snap) {
			var data = snap.val() || [];
			var diags = Object.keys(data).map( k => data[k]);
			var diseaseNames = diags.map( x=> x.diagnosis).filter(function(item, i, ar){ return ar.indexOf(item) === i; });
			var diseases = diseaseNames.map( function(x){ return {name : x, count : diags.filter( y=>y.diagnosis == x).length } });

			res.send(JSON.stringify(diseases));
		})

	},

	getCountrynReport : function(req, res, next) {
		console.log( req.params.country);
		var ref = db.ref("/patients/" + req.params.country);
		ref.once("value", function(snap) {
			var data = snap.val() || {};
			var regions = Object.keys(data);
			var returnData = {};
			regions.forEach( region=>{
				data[region] = Object.keys(data[region]).map(x=>data[region][x])
			})
			regions.forEach((region)=>{
				var diseaseNames = data[region].map( x=> x.diagnosis).filter(function(item, i, ar){ return ar.indexOf(item) === i; });
				var diseases = diseaseNames.map( function(x){ return {name : x, count : data[region].filter( y=>y.diagnosis == x).length } });
				data[region] = diseases;
			})
			res.send(data);
			/*res.send(regions.map( function(region){
				return { region : data[region].map() }
			}))*/
			/*var diags = Object.keys(data).map( k => data[k]);
			var diseaseNames = diags.map( x=> x.diagnosis).filter(function(item, i, ar){ return ar.indexOf(item) === i; });
			var diseases = diseaseNames.map( function(x){ return {name : x, count : diags.filter( y=>y.diagnosis == x).length } });

			res.send(JSON.stringify(diseases));*/
		})

	}


}