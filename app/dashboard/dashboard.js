'use strict';

angular.module('myApp.dashboard', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/dashboard', {
    templateUrl: 'dashboard/dashboard.html',
    controller: 'View1Ctrl'
  });
}])

.controller('View1Ctrl', ['$scope', 'exchangeRateService', function($scope, exchangeRateService) {

  $scope.selectedItem = "today";
  $scope.periodOptions = [{value: "today", label: "Today"}, {value: "week", label: "Week"}, {value: "month", label: "Month"}];

  $scope.currentRates = new Array();
  exchangeRateService.getLast().then(
    function (data) {
      $scope.currentRates = data;
    }
  );


  $scope.loadChart = function () {

    exchangeRateService.loadAll($scope.selectedItem).then(
      function (data) {

        var labels = [];
        var graphData = [];

        var auxDate = "";
        for (var i in data) {
          if ($scope.selectedItem == "today") {
            var newDate = data[i].datetime.slice(0, 16).replace("T", " ");
          } else {
            var newDate = data[i].datetime.slice(0, 10).replace("T", " ");
          }

          if (newDate != auxDate) {
            labels.push(newDate);
            graphData.push(data[i].rates[0].rate);

            auxDate = newDate;
          }
        }

        var ctx = $("#mainChart");
        var myChart = new Chart(ctx, {
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
      }, function (error) {
        alert('erro: ' + error);
      });
    }
    $scope.loadChart();


  }])


  .factory('exchangeRateService', ['$q', '$http', function ($q, $http) {
    var BASE_URL = "http://floating-spire-61246.herokuapp.com/api/v1/exchange_rate";
    var factory = {};
    factory.loadAll = function (selectedItem) {
      var result = $q.defer();
      var datetime = new Date();
      var url = BASE_URL;
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

      $http({
        method: 'GET',
        url: url
      }).then(function successCallback(response) {
        result.resolve(response.data);
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        console.log("error");
        console.log(response);
      });

      return result.promise;
    }

    factory.getLast = function () {
      var result = $q.defer();
      $http({
        method: "GET",
        url: BASE_URL + "/current"
      }).then(function successCallback(response) {
        result.resolve(response.data);
      }, function errorCallback(response) {
        console.log("error");
        console.log(response);
      });

      return result.promise;
    }

    return factory;
  }])
  ;
