'use strict';

angular.module('myApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
	$routeProvider.when('/dashboard', {
		templateUrl: 'dashboard/dashboard.html',
		controller: 'View1Ctrl'
	});
}])

.controller('View1Ctrl', ['$scope', 'exchangeRateService', function($scope, exchangeRateService) {

	// Default period
	$scope.selectedItem = "today";
	// Values to period select
	$scope.periodOptions = [{value: "today", label: "Today"}, {value: "week", label: "Week"}, {value: "month", label: "Month"}];

	// Load current rates to show o top
	$scope.currentRates = new Array();
	exchangeRateService.getLast().then(
		function (data) {
			$scope.currentRates = data;
		}
	);

	// Load data to chart of quotation by period and initializes the chart
	// when download finishs
	$scope.loadChart = function () {

		exchangeRateService.loadAll($scope.selectedItem).then(
			function (data) {
				mountChartOfCommercialQuotationByPeriod(data);
				loadComparativeChart(data);
			}, function (error) {
				alert('erro: ' + error);
			});
		}
		$scope.loadChart();


		function mountChartOfCommercialQuotationByPeriod(data) {
			var labels = [];
			var graphData = [];

			var auxDate = "";
			var auxValue = 0.0;
			for (var i in data) {
				var quant = $scope.selectedItem == "today" ? 16 : 10;
				var newDate = data[i].datetime.slice(0, quant).replace("T", " ");
				var newValue = data[i].rates[0].rate;

				if (newDate != auxDate && newValue != auxValue) {
					labels.push(newDate);
					graphData.push(newValue);
					auxDate = newDate;
					auxValue = newValue;
				}
			}

			if ($scope.mainChart != null ) { $scope.mainChart.destroy(); }
			var ctx = $("#mainChart");
			$scope.mainChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: labels,
					datasets: [{
						label: '# commercial dolar along time',
						data: graphData
					}]
				},
				options: {
					responsive: true,
					showXLabels: 10,
					skipXLabels: 5,
					scales: {
						yAxes: [{
							ticks: {
								beginAtZero:true
							}
						}]
					}
				}
			});
		}

		function loadComparativeChart (data) {
			var labels = [];
			var graphData = [];
			var auxDate = "";
			var auxValues = [];
	  
			for (var i in data) {

				var quotation = data[i];

				var quant = $scope.selectedItem == "today" ? 16 : 10;
				var newDate = quotation.datetime.slice(0, quant).replace("T", " ");

				if (newDate != auxDate) {

					var hasValues = false; //auxialiry value o say if this day has variation
					
					for (var i in quotation.rates) {
						var rate = quotation.rates[i];

						if (!graphData[rate.vetProvider])
							graphData[rate.vetProvider] = [];
			
						if (!auxValues[rate.vetProvider])
							auxValues[rate.vetProvider] = 0.0;		
						
						if (rate.rate != auxValues[rate.vetProvider]) {
							graphData[rate.vetProvider].push(rate.rate);
							auxValues[rate.vetProvider] = rate.rate;
							hasValues = true;
						}
					}
					
					if (hasValues)
						labels.push(newDate);
					
					auxDate = newDate;
				}
			}

			var datasets = [];
			var strokecolors = ['rgba(220,180,0,1)', 'rgba(235,19,66,1)', 'rgba(58,110,44,1)', 'rgba(148,52,148,1)', 'rgba(220,220,220,1)'];
			var i = 0;

			for (var key in graphData) {
				datasets.push(
					{
						label: key,
						data: graphData[key],
						borderColor: strokecolors[i],
						backgroundColor:
						strokecolors[i],
						fill:false
					}
				);
				i++;
			}

			if ($scope.comparativeChart != null) { $scope.comparativeChart.destroy(); }

			var ctx = $("#comparativeChart");
			$scope.comparativeChart = new Chart(ctx, {
				type: 'line',
				data: {
					labels: labels,
					datasets: datasets
				},
				options: {
					responsive: true,
					showXLabels: 10,
					skipXLabels: 5,
					scales: {
						yAxes: [{
							ticks: {
								beginAtZero:true
							}
						}]
					}
				}
			});
		}

	}])

	/**
	Service to load exchange rates
	*/
	.factory('exchangeRateService', ['$q', '$http', function ($q, $http) {
		var BASE_URL = "http://floating-spire-61246.herokuapp.com/api/v1/exchange_rate";
		var factory = {};

		/**
		Load all exchange Rates
		*/
		factory.loadAll = function (selectedItem) {
			var result = $q.defer();
			var datetime = new Date();
			var url = BASE_URL;

			// Mount URL depending on selectedItem
			if (selectedItem == null || selectedItem == "today") {
				var today = datetime.toISOString().slice(0,10)
				url += '?datetime=' + today;
			} else if (selectedItem == "week") {
				// get first and last day of current week
				var curr = new Date();
				var first = curr.getDate() - curr.getDay();
				var last = first + 6;

				var firstday = new Date(curr.setDate(first));
				var lastday = new Date(curr.setDate(last));

				url += '/' + firstday.toISOString().slice(0,10) + "/" + lastday.toISOString().slice(0,10);
			} else if (selectedItem == "month") {
				var curr = new Date();
				url += '/' + curr.toISOString().slice(0,8) + "01/" + curr.toISOString().slice(0,8) + "31";
			}

			// Do request
			$http({
				method: 'GET',
				url: url
			}).then(function successCallback(response) {
				result.resolve(response.data);
			}, function errorCallback(response) {
				console.log(response);
			});

			return result.promise;
		}

		/**
		Loads current quotation
		*/
		factory.getLast = function () {
			var result = $q.defer();
			$http({
				method: "GET",
				url: BASE_URL + "/current"
			}).then(function successCallback(response) {
				result.resolve(response.data);
			}, function errorCallback(response) {
				console.log(response);
			});

			return result.promise;
		}

		return factory;
	}])
	;
