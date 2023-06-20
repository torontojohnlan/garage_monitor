// import makeClient from 'grage-lib/client'
// import esp8266 from 'grage-lib/esp8266'
// import {deviceID} from "./device_id.json";


import makeClient from 'grage-lib/client.js';
import esp8266 from 'grage-lib/esp8266.js';
// import * as devices from "./device_id.json" assert{type:'json'};

// const deviceID =  devices.deviceID

const deviceID = "1C1ONGR"
console.log(deviceID)
const host =  "grage.azurewebsites.net";
const grage = makeClient(host, function onTerminate(reason) {
    console.log('[Terminated]', reason) ;
});
//esp constants
const sensorPin = esp8266.Pin.D6, controlPin = esp8266.Pin.D7;
let lastCloseTimeReported = Date.now();

grage.onOpen(() => {
    console.log('connected to server1')

    // Begin receiving data from device
    grage.connect(deviceID, function onDeviceData(data) {   // on grage connection, a data listener 'onDeviceData' is installed. This is better called "messageHandler"
        //console.trace()
        console.log('received data from device:')
        const sense = data.pinReadings[sensorPin];
        if (sense === esp8266.LogicLevel.HIGH) {
            let openTimeSpan =  (Date.now() - lastCloseTimeReported);
            console.log(`door has been open for ${openTimeSpan}`);

            if( openTimeSpan > grage.options.maxOpenTimeAllowed){
                // alert("door has been open for too long")
                console.log(`door remained open too long`);
            }
        } else {
            lastCloseTimeReported = Date.now();
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