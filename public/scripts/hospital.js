angular.module("hospital", ["ngAnimate","ngToast","ngSanitize"])
.config(['ngToastProvider', function(ngToast) {
  ngToast.configure({
    verticalPosition: 'top',
    horizontalPosition: 'right',
    animation: 'fade',
    dismissButton : true,
    dismissOnTimeout : false
  });
}])
.controller("HospitalController", ["$scope", "$timeout", "ngToast", function($scope, $timeout, ngToast){

	var ctrl = this;

	ctrl.stage = "login";
	ctrl.knownEpidemics = [];
	var firstime = true;

	var setEpidemic = function(){
		firebase.database().ref('/epidemics/' + ctrl.hospital.country + '/' + ctrl.hospital.region).on('value', function(snapshot) {
			var epidemics = snapshot.val() || {};
			var freshEpidemics = Object.keys(epidemics);
			if(!firstime){
				if(freshEpidemics.length > ctrl.knownEpidemics){
					var newEpidemics = freshEpidemics.filter(x=>ctrl.knownEpidemics.indexOf(x) == -1).join(", ");
					ngToast.create({
						content: " New epidemic reported in your region : " + newEpidemics,
						className : "danger"
					});
					//alert(" New epidemic reported in your region : " + newEpidemics)
				} else {
					var removedEpidemics = ctrl.knownEpidemics.filter(x=>freshEpidemics.indexOf(x) == -1).join(", ");
					//alert(" Epidemic alert for following diseases lifted : " + removedEpidemics)
					ngToast.create({
						content: " Epidemic alert for following diseases lifted : " + removedEpidemics,
						className : "success"
					});
				}
			}
			firstime = false;
			ctrl.knownEpidemics = Object.keys(epidemics);
			$timeout(function(){
				$scope.$apply();	
			},50);
		})
	}

	ctrl.showManagement = function(disease){
		var procedures = "";
		if(disease == "Dengue"){
			procedures = "<strong> Outbreak Response</strong> : Collect, report, and analyse data on cases, deaths, and control activities;"
			+"<br/>document the epidemic; provide feedback and adapt interventions;"
			+"implement measures to control the spread of the disease (disinfection of water sources, food safety measures);"
			+"conduct health education campaigns;"
			+"ask for additional help;"
			+"monitor and evaluate control measures";
		} else {
			procedures = "<strong> Outbreak Response</strong> : Role for larval control in the form of source reduction efforts, the majority stating a role for chemical control, and a minority for biological control. Ten of the plans advocated adult mosquito control, predominantly through chemical methods involving the space spraying of insecticide outdoor spraying, indoor spraying). Nonchemical mosquito control methods were rarely documented. The major gaps in vector-control documentation included who is responsible for such actions, when and for how long vector control should be performed, mapping of the area that needs to be covered around the case residence, and monitoring of the vector population. The plans often focused on environmental larval control during the interepidemic period but emphasised chemical mosquito control during the outbreak, usually in the form of space spraying.";
		}

		ngToast.create({
			content: procedures,
			className : "info"
		});
	}

	/*var session = localStorage.getItem("hospital");
	if(!!session){
		try{
			ctrl.hospital = JSON.parse(session);
			ctrl.stage = "loggedIn";
			ctrl.loggedIn = true;
			setEpidemic();
		}catch(e){
			localStorage.removeItem("hospital");
		}
	}*/
	ctrl.login = function(){
		if(!ctrl.hospital || !ctrl.password) return;
		localStorage.setItem("hospital", JSON.stringify(ctrl.hospital))
		ctrl.stage = "loggedIn";
		ctrl.loggedIn = true;
		setEpidemic();
	}

	ctrl.logout = function(){
		firebase.database().ref('/epidemics/' + ctrl.hospital.country + '/' + ctrl.hospital.region).off();
		ctrl.stage = "login";
		ctrl.hospital = null;
		ctrl.password = "";
		ctrl.loggedIn = false;
	}

	ctrl.searchForEpidemics = function(){
		if(!ctrl.patient || !ctrl.patient.country || !ctrl.patient.region) return;

		firebase.database().ref('/epidemics/' + ctrl.patient.country.name + '/' + ctrl.patient.region).once('value').then(function(snapshot) {
		  console.log(snapshot.val());
		  var diseasesInRegion = snapshot.val() || {};
		  diseasesInRegion = Object.keys(diseasesInRegion);
		  if(diseasesInRegion.length){
		  	ngToast.create({
					content: "Known epidemics in region travelled by patient  : " + diseasesInRegion.join(", "),
					className : "danger"
				});
				$timeout(function(){
						$scope.$apply();
				},50)
		  }

		});

	}

	ctrl.registerEpidemic = function(){
		if(!ctrl.epidemic || !ctrl.epidemic.name || !ctrl.epidemic.symptoms) return;
		var newPostKey = firebase.database().ref('/epidemics/'+ctrl.epidemic.country+"/"+ctrl.epidemic.region).push().key;
		var update = {};
		update[newPostKey] = {
			name : ctrl.epidemic.name,
			symptoms : ctrl.epidemic.symptoms,
			quarantineRequired : !!ctrl.epidemic.quarantineRequired,
			dateOfReport : Date.now(),
			country : ctrl.hospital.country,
			region : ctrl.hospital.region
		};
		firebase.database().ref('/epidemics/'+ctrl.hospital.country+"/"+ctrl.hospital.region).update(update);
		ctrl.epidemic = {};

		ctrl.stage = 'loggedIn';

	}

	ctrl.saveDiagnosis = function(){

		if(!ctrl.patient || !ctrl.patient.symptoms || !ctrl.patient.diagnosis ) return;
		if(!!ctrl.patient.isForeigner && (!ctrl.patient.country || !ctrl.patient.region)) return;
		var newPostKey = firebase.database().ref('/patients/' + ctrl.hospital.country + '/' + ctrl.hospital.region).push().key;
		var update = {};
		update[newPostKey] = {
			name : ctrl.patient.name,
			symptoms : ctrl.patient.symptoms,
			diagnosis : ctrl.patient.diagnosis,
			isForeigner : !!ctrl.patient.isForeigner,
			dateOfReport : Date.now(),
		};
		if(!!ctrl.patient.isForeigner){
			update[newPostKey].country = ctrl.patient.country.name;
			update[newPostKey].region = ctrl.patient.region;
		}
		firebase.database().ref('/patients/' + ctrl.hospital.country + '/' + ctrl.hospital.region).update(update);
		ctrl.patient = {};

		//alert("");

		ngToast.create({
			content: "Diagnosis saved",
			className : "success",
			dismissOnTimeout : true,
			timeout	: 1500
		});

	}


	firebase.database().ref('/hospitals').once('value').then(function(snapshot) {
	  console.log(snapshot.val());
	  ctrl.hospitals = snapshot.val();
	  $scope.$apply();
	});

	firebase.database().ref('/countries').once('value').then(function(snapshot) {
	  console.log(snapshot.val());
	  ctrl.countries = snapshot.val();
	  $scope.$apply();
	});

}]).service("HospitalService", [function(){
	var self = this;
}]);