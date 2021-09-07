
var request = require('request');
var fs = require('fs');
var { Parser } = require('json2csv');
var async = require('async');
var _ = require('underscore');
var RateLimiter = require('limiter').RateLimiter;
var flatten = require('flat');

var apikey = '71b37b80098f05392a28bacba1512a12';
var password = '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';
var shopname = 'pardeeps-ecommerce-website';

var baseurl = 'https://' + apikey + ':' + password + '@' + shopname + '.myshopify.com';
var numOrders = 0;
var ordersList = [];

var getOrders = function (page, callback) {
  request({
    url: baseurl + '/admin/orders.json',
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var newList = [];
      for (var i = 0; i < body.orders.length; i++) {
        newList.push(flatten(body.orders[i]));
      }
      ordersList = ordersList.concat(newList);
      console.log('Received page :' + page + ' - count: ' + newList.length);
      console.log('ordersList len:' + ordersList.length);
      console.log();
    }
    callback();
  })
}

request({
  url: baseurl + '/admin/orders/count.json?status=any',
  json: true
}, function (error, response, body) {
  if (!error && response.statusCode === 200) {
    numOrders = body.count;
  }

  console.log('Total Order Count :' + numOrders);
  var numPages = numOrders / 250;
  var r = _.range(1, numPages + 1);
  async.forEach(r, function (page, callback) {
      getOrders(page, callback);
  }, function (err) {
    // Called when all are finished
    console.log('Total orders: ' + ordersList.length)

    const fields = ['customer.email', 'customer.default_address.address1', 'line_items.0.sku', 'line_items.1.name'];
    const opts = { fields };

    try {
      const parser = new Parser(opts);
      // console.log("orderList ", ordersList);
      const csv = parser.parse(ordersList);
      console.log(csv);
      convertToCsv(csv)
    } catch (err) {
      console.error(err);
    }

    function convertToCsv(csv) {
      if (err) console.log(err);
      fs.writeFile('ShopifyOrders.csv', csv, function (err) {
        if (err) throw err;
        console.log('File saved');
      });
    }
  });
});





