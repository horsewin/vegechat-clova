/**
 * This response file is immitated by response.js in alexa-sdk.
 * To create original welcome response, this module was created.
 *
 *
 */

'use strict';

let MESSAGE = require('./message_ja.json');

/**
 *
 * @type {{:welcomeTell, :welcomeAsk}}
 */
module.exports = (function () {
    return {
        ':welcomeTell': function (speechOutput) {
            if (this.isOverridden()) {
                return;
            }
            if (this.event.session.new) {
                speechOutput = MESSAGE.welcome.base + speechOutput;
            }

            this.handler.response = buildSpeechletResponse({
                sessionAttributes: this.attributes,
                output: getSSMLResponse(speechOutput),
                shouldEndSession: true
            });
            this.emit(':responseReady');
        },
        ':welcomeAsk': function (speechOutput, repromptSpeech) {
            if (this.isOverridden()) {
                return;
            }
            if (this.event.session.new) {
                speechOutput = MESSAGE.welcome.base + speechOutput;
            }
            this.handler.response = buildSpeechletResponse({
                sessionAttributes: this.attributes,
                output: getSSMLResponse(speechOutput),
                reprompt: getSSMLResponse(repromptSpeech),
                shouldEndSession: false
            });
            this.emit(':responseReady');
        },
        ':clovaTell': function (speechOutput) {
            if (this.isOverridden()) {
                return;
            }
            this.handler.response = buildSpeechletResponse({
                sessionAttributes: {},
                output: clovaSetSimpleSpeechText(speechOutput),
                shouldEndSession: true
            });
            this.emit(':responseReady');
        },
        ':clovaAsk': function (speechOutput) {
            if (this.isOverridden()) {
                return;
            }
            this.handler.response = buildSpeechletResponse({
                sessionAttributes: this.attributes,
                output: clovaSetSimpleSpeechText(speechOutput),
                shouldEndSession: false
            });
            this.emit(':responseReady');
        },
    };
})();

function createSpeechObject(optionsParam) {
    if (optionsParam && optionsParam.type === 'SSML') {
        return {
            type: optionsParam.type,
            ssml: optionsParam['speech']
        };
    } else if (optionsParam && optionsParam.type === 'SimpleSpeech') {
        return {
            type: optionsParam.type,
            values: optionsParam.values
        };
    } else {
        return {
            type: optionsParam.type || 'PlainText',
            text: optionsParam['speech'] || optionsParam
        };
    }
}

function buildSpeechletResponse(options) {
    var alexaResponse = {
        shouldEndSession: options.shouldEndSession
    };

    if (options.output) {
        alexaResponse.outputSpeech = createSpeechObject(options.output);
    }

    if (options.reprompt) {
        alexaResponse.reprompt = {
            outputSpeech: createSpeechObject(options.reprompt)
        };
    }

    if (options.directives) {
        alexaResponse.directives = options.directives;
    }

    if (options.cardTitle && options.cardContent) {
        alexaResponse.card = {
            type: 'Simple',
            title: options.cardTitle,
            content: options.cardContent
        };

        if (options.cardImage && (options.cardImage.smallImageUrl || options.cardImage.largeImageUrl)) {
            alexaResponse.card.type = 'Standard';
            alexaResponse.card['image'] = {};

            delete alexaResponse.card.content;
            alexaResponse.card.text = options.cardContent;

            if (options.cardImage.smallImageUrl) {
                alexaResponse.card.image['smallImageUrl'] = options.cardImage.smallImageUrl;
            }

            if (options.cardImage.largeImageUrl) {
                alexaResponse.card.image['largeImageUrl'] = options.cardImage.largeImageUrl;
            }
        }
    } else if (options.cardType === 'LinkAccount') {
        alexaResponse.card = {
            type: 'LinkAccount'
        };
    } else if (options.cardType === 'AskForPermissionsConsent') {
        alexaResponse.card = {
            type: 'AskForPermissionsConsent',
            permissions: options.permissions
        };
    }

    var returnResult = {
        version: '1.0',
        response: alexaResponse
    };

    if (options.sessionAttributes) {
        returnResult.sessionAttributes = options.sessionAttributes;
    }
    return returnResult;
}

function getSSMLResponse(message) {
    if (message == null) {
        return null;
    } else {
        return {
            type: 'SSML',
            speech: `<speak> ${message} </speak>`
        };
    }
}

function clovaSetSimpleSpeechText(outputText) {
    return {
        type: 'SimpleSpeech',
        values: {
            type: 'PlainText',
            lang: 'ja',
            value: outputText,
        },
    }
}
//
// function clovaAppendSpeechText(outputText) {
//     const outputSpeech = this.response.outputSpeech
//     if (outputSpeech.type != 'SpeechList') {
//         outputSpeech.type = 'SpeechList'
//         outputSpeech.values = []
//     }
//     if (typeof(outputText) == 'string') {
//         outputSpeech.values.push({
//             type: 'PlainText',
//             lang: 'ja',
//             value: outputText,
//         })
//     } else {
//         outputSpeech.values.push(outputText)
//     }
// }