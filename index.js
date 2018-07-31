'use strict';

//------------------------------------------------------
// ライブラリ定義
//------------------------------------------------------
/**
 * Alexa開発に用いるSDKライブラリ
 */
let Alexa = require('alexa-sdk');

/**
 * 応答を組み立てるためのライブラリ
 */
let util = require('util');

//------------------------------------------------------
// 変数・定数定義
//------------------------------------------------------
//外出しにしている処理群
let myResponseHandlers = require('./response');

/**
 * 状態定義クラス
 */
const state = require("./dataAssets/state.json");

/**
 * 応答メッセージ格納変数
 */
const MESSAGE = require("./message_ja.json");

/**
 * 応答データとのマッピング変数
 */
const PATTERN = require("./dataAssets/pattern.json");


/**
 * 応答データ格納変数
 */
const DATA = require("./dataAssets/data.json");

const verifier = require('./util/verifier.js')


//------------------------------------------------------
// Alexaの処理定義
// 各状態をハンドリングするハンドラーを追加する必要がある
//------------------------------------------------------
exports.handler = function (event, context, callback) {
    console.log(JSON.stringify(event, ' ', 4));

    // CEKヘッダ検証
    const signature = event.headers.signaturecek || event.headers.SignatureCEK;

    let isCEKRequest = true;
    try{
        verifier(signature, process.env.APP_ID, JSON.stringify(event.requestParameters));
    }catch(e){
        isCEKRequest = false;
    }

    if (isCEKRequest) {
        const requestJson = event.requestParameters;
        let alexa = Alexa.handler(requestJson, context, callback);
        alexa.appId = requestJson.context.System.application.applicationId;
        alexa.registerHandlers(
            NewSessionHandler,
            ActionHandler,
            myResponseHandlers  // welcome応答を差し込むためのEventを入れ込むためのハンドラー
        );

        alexa.execute();
    } else {
        const error = {
            "version": "1.0",
            "sessionAttributes": {},
            "response": {
                "outputSpeech": {
                    "type": "SimpleSpeech",
                    "values": {
                        "type": "PlainText",
                        "lang": "ja",
                        "value": "正しい宛先からのリクエストではありません。"
                    }
                },
                "card": {},
                "directives": [],
                "shouldEndSession": false
            }
        };
        callback(null, error);
    }
};

//-------------------- ハンドラ定義 ---------------------

let NewSessionHandler = {
    'LaunchRequest': function () {
        this.handler.state = state.LOOPBACK;
        this.emit(':clovaAsk', MESSAGE.welcome.speechOutput);
    },
    'MyVegetableIntent': function () {
        this.handler.state = state.LOOPBACK;
        this.emitWithState('MyVegetableIntent');
    },
    'MyVegetableOnlyIntent': function () {
        this.emit('MyVegetableIntent');
    },
    //HelpIntent
    'Clova.GuideIntent': function () {
        this.handler.state = state.LOOPBACK;
        this.emit(':clovaAsk', MESSAGE.help.speechOutput);
    },
    'Clova.CancelIntent': function () {
        this.emit(':clovaTell', MESSAGE.session.end.speechOutput);
    },
    'AMAZON.CancelIntent': function () {
        this.emit('Clova.CancelIntent');
    },
    'AMAZON.StopIntent': function () {
        this.emit('AMAZON.CancelIntent');
    },
    'Unhandled': function () {
        // 無効応答のときであってもとりあえずスキルは起動させる
        this.emit('LaunchRequest');
    }
};

let ActionHandler = Alexa.CreateStateHandler(state.LOOPBACK, {
    'MyVegetableIntent': function () {
        if (this.event.request.intent.slots) {
            let nameSlot = this.event.request.intent.slots.VegetableName;
            let seasonSlot = this.event.request.intent.slots.SeasonName;

            let speechOutput;
            let vegetableName = nameSlot ? PATTERN[nameSlot.value] : null;
            if (!vegetableName){
                if (nameSlot && nameSlot.value) {
                    speechOutput = util.format(MESSAGE.guide.noinfo.speechOutput, nameSlot.value);
                    this.emit(':clovaAsk', speechOutput);
                } else {
                    this.emit(':clovaAsk', MESSAGE.guide.error.speechOutput);
                }
            }else{
                let vegeJson = DATA[vegetableName];
                if (seasonSlot && seasonSlot.value){
                    speechOutput = util.format(MESSAGE.action.speechOutput, vegetableName, vegeJson.season, '。');
                }else{
                    speechOutput = util.format(MESSAGE.action.speechOutput, vegetableName, vegeJson.season, vegeJson.description);
                }
                this.emit(':clovaAsk', speechOutput);
            }
        } else {
            this.emit(':clovaAsk', MESSAGE.guide.error.speechOutput);
        }
    },
    'MyVegetableOnlyIntent': function () {
        this.emitWithState('MyVegetableIntent');
    },
    //HelpIntent
    'Clova.GuideIntent': function () {
        this.handler.state = state.LOOPBACK;
        this.emit(':clovaAsk', MESSAGE.help.speechOutput);
    },
    'Clova.CancelIntent': function () {
        this.emit(':clovaTell', MESSAGE.session.end.speechOutput);
    },
    'Unhandled': function () {
        this.emit(':clovaAsk', MESSAGE.guide.error.speechOutput);
    }
});

process.on('unhandledRejection', function (err) {
    console.error(`(Error) Uncaught unhandledRejection: ${err}\n${err.stack}`);
    throw err;
});
process.on('uncaughtException', function (err) {
    console.error(`(Error) Uncaught exception: ${err}\n${err.stack}`);
    throw err;
});


