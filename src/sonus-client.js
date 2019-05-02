'use strict';

module.exports = function (RED) {
    function NodeRedSonus(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        node.status({ fill: "red", shape: "dot", text: "waiting" });

        // Init
        const Sonus = require('sonus')
        const speech = require('@google-cloud/speech')
        const client = new speech.SpeechClient({
            credentials: {
                client_email: node.credentials.userdata,
                private_key: node.credentials.key
            }
        })

        const dict = {
            "valueEnUS": "en-US",
            "valueFrFR": "fr-FR",
            "valueRec": "rec",
            "valueSox": "sox",
            "valueArc": "arecord"
        }

        // Init snowboy
        const hotwords = [{ file: config.model, hotword: config.hotword }]

        const sonus = Sonus.init({
            hotwords,
            language: dict[config.language],
            recordProgram: dict[config.program],
            device: config.arecord
        }, client)

        node.status({ fill: "yellow", shape: "dot", text: dict[config.langage] + ' ' + dict[config.program] + ' ' + config.arecord });

        // Start
        Sonus.start(sonus)

        sonus.on('hotword', (index, keyword) => {
            node.status({ fill: "blue", shape: "dot", text: keyword });
        });
        sonus.on('final-result', (msg) => {
            node.warn(`result ${JSON.stringify(msg)}`);
            node.status({ fill: "green", shape: "dot", text: msg });
            node.send(msg);
        });
        sonus.on('error', (err) => {
            node.warn(`error ${JSON.stringify(err)}`);
        });

        // Handle node close
        node.on('close', function () {
            node.warn('sonus client close', err);
        });
    }

    // Register this node
    RED.nodes.registerType("sonus-client", NodeRedSonus, {
        credentials: {
            userdata: { type: "text" },
            key: { type: "password" }
        }
    });
}