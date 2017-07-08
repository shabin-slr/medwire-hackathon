angular.module("doh", ["ngAnimate","ngToast","ngSanitize"])
.config(['ngToastProvider', function(ngToast) {
  ngToast.configure({
    verticalPosition: 'top',
    horizontalPosition: 'right',
    animation: 'fade',
    dismissButton : true,
    dismissOnTimeout : false
  });
}])
.controller("DohController", ["$scope", "$http", "$timeout", function($scope, $http, $timeout){

	var ctrl = this;
	ctrl.stage = "login";
	ctrl.report = {};

	ctrl.login = function(){
		if(!ctrl.doh.country || !ctrl.doh.region) return;
		ctrl.stage = "loggedIn";
		ctrl.loggedIn = true;
		ctrl.report = {};
		firebase.database().ref('/epidemics/' + ctrl.doh.country.name + '/' + ctrl.doh.region).on('value', function(snapshot) {
			var epidemics = snapshot.val() || {};
			ctrl.knownEpidemics = Object.keys(epidemics);
			$timeout(function(){
				$scope.$apply();	
			},50);
		})
	}

	ctrl.logout = function(){
		firebase.database().ref('/epidemics/' + ctrl.doh.country.name + '/' + ctrl.doh.region).off()
		ctrl.stage = "login";
		ctrl.doh = null;
		ctrl.password = "";
		ctrl.loggedIn = false;
	}

	ctrl.getRegionalReport = function(){
		$http.get(window.location.origin + '/' + ctrl.doh.country.name+'/' +ctrl.doh.region + '/disease-report').then(function(data){
			console.log(data.data);
			ctrl.report = {};
			ctrl.report[ctrl.doh.region] = data.data;
			var diseases = Object.keys(ctrl.report).map( region => ctrl.report[region].map( disease => disease.name))
			diseases = diseases.reduce((x , y) => x.concat(y), []).filter(function(item, i, ar){return ar.indexOf(item) === i;});
			ctrl.diseases = diseases;
		})
	}

	ctrl.getNationalReport = function(){
		$http.get(window.location.origin + '/' + ctrl.doh.country.name+'/disease-report').then(function(data){
			console.log(data.data);
			ctrl.report = data.data;
			var diseases = Object.keys(ctrl.report).map( region => ctrl.report[region].map( disease => disease.name))
			diseases = diseases.reduce((x , y) => x.concat(y), []).filter(function(item, i, ar){return ar.indexOf(item) === i;});
			ctrl.diseases = diseases;
			//ctrl.report[ctrl.doh.region] = data.data
		})
	}

	ctrl.declareEpidemic = function(diseaseName, region){
		var update = {};
		update[diseaseName] = true;
		firebase.database().ref('/epidemics/'+ctrl.doh.country.name+"/"+region).update(update);
	}

	ctrl.removeEpidemic = function(diseaseName){
		var update = {};
		update[diseaseName] = null;
		firebase.database().ref('/epidemics/'+ctrl.doh.country.name+"/"+ctrl.doh.region).update(update);
	}

	firebase.database().ref('/dohs').once('value').then(function(snapshot) {
	  console.log(snapshot.val());
	  ctrl.dohs = snapshot.val();
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