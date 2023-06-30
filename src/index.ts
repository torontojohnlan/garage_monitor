// import makeClient from 'grage-lib/client'
// import esp8266 from 'grage-lib/esp8266'
// import {deviceID} from "./device_id.json";


import makeClient from 'grage-lib/client.js';
import esp8266 from 'grage-lib/esp8266.js';

import * as nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/json-transport";

class Emailer {
   readonly transporter: nodemailer.Transporter;

//   constructor() {
//     this.transporter = nodemailer.createTransport({
//       host: "smtp-mail.outlook.com",
//       port: 587,
//       auth: {
//         user: process.env.MAILUSER,
//         pass: process.env.MAILPASSWORD,
//         // user:'lanjohn@outlook.com',
//         // pass:'hamqmmnjnpbqymex',
//       },
//     });
//   }

  constructor(user: string, pass: string) {
    this.transporter = nodemailer.createTransport({
      service: "outlook", // nodeMailer supports well known services such as outlook for which you don't have to use host/port
      logger: true,
      debug: true,
      auth: {
        user: user,
        pass: pass,
        // user:'lanjohn@outlook.com',
        // pass:'hamqmmnjnpbqymex',
      },
    });
    this.transporter.verify(function(error, success) {
      if (error) {
            console.log(error);
      } else {
            console.log('Server is ready to take our messages');
      }
    })
  }

  public sendEmail(mailOptions: MailOptions) {
    return this.transporter.sendMail(mailOptions);
  }
  public sendEmailTo(receipiant: string,subject: string, text: string, htmlBody: string) {
    let msg = {
        // from: process.env.GMAIL_USER,
        // to: email,
        from: process.env.MAILUSER,
        to:receipiant,
        subject: subject,
        text:text,
        html:htmlBody,
      } as MailOptions;
    this.sendEmail(msg);
  }
}

const deviceID = "1C1ONGR"
console.log(deviceID)
const host =  "grage.azurewebsites.net";
const grage = makeClient(host, function onTerminate(reason) {
    console.log('[Terminated]', reason) ;
});
//esp constants
const sensorPin = esp8266.Pin.D6, controlPin = esp8266.Pin.D7;
let lastCloseTimeReported = Date.now();
let lastAlertSentTime = Date.now() - grage.options.alertEmailInterval; //add one hour to last alert time so first alert can be sent immediately after first one hour open time
console.log(`lastAlertSentTime - 1 hr in ms: ${lastAlertSentTime}`);

let user = process.env.MAILUSER as string;
let pass = process.env.MAILPASSWORD as string;
// let user = 'lanjohn@outlook.com';
// let pass = 'hamqmmnjnpbqymex';

let receipiant = 'johnlan@gmail.com';
let subject = 'Grage door has been open too long';
let text = "nothing important";

grage.onOpen(() => {
    console.log('connected to server1')

 
    // Begin receiving data from device
    grage.connect(deviceID, function onDeviceData(data) {   // on grage connection, a data listener 'onDeviceData' is installed. This is better called "messageHandler"
        //console.trace()
        console.log('received data from device:')
        const sense = data.pinReadings[sensorPin];
        if (sense === esp8266.LogicLevel.HIGH) {
            let openTimeSpan =  (Date.now() - lastCloseTimeReported);
            let alertTimeSpan = (Date.now() - lastAlertSentTime);
            console.log(`alertTimeSpan in ms : ${alertTimeSpan}`);

            console.log(`
                last close time reported : ${(new Date(lastCloseTimeReported)).toLocaleString()}
                last alert sent on       : ${(new Date(lastAlertSentTime)).toLocaleString()}
                open time span           : ${Math.round((openTimeSpan/1000)/60)} minutes
                alert time span          : ${Math.round((alertTimeSpan/1000)/60)} minutes
            `);

            if( (openTimeSpan > grage.options.maxOpenTimeAllowed) && (alertTimeSpan > grage.options.alertEmailInterval)){
                // alert("door has been open for too long")
                console.log(`sending alert email`);
                let htmlBody = `
                    <h1>WARNING</h1>
                    <p>Your garage door has open since ${(new Date(lastCloseTimeReported)).toLocaleString()}.</p>
                    <p>Last alert sent at ${(new Date(lastAlertSentTime)).toLocaleString()}.</p>
                `;
                
                const emailer = new Emailer(user, pass);
                emailer.sendEmailTo(receipiant,subject,text,htmlBody);

                lastAlertSentTime = Date.now();
                console.log('warning email send')
            }
        } else {
            lastCloseTimeReported = Date.now();
            lastAlertSentTime = Date.now() - grage.options.alertEmailInterval; 
            console.log('door is closed');
        }
    });

    //when device becomes alive, run initialization stuff
    //such as setting up inputs, outputs and interrupts
    grage.onAlive(deviceID, function alive() {
        console.log('device is online')
        //enable input then read
        grage.send(deviceID, esp8266.pinMode(sensorPin, esp8266.PinMode.INPUT_PULLUP));
        grage.send(deviceID, esp8266.attachInterrupt(sensorPin, esp8266.InterruptMode.CHANGE));

        //enable output, make sure it is off
        grage.send(deviceID, esp8266.pinMode(controlPin, esp8266.PinMode.OUTPUT));
        grage.send(deviceID, esp8266.digitalWrite(controlPin, esp8266.LogicLevel.LOW));
    });

    //when device becomes dead, disable ui again
    grage.onDead(deviceID, function dead() {
        console.log('device offline')
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