"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//#region mailer
const nodemailer = require("nodemailer");
let user = process.env.MAILUSER;
let pass = process.env.MAILPASSWORD;
let receipiant = 'johnlan@gmail.com';
let text = "nothing important";
let scriptStartTime = Date.now();
let deviceConnectionTimerout;
class Emailer {
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
    constructor(user, pass) {
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
    sendEmail(mailOptions) {
        return this.transporter.sendMail(mailOptions);
    }
    sendEmailTo(receipiant, subject, text, htmlBody) {
        let msg = {
            // from: process.env.GMAIL_USER,
            // to: email,
            from: process.env.MAILUSER,
            to: receipiant,
            subject: subject,
            text: text,
            html: htmlBody,
        };
        this.sendEmail(msg);
    }
}
;
//#endregion
//#region SMS message setup
const communication_sms_1 = require("@azure/communication-sms");
const smsCnctnStr = process.env['SMScs'];
const smsClient = new communication_sms_1.SmsClient(smsCnctnStr);
const fromNumber = "+18332940667";
const SMSReicipients = process.env.SMSreceipients.split('|');
async function sendSMS(msg) {
    const sendResults = await smsClient.send({
        from: fromNumber,
        to: SMSReicipients,
        message: msg
    });
    // Individual messages can encounter errors during sending.
    // Use the "successful" property to verify the status.
    for (const sendResult of sendResults) {
        if (sendResult.successful) {
            console.log("Success: ", sendResult);
        }
        else {
            console.error("Something went wrong when trying to send this message: ", sendResult);
        }
    }
}
//sendSMS('testMsg')
//#endregion
//sendSMS("test from my toll free number")
//#region garage door stats
const client_js_1 = require("grage-lib-jl/client.js");
const esp8266 = require("grage-lib-jl/esp8266.js");
let lastCloseTimeReported = Date.now();
let lastInfoSentTime = Date.now();
let openTimeSpan = 0;
let alertTimeSpan = 0;
let garageDetails = '';
let devOfflineCount = 0;
//#endregion
//#region garage door processing block
const deviceID = process.env.deviceID;
//console.log(deviceID)
const host = "grage.azurewebsites.net";
const grage = (0, client_js_1.makeClient)(host, (function onTerminate(reason) {
    //sendSMS("connection to server socket terminated");
    // setTimeout(function() {  
    //   console.log("respawn grage client");
    //   const grage = makeClient(host,onTerminate);
    // }, 1000);
    console.trace();
    console.log('[Terminated]', reason);
}));
let lastAlertSentTime = Date.now() - grage.options.alertEmailInterval; //add one hour to last alert time so first alert can be sent immediately after first one hour open time
let strLastAlertSentTime = (new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" });
// showDebugMsg(`lastAlertSentTime: ${strLastAlertSentTime}`);
// garageDetails = `lastAlertSentTime: ${strLastAlertSentTime}`;
//esp constants
const sensorPin = esp8266.Pin.D6, controlPin = esp8266.Pin.D7;
grage.onOpen(() => {
    console.log('grage.onOpen being called');
    garageDetails = `
            Connection to server OK.
            Not yet connect to controller
            `;
    // after first open, send alert if device wasn't detected alive within certain time
    // this timer is cleared in grage.onAlive
    deviceConnectionTimerout = setInterval(function noDeviceErrorHandler() {
        garageDetails = "Attempt to connect to device timed out";
        sendSMS("Attempt to connect to device timed out. Check device status or restart server app");
    }, 30 * 1000); //30 second
    // connect to deviceID, and use onDeviceData to process data received
    grage.connect(deviceID, function onDeviceData(data) {
        //console.trace()
        alertTimeSpan = (Date.now() - lastAlertSentTime);
        garageDetails = `
          connected to controller/device

          last close time reported : ${(new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" })}
          last alert sent on       : ${(new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" })}
          open time span           : ${Math.round((openTimeSpan / 1000) / 60)} minutes
          alert time span          : ${Math.round((alertTimeSpan / 1000) / 60)} minutes
          device discnnct cnt      : ${devOfflineCount}
        `;
        (0, client_js_1.showDebugMsg)(garageDetails);
        const sense = data.pinReadings[sensorPin];
        if (sense === esp8266.LogicLevel.HIGH) { // door open
            openTimeSpan = (Date.now() - lastCloseTimeReported);
            if (((Math.round((openTimeSpan / 1000) / 60)) % 5) == 0) {
                (0, client_js_1.showDebugMsg)(garageDetails);
            }
            if ((openTimeSpan > grage.options.maxOpenTimeAllowed) && (alertTimeSpan > grage.options.alertEmailInterval)) {
                // alert("door has been open for too long")
                console.log(`sending alert email`);
                let htmlBody = `
                  <h1>WARNING</h1>
                  <p>Your garage door has open since ${(new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" })}.</p>
                  <p>Last alert sent at ${(new Date(lastAlertSentTime)).toLocaleString("en-US", { timeZone: "America/Toronto" })}.</p>
              `;
                const emailer = new Emailer(user, pass);
                let subject = 'Grage door has been open too long';
                emailer.sendEmailTo(receipiant, subject, text, htmlBody);
                emailer.transporter.close();
                sendSMS(`
                Your garage door has open since ${(new Date(lastCloseTimeReported)).toLocaleString("en-US", { timeZone: "America/Toronto" })}. 
                https://grage.azurewebsites.net/apps/garage-door/app.html to close
                `);
                lastAlertSentTime = Date.now();
                lastInfoSentTime = Date.now();
                console.log('warning email send');
            }
        }
        ;
        if (sense === esp8266.LogicLevel.LOW) { //door close
            openTimeSpan = 0;
            if ((Date.now() - lastInfoSentTime) > 24 * 60 * 60 * 1000) { //send an informational email anyway if no alert was sent for 1 day just to indicate that this app is running
                console.log(`sending informational email`);
                let htmlBody = `
                <h1>INFO</h1>
                <p>This is just an informational email to inform you that garage monitor app is running properly.</p>
                <p>It has been running since ${(new Date(scriptStartTime)).toLocaleString("en-US", { timeZone: "America/Toronto" })}.</p>
            `;
                let subject = 'INFO: garage monitor is running';
                const emailer = new Emailer(user, pass);
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
        clearInterval(deviceConnectionTimerout);
        devOfflineCount = 0;
        //enable input then read
        grage.send(deviceID, esp8266.pinMode(sensorPin, esp8266.PinMode.INPUT_PULLUP));
        grage.send(deviceID, esp8266.attachInterrupt(sensorPin, esp8266.InterruptMode.CHANGE));
        //enable output, make sure it is off
        grage.send(deviceID, esp8266.pinMode(controlPin, esp8266.PinMode.OUTPUT));
        grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.LOW));
    });
    //when device becomes dead, disable ui again
    grage.onDead(deviceID, function deadHandler() {
        devOfflineCount++;
        garageDetails = `
          connection to device dead
          onDead Count: ${devOfflineCount}
        `;
        if ((devOfflineCount % 10) == 0) { //5 min
            sendSMS("garage device offline");
            console.log('device has been offline for past 10 check points');
        }
    });
});
// call this function to open/close door
function openCloseDoor() {
    //send 100ms pulse to garage door switch
    grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.HIGH));
    setTimeout(() => {
        grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.LOW));
    }, 100);
}
//#endregion
//#region set up web server
const http = require("http");
let httpServer = http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    let pageContent = `You\'ve reached John\'s garage monitor app. This indicates the monitor is running fine
  ${garageDetails}`;
    (0, client_js_1.showDebugMsg)("received web request, garageDetails is:");
    (0, client_js_1.showDebugMsg)(garageDetails);
    res.write(pageContent);
    res.end();
});
// httpServer.setTimeout(230*1000,() => {
//   console.log("hit server timeout limit. The timeout value of 230s is aligned with same timeout limit on Azure load balancer")
// })
let port = process.env.PORT || 3333;
httpServer.listen(port, () => {
    console.log(`Server is listening on ${port}`);
});
//#endregion
//# sourceMappingURL=index.js.map