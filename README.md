Flood manager

##  In progress  ..

####  homebridge accessories
```json
"accessories": [
    {
        "comment": "-------------------------  FLOOD: SENSOR  -------------------------",
        "type": "leakSensor",
        "name": "Протечка Котельная",
        "topics": {
            "getLeakDetected": "/devices/flood/controls/s_leak_floor_1"
        },
        "integerValue": "true",
        "accessory": "mqttthing"
    },
    {
        "comment": "-------------------------  FLOOD: VALVE  -------------------------",
        "type": "valve",
        "valveType": "faucet",
        "name": "Подача воды",
        "topics": {
            "getActive": "/devices/flood/controls/valve",
            "setActive": "/devices/flood/controls/valve/on",
            "getInUse": "/devices/flood/controls/valve"
        },
        "integerValue": true,
        "accessory": "mqttthing"
    }
]
```
