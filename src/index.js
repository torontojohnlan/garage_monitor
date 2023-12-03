"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
//#region mailer
var nodemailer = require("nodemailer");
var user = process.env.MAILUSER;
var pass = process.env.MAILPASSWORD;
var receipiant = 'johnlan@gmail.com';
var text = "nothing important";
var scriptStartTime = Date.now();
var Emailer = /** @class */ (function () {
    //   constructor() {
    //     this.transporter = nodemailer.createTransport({
    //       host: "smtp-mail.outlook.com",
    //       port: 587,
    //       auth: {
    //         user: process.env.MAILUSER,
    //         pass: process.env.MAILPASSWORD,
    //       },
    //     });
    //   }
    function Emailer(user, pass) {
        this.transporter = nodemailer.createTransport({
            service: "outlook",
            logger: true,
            debug: true,
            auth: {
                user: user,
                pass: pass,
            },
        });
        this.transporter.verify(function (error, success) {
            if (error) {
                console.log(error);
            }
            else {
                console.log('Server is ready to take our messages');
            }
        });
    }
    Emailer.prototype.sendEmail = function (mailOptions) {
        return this.transporter.sendMail(mailOptions);
    };
    Emailer.prototype.sendEmailTo = function (receipiant, subject, text, htmlBody) {
        var msg = {
            // from: process.env.GMAIL_USER,
            // to: email,
            from: process.env.MAILUSER,
            to: receipiant,
            subject: subject,
            text: text,
            html: htmlBody,
        };
        this.sendEmail(msg);
    };
    return Emailer;
}());
;
//#endregion
//#region SMS message setup
var communication_sms_1 = require("@azure/communication-sms");
var smsCnctnStr = process.env['SMScs'];
var smsClient = new communication_sms_1.SmsClient(smsCnctnStr);
var fromNumber = "+18332940667";
var SMSReicipients = process.env.SMSreceipients.split('|');
function sendSMS(msg) {
    return __awaiter(this, void 0, void 0, function () {
        var sendResults, _i, sendResults_1, sendResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, smsClient.send({
                        from: fromNumber,
                        to: SMSReicipients,
                        message: msg
                    })];
                case 1:
                    sendResults = _a.sent();
                    // Individual messages can encounter errors during sending.
                    // Use the "successful" property to verify the status.
                    for (_i = 0, sendResults_1 = sendResults; _i < sendResults_1.length; _i++) {
                        sendResult = sendResults_1[_i];
                        if (sendResult.successful) {
                            console.log("Success: ", sendResult);
                        }
                        else {
                            console.error("Something went wrong when trying to send this message: ", sendResult);
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
//sendSMS('testMsg')
//#endregion
//sendSMS("test from my toll free number")
//#region garage door stats
var client_js_1 = require("grage-lib-jl/client.js");
var esp8266 = require("grage-lib-jl/esp8266.js");
var lastCloseTimeReported = Date.now();
var lastInfoSentTime = Date.now();
var openTimeSpan = 0;
var alertTimeSpan = 0;
var garageDetails = '';
var brokenConnectionCount = 0;
//#endregion
//#region garage door processing block
var deviceID = process.env.deviceID;
//console.log(deviceID)
var host = "grage.azurewebsites.net";
var grage = (0, client_js_1.makeClient)(host, (function onTerminate(reason) {
    //sendSMS("connection to garage controller terminated");
    console.log('[Terminated]', reason);
}));
var lastAlertSentTime = Date.now() - grage.options.alertEmailInterval; //add one hour to last alert time so first alert can be sent immediately after first one hour open time
var strLastAlertSentTime = (new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" });
// showDebugMsg(`lastAlertSentTime: ${strLastAlertSentTime}`);
// garageDetails = `lastAlertSentTime: ${strLastAlertSentTime}`;
//esp constants
var sensorPin = esp8266.Pin.D6, controlPin = esp8266.Pin.D7;
grage.onOpen(function () {
    console.log('grage.onOpen being called');
    // Begin receiving data from device
    grage.connect(deviceID, function onDeviceData(data) {
        //console.trace()
        console.log('received data from device:');
        alertTimeSpan = (Date.now() - lastAlertSentTime);
        garageDetails = "\n          last close time reported : ".concat((new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" }), "\n          last alert sent on       : ").concat((new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" }), "\n          open time span           : ").concat(Math.round((openTimeSpan / 1000) / 60), " minutes\n          alert time span          : ").concat(Math.round((alertTimeSpan / 1000) / 60), " minutes\n        ");
        (0, client_js_1.showDebugMsg)(garageDetails);
        var sense = data.pinReadings[sensorPin];
        if (sense === esp8266.LogicLevel.HIGH) { // door open
            openTimeSpan = (Date.now() - lastCloseTimeReported);
            if (((Math.round((openTimeSpan / 1000) / 60)) % 5) == 0) {
                (0, client_js_1.showDebugMsg)(garageDetails);
            }
            if ((openTimeSpan > grage.options.maxOpenTimeAllowed) && (alertTimeSpan > grage.options.alertEmailInterval)) {
                // alert("door has been open for too long")
                console.log("sending alert email");
                var htmlBody = "\n                  <h1>WARNING</h1>\n                  <p>Your garage door has open since ".concat((new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" }), ".</p>\n                  <p>Last alert sent at ").concat((new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" }), ".</p>\n              ");
                var emailer = new Emailer(user, pass);
                var subject = 'Grage door has been open too long';
                emailer.sendEmailTo(receipiant, subject, text, htmlBody);
                emailer.transporter.close();
                sendSMS("\n                Your garage door has open since ".concat((new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" }), ". \n                https://grage.azurewebsites.net/apps/garage-door/app.html to close\n                "));
                lastAlertSentTime = Date.now();
                lastInfoSentTime = Date.now();
                console.log('warning email send');
            }
        }
        ;
        if (sense === esp8266.LogicLevel.LOW) { //door close
            openTimeSpan = 0;
            if ((Date.now() - lastInfoSentTime) > 24 * 60 * 60 * 1000) { //send an informational email anyway if no alert was sent for 1 day just to indicate that this app is running
                console.log("sending informational email");
                var htmlBody = "\n                <h1>INFO</h1>\n                <p>This is just an informational email to inform you that garage monitor app is running properly.</p>\n                <p>It has been running since ".concat((new Date(scriptStartTime)).toLocaleString("en-US", { timeZone: "America/Toronto" }), ".</p>\n            ");
                var subject = 'INFO: garage monitor is running';
                var emailer = new Emailer(user, pass);
                emailer.sendEmailTo(receipiant, subject, text, htmlBody);
                emailer.transporter.close();
                lastInfoSentTime = Date.now();
            }
            lastCloseTimeReported = Date.now();
            console.log('door is closed');
        }
    });
    //when device becomes alive, run initialization stuff
    //such as setting up inputs, outputs and interrupts
    grage.onAlive(deviceID, function alive() {
        console.log('device is online');
        brokenConnectionCount = 0;
        //enable input then read
        grage.send(deviceID, esp8266.pinMode(sensorPin, esp8266.PinMode.INPUT_PULLUP));
        grage.send(deviceID, esp8266.attachInterrupt(sensorPin, esp8266.InterruptMode.CHANGE));
        //enable output, make sure it is off
        grage.send(deviceID, esp8266.pinMode(controlPin, esp8266.PinMode.OUTPUT));
        grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.LOW));
    });
    //when device becomes dead, disable ui again
    grage.onDead(deviceID, function dead() {
        brokenConnectionCount++;
        if ((brokenConnectionCount % 10) == 0) {
            sendSMS("garage device offline");
            console.log('device offline');
        }
    });
});
// call this function to open/close door
function openCloseDoor() {
    //send 100ms pulse to garage door switch
    grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.HIGH));
    setTimeout(function () {
        grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.LOW));
    }, 100);
}
//#endregion
//#region set up web server
var http = require("http");
var httpServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    var pageContent = "You've reached John's garage monitor app. This indicates the monitor is running fine\n  ".concat(garageDetails);
    (0, client_js_1.showDebugMsg)("received web request, garageDetails is:");
    (0, client_js_1.showDebugMsg)(garageDetails);
    res.write(pageContent);
    res.end();
});
// httpServer.setTimeout(230*1000,() => {
//   console.log("hit server timeout limit. The timeout value of 230s is aligned with same timeout limit on Azure load balancer")
// })
var port = process.env.PORT || 3333;
httpServer.listen(port, function () {
    console.log("Server is listening on ".concat(port));
});
//#endregion
