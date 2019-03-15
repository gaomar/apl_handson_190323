const Alexa = require('ask-sdk-core');

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        if (supportsDisplay(handlerInput)) {
            return MainAction(handlerInput);
        } else {
            const speechText = '申し訳ございません。このスキルは画面付きデバイスのみ対応しております。';
    
            return handlerInput.responseBuilder
                .speak(speechText)
                .getResponse();
            
        }
    }
};
function MainAction(handlerInput) {
    const S_TAKUMI = '<voice name="Takumi"><prosody rate="80%" pitch="-25%">新元号は<break time="500ms"/>「' //声質を変えるために、rateやpitchを追加
    const E_TAKUMI = '」<break time="500ms"/>であります。</prosody> </voice>'
    const myList = '万中久乾亀亨享仁保元勝化吉同和喜嘉国大天字安宝寛寿平康延建弘徳応感慶成承授政文斉昌明昭景暦正武永治泰白祚神祥禄禎福老至興衡観護貞銅長雉雲霊養'

    // 生成する文字列の長さ
    var l = 2;
    
    var cl = myList.length;
    var r = "";
    for(var i=0; i<l; i++){
      r += myList[Math.floor(Math.random()*cl)];
    }

    // 1文字目と2文字目を取得
    const text1 = r.substr(0, 1);
    const text2 = r.substr(1, 1);
    
    const speechText = S_TAKUMI + r + E_TAKUMI;
    // documentとdataをそれぞれ指定する
    return handlerInput.responseBuilder
        .speak(speechText)
        .addDirective({
            type : 'Alexa.Presentation.APL.RenderDocument',
            version: '1.0',
            token: "token",
            document: require('./apl_gengo.json'),
            datasources: 
            {
                "skilldata": {
                    "text1": text1,
                    "text2": text2
                }
            }
        })
        .withShouldEndSession(true)
        .getResponse();
    
}
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder
            .withShouldEndSession(true)
            .getResponse();
    }
};
// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = `エラーが発生しました。`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

// NextIntent
const NextPrevHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NextIntent' ||
                handlerInput.requestEnvelope.request.intent.name === 'AMAZON.PreviousIntent');
    },
    handle(handlerInput) {
        const speechText = 'このスキルでは使用しません。新元号をランダムに生成します。「アレクサ、スタート」と言ってください。では、どうぞ。';

        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

// 画面付きかどうかチェック
function supportsDisplay(handlerInput) {
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
  return hasDisplay;
}

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        NextPrevHandler,
        SessionEndedRequestHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .lambda();