module.exports = function(RED) {
    "use strict";


    function Evapo(n) {

        var node = this;

        RED.nodes.createNode(node, n);

        node.config = n.config;
        node.myConfig = RED.nodes.getNode(node.config);


        if (node.myConfig) {


            //node.myConfig.doConnect();

            // Node status: [OK]
            node.status({ fill: "green", shape: "dot", text: "OK" });



            node.on("input", function(msg) {

                // Node Status: [Waiting...]
                node.status({ fill: "grey", shape: "ring", text: "Waiting..." });

                var et = require("evapotranspiration_calculator");
                var moment = require("moment-timezone");
                var request = require("request");

                if (msg.date) {
                    var today = new Date(msg.date);
                } else {
                    var today = new Date();
                }
                var dd = today.getDate() + "";
                var mm = today.getMonth() + 1 + ""; //January is 0!
                var yyyy = today.getFullYear() + "";

                if (dd < 10) {
                    dd = '0' + dd
                }

                if (mm < 10) {
                    mm = '0' + mm
                }

                today = yyyy + mm + dd;

                //var wundergroundKey = "eeb8ad71732b7b08"; // your wunderground api key
                //var pws = "KALHUNTS183"; // the pws you are using, NOTE: this must has solar radiation and wind speed


                var inputDate = today; //"20170701"; // the date you want to calc ET for
                var canopyReflectionCoefficient = "0.23"; // your reflection coeffecient
                var wundergroundKey = msg.key || this.myConfig.key;
                var pws = msg.pws || this.myConfig.pws;
                var day = moment(inputDate);
                var url = "http://api.wunderground.com/api/" + wundergroundKey + "/conditions/history_" + day.format("YYYYMMDD") + "/q/pws:" + pws + ".json";


                // Make API request to Weather Underground

                request(url, function(error, response, body) {
                    if (!error && response.statusCode === 200) {
                        var obj = JSON.parse(body);

                        et.calc(obj, day, canopyReflectionCoefficient, function(error, response) {
                            if (!error) {
                                //console.log(response);
                                node.send({ payload: response });
                                node.status({ fill: "blue", shape: "dot", text: "Complete" });
                            } else {
                                node.error(error);
                                node.status({ fill: "red", shape: "ring", text: "API Error" });
                            }
                        });

                    } else {
                        node.error(error);
                        node.status({ fill: "red", shape: "ring", text: "Calc Error" });
                    }
                });



            });
        } else {
            node.error("Evapo not configured");
            node.status({ fill: "red", shape: "ring", text: "Not Configured" });
        }
    }
    RED.nodes.registerType("evapo", Evapo);




    function EvapoConfig(n) {
        RED.nodes.createNode(this, n);

        this.key = n.key;
        this.pws = n.pws;

        var node = this;

        node.doConnect = function() {
            // Placeholder
        }

        node.on('close', function() {
            // Placeholder
        });
    }
    RED.nodes.registerType("evapo-config", EvapoConfig);


}