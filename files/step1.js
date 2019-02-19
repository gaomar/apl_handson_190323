const Alexa = require('ask-sdk-core');

// 1. ask persistence adapterの読み込み
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

// 2. スキルビルダーをアダプターを使用して初期化
const skillBuilder = Alexa.SkillBuilders.custom().withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
);

// スキル起動時
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'メモを保存する場合は「メモをセーブ」。メモを聞く場合は「メモをロード」と言ってください。';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// メモを保存or読み取り判別
const MainIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'MainIntent'
            && handlerInput.requestEnvelope.request.dialogState === 'STARTED';
    },
    async handle(handlerInput) {
        const intent = handlerInput.requestEnvelope.request.intent;
        const memoSlot = intent.slots.stat;
        var modeVal = '';
        
        if (memoSlot.value !== null) {
            if (memoSlot.resolutions["resolutionsPerAuthority"][0]["status"]["code"] === 'ER_SUCCESS_MATCH') {
                modeVal = memoSlot.resolutions["resolutionsPerAuthority"][0]["values"][0]["value"]["name"];
                
                if (modeVal === 'save') {
                    // メモする内容を聞きに行く
                    return handlerInput.responseBuilder.addDelegateDirective().getResponse();
                } else {
                    // S3から保存しているメモを取得
                    const attributesManager = handlerInput.attributesManager;
                    const s3Attributes = await attributesManager.getPersistentAttributes() || {};
                    const items = s3Attributes.hasOwnProperty('memoList')? s3Attributes.memoList : [];
                    var speechText = '';
                    var memoData = '';
                    
                    if (items.length > 0) {
                        items.forEach(function( value ) {
                             memoData += `「${value.memo}」`;
                        });
                        speechText = `保存されているメモは${items.length}つあります。${memoData}です。`;    
                    }
                    return handlerInput.responseBuilder
                        .speak(speechText)
                        .reprompt(speechText)
                        .getResponse();
                }
            }
        } 
        
    }
};

// メモする言葉を取得完了
const MemoCompletedHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'MainIntent'
            && handlerInput.requestEnvelope.request.dialogState === 'IN_PROGRESS';
    },
    async handle(handlerInput) {
        const intent = handlerInput.requestEnvelope.request.intent;
        const memoVal = intent.slots.any.value;
        const speechText = `「${memoVal}」とメモしたよ`;
        const uuid = getUniqueStr();
        const attributesManager = handlerInput.attributesManager;
        const s3Attributes = await attributesManager.getPersistentAttributes() || {};
        const memoList = s3Attributes.hasOwnProperty('memoList')? s3Attributes.memoList : [];
        
        let memoData = {
            "uuid": uuid,
            "memo": memoVal
        };
        memoList.push(memoData);
        
        const sendData = {
            "memoList": memoList
        }
        attributesManager.setPersistentAttributes(sendData);
        await attributesManager.savePersistentAttributes();
    
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
        
    }
};

// UUID作成
function getUniqueStr(myStrong){
    var strong = 1000;
    if (myStrong) strong = myStrong;
    return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16);
}

// ヘルプ
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'メモを保存する場合は「メモをセーブ」。メモを聞く場合は「メモをロード」と言ってください。それではどうぞ！';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// キャンセルor終了と発話された
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'バイバイ！またね！';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};

// セッション切れ
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// エラー時
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = `不明なエラーが出ました`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// 各種Handlerを登録する
exports.handler = skillBuilder
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        MainIntentHandler,
        MemoCompletedHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .lambda();
