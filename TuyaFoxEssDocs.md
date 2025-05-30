---

## **1 · Why the inverter is invisible today**

| **Tuya scan filter (built into the OEM App SDK)** | **What FoxESS advertises** |
| --- | --- |
| Looks for an AD Structure that *either*   • contains **Service UUID 0xFD50** (standard BLE product)    • or contains **Service UUID 0x1910** (gateway-mode product) | FoxESS broadcasts proprietary frames on Service UUID 0x00FF, so the Tuya filter discards them |

Because the UUID does not match, the OEM app never even shows the MAC in the “nearby devices” list (Step 5 of the pairing guide ).

---

## **2 · Two compliant approaches**

| **#** | **What you change** | **Effort on inverter FW** | **Effort on OEM app** | **Trade-off** |
| --- | --- | --- | --- | --- |
| **A. Native Tuya BLE**(recommended) | Add a *second* advertising set that follows Tuya’s spec and expose Tuya GATT service | Medium – drop‐in **TuyaOS BLE SDK**:  implement tuya_adapter_bt_* functions so the SDK spits out the correct ADV + ScanRsp bytes | **None** – scan UI works out of the box | ✔ Device shows up under the default “Bluetooth” category ✔ All security, token handling, activation are inside the SDK |
| **B. MiniApp override** | Keep FoxESS frames, *add no Tuya UUID*. Write a MiniApp that scans with generic BLE API and drives the Fox protocol | Zero | High – you build:   • openBluetoothAdapter → startBluetoothDevicesDiscovery UI   • token request to cloud + Fox “0x3B” Wi-Fi frame   • manual call to device/activate once Wi-Fi is up | ✖ Device will **not** be listed in the normal add-device flow; user must open your MiniApp first |

---

## **3 · Exact changes for**

## **Approach A (Native Tuya BLE)**

### **3.1 Advertising & Scan-response**

The Tuya BLE SDK produces both packets for you when you call

tuya_adapter_bt_adv_reset(adv, scan_rsp) .

Internally the ADV payload looks like:

```
AD Type 0x16  (Service Data – 16-bit UUID)
+ 0x50 0xFD   (little-endian Service UUID)
+ 0x01        (protoVersion)
+ PID[8]
+ MAC[6]
+ extFlags…
```

*What to do*

1. Port the Tuya SDK to your nRF/ESP32/… chip.
2. In tuya_ble_device_param_t fill in product_id, device_id, auth_key, MAC etc. The SDK serialises those fields into the advertisement automatically .
3. Advertise every 200 ms (Tuya default).

### **3.2 GATT service**

Expose **Primary Service 0xFD50** with two characteristics that the SDK will register:

| **Characteristic** | **UUID** | **Property** |
| --- | --- | --- |
| Notify | 0x2B10 | Notify |
| Write No Rsp | 0x2B11 | Write |

These match the app-side activator table .

### **3.3 Pairing handshake**

No code hand-crafting is required – after you run tuya_ble_sdk_init() the callback TUYA_BLE_CB_EVT_NETWORK_INFO will hand you the Wi-Fi SSID/password and activation token .  Forward them to your existing Wi-Fi stack and start TuyaLink MQTT to finish activation.

---

## **4 · Exact changes for**

## **Approach B (MiniApp override)**

1. **OEM App** – enable the MiniApp container (App → Functions → *Tuya MiniApp*).
2. **MiniApp code**

```
// Scan any BLE peripheral – no Tuya filter applied
tt.openBluetoothAdapter();
tt.startBluetoothDevicesDiscovery({ allowDuplicatesKey: true });
tt.onBluetoothDeviceFound(d => {
    if (d.advertisData.includes('foxessSig')) showInList(d);
});
```

1. 
2. On user selection:
    - call Tuya cloud grantToken() API to get a 10 min activation token;
    - connect to the FoxESS GATT (Service 0x00FF, Characteristic 0xFF01);
    - wrap SSID/password/token into Fox frame 0x3B and write;
    - poll frame 0x3A until 04 01 01 03 = online.
3. Finally invoke iot.tuya.com/device/activate with the same token to bind the Tuya PID to the user’s home.

*Drawback* – the device never appears in the default BLE scan page, only inside your MiniApp.

---

## **5 · Decision grid**

| **Question** | **If you answer Yes** | **Recommended path** |
| --- | --- | --- |
| Can you flash the inverter’s BLE MCU? | Yes | **Approach A** – quickest for end-users |
| Is firmware locked but you control the app UI? | Yes | **Approach B** |
| Need both? | Advertise **both** UUIDs (0xFD50 for Tuya, 0x00FF for legacy) – the SDK supports multiple ADV sets. |  |

---

### **Bottom line**

*The Tuya OEM app itself is not extensible at the native scan-filter layer.*

Therefore **either** bring the FoxESS advertisement in line with Tuya’s 0xFD50/0x1910 service format (preferred), **or** bypass the filter by handling scanning and pairing inside a Tuya MiniApp.

Implement one of the two tables above and the inverter will show up—and pair—without any undocumented behaviour.

Below is the **minimum set of firmware-side changes FoxESS must make so that the inverter is listed automatically in the Tuya OEM-app Bluetooth scan page** (the page that appears after the user taps **“Add Device → Bluetooth”**).

Everything comes straight from the two Tuya documents you linked—no outside assumptions.

---

## **1. Get a Tuya licence for the inverter**

| **Item** | **Where you get it** | **Why it matters** |
| --- | --- | --- |
| **PID** (Product ID) | Create a *Custom Category → TuyaOS Link SDK* product in the IoT Platform | The PID is embedded in every BLE advertisement Tuya’s app looks for |
| **authKey, deviceId, MAC** | Click **Get licence** → download uuid & authKey | They go in the encrypted handshake after the phone connects |

*(These three strings are copied into tuya_ble_device_param_t in step 3.)*

---

## **2. Advertise the**

## **Tuya service UUID 0xFD50**

Tuya’s OEM App filters scan results by looking for this exact 16-bit UUID (or 0x1910 for gateways). If it is absent, the app discards the packet before it reaches the UI.

### **Required BLE ADV payload**

| **AD field** | **Value** | **Doc line** |
| --- | --- | --- |
| **Flags** | 0x01 06 |  |
| **Service UUID** | 0x02 03 50 FD (little-endian 0xFD50) |  |
| **Service Data** | 0x16 17 50 FD <20 bytes>  → built by the SDK from PID, MAC, protoVer… |  |

### **Required scan-response payload**

| **AD field** | **Value** | **Doc line** |
| --- | --- | --- |
| **Manufacturer data** | 0xFF 17 D0 07 <20 bytes> |  |
| **Complete local name** | Any (max 6 bytes) |  |

> Tip:
> 

> Keep your original FoxESS 0x00FF set
> 
> 
> **and**
> 

---

## **3. Expose the Tuya GATT service**

| **Service** | **Char. UUID** | **Property** | **Doc line** |
| --- | --- | --- | --- |
| **0xFD50** | 00000001-0000-1001-8001-00805F9B07D0 | *Write No Rsp* |  |
|  | 00000002-0000-1001-8001-00805F9B07D0 | *Notify* |  |
| *(Optional)* | 00000003-… | *Read* (only if you enable link-layer encryption) |  |

---

## **4. Initialise the Tuya BLE SDK**

```
static const tuya_ble_device_param_t device_param = {
    .device_id        = "tuyaxxxx...",      // from licence
    .auth_key         = "4gBM3D...",        // from licence
    .product_id       = "suq5jmo5",         // PID
    .mac_addr_string  = "DC234D12XXXX",
    .adv_local_name   = "INVTR",            // shows in scan-rsp
};

void app_init(void)
{
    tuya_ble_sdk_init(&device_param);        // mandatory
    tuya_ble_gap_advertising_adv_data_update();    // fills 0xFD50 ADV
    tuya_ble_gap_advertising_scan_rsp_data_update();
}
```

The SDK now:

- updates ADV/scan-rsp exactly in the format above,
- registers the 0xFD50 service and chars,
- parses the write packets sent by the phone and hands you the decrypted **SSID / password / 10-min token** through the callback TUYA_BLE_CB_EVT_NETWORK_INFO.

---

## **5. Finish activation after Wi-Fi is up**

1. Switch to STA mode with the received SSID & password.
2. Pass the same token to TuyaLink MQTT (/device/activate).
    
    Once the cloud replies “success”, the phone UI auto-jumps from the progress bar to the inverter’s panel—no extra app work needed.
    

---

## **6. Alternative: use**

## **0x1910**

## **instead (gateway mode)**

If the inverter will *also* act as a sub-device gateway, broadcast Service UUID **0x1910** and expose:

| **Characteristic** | **UUID** | **Property** |
| --- | --- | --- |
| Write | 0x2B11 | Write No Rsp |
| Notify | 0x2B10 | Notify |

All other steps are identical.

---

### **What the OEM App must change**

**Nothing.**

As soon as your firmware advertises either **0xFD50** (device) or **0x1910** (gateway) in the exact Tuya format, the default scan page will list the inverter automatically, because that is the only filter the app uses.

---

### **Quick checklist**

- Licence (PID + authKey + deviceId) burned to flash
- Second ADV set with UUID 0xFD50 (or 0x1910) enabled
- 0xFD50 GATT service with write/notify added
- tuya_ble_sdk_init() called on boot
- Wi-Fi join + /device/activate after token received

Complete those five bullets and the FoxESS inverter will appear in the Tuya discovery list like any native Tuya BLE product.

Below is a **Tuya-only** implementation recipe that lets your Fox ESS inverter appear in your own OEM app—even though the inverter’s advertisement does **not** follow Tuya’s default BLE UUID filter—by moving all scanning and pairing logic into a **Smart MiniApp**.

---

## **1 · Wire the MiniApp shell**

| **Step** | **Where** | **What to do** | **Tuya doc anchor** |
| --- | --- | --- | --- |
| 1-A | Tuya IoT Platform → *OEM App* → **Functions** | Turn on **Smart MiniApp container** so your app can open an embedded MiniApp. | Smart MiniApp overview |
| 1-B | MiniApp Dev Center | Create a new MiniApp project (mp.json + package.json). Select the **Bluetooth** capability when you submit for review—otherwise BLE APIs will be blocked. | MiniApp capability set list shows “Bluetooth-Adapter …” |
| 1-C | OEM code | CallThingSmartMiniAppSDK.openApp({appId:'<your-appid>'}) from your normal “Add inverter” button. | Opening a MiniApp from an OEM app is shown in the MiniApp SDK integration guide |

---

## **2 · Scan without Tuya’s filter**

Tuya’s out-of-the-box OEM scan page only shows peripherals that advertise Service UUID **0xFD50** or **0x1910**.

A MiniApp, however, can run the **raw BLE APIs** and discover *any* advertisement.

```
import {
  bluetoothCapabilityIsSupport,
  openBluetoothAdapter,
  startBluetoothDevicesDiscovery,
  onBluetoothDeviceFound,
  stopBluetoothDevicesDiscovery,
} from '@ray-js/api';      // or global `tt.*` APIs

async function startScan() {
  if (!bluetoothCapabilityIsSupport()) {
    tt.showToast({title: 'BLE not supported'});   // graceful fallback
    return;
  }
  await openBluetoothAdapter();                   // power-on if needed
  await startBluetoothDevicesDiscovery({
    allowDuplicatesKey: true,                     // keep RSSI updates
    // **do not** pass `services`, we want ALL adverts
  });

  onBluetoothDeviceFound(res => {
    res.devices.forEach(d => {
      // FoxESS uses 0x00FF service + ‘DL_’ name prefix – adapt if yours differ
      const advertHex = tt.arrayBufferToHex(d.advertisData);
      if (advertHex.includes('00ff') || d.deviceName.startsWith('DL_')) {
        addToUI(d);                               // show in your list
      }
    });
  });
}
```

*Why it works* – startBluetoothDevicesDiscovery belongs to the same family of MiniApp BLE APIs as openBluetoothAdapter and **does not apply** Tuya’s internal UUID filter .

When the user taps one of the rows you created, call stopBluetoothDevicesDiscovery() and continue with **Section 3**.

---

## **3 · Connect and exchange data**

```
import {
  connectBLEDevice,
  getBLEDeviceServices,
  getBLEDeviceCharacteristics,
  writeBLECharacteristicValue,
} from '@ray-js/api';

async function bindFox(d: BluetoothDevice, wifi, pwd, homeId) {
  await connectBLEDevice({ deviceId: d.deviceId, timeout: 10000 }); // BLE link

  // 1. find Fox service (0x00FF) & write-no-rsp characteristic (0xFF01)
  const srv = (await getBLEDeviceServices({deviceId:d.deviceId}))
                 .services.find(s => s.uuid.endsWith('00ff'));
  const ch = (await getBLEDeviceCharacteristics({
                 deviceId:d.deviceId, serviceId:srv.uuid
               })).characteristics.find(c => c.uuid.endsWith('ff01'));

  // 2. fetch a *Bluetooth-type* pairing token from Tuya Cloud
  const tokenResp = await tt.request({
      url: '/v1.0/iot-03/device-registration/token',
      method: 'POST',
      data: {
        asset_id: String(homeId),
        pairing_type: 'Bluetooth',
        time_zone_id: 'Asia/Singapore'
      }
  });                          // API spec
  const token = tokenResp.data.result.token;

  // 3. pack Wi-Fi SSID, pwd, token in FoxESS frame 0x3B
  const frame = buildFoxWifiFrame(wifi, pwd, token);
  await writeBLECharacteristicValue({
      deviceId: d.deviceId,
      serviceId: srv.uuid,
      characteristicId: ch.uuid,
      value: frame.buffer,
      needNotify: false          // write-no-response
  });

  // 4. (optional) poll Fox status until “online”...
}
```

*Key points from Tuya docs*

- connectBLEDevice creates the GATT link (classic connectBluetoothDevice is for BR/EDR)
- Cloud token must be type **Bluetooth** and is valid for 10 min

---

## **4 · Activate the device in the cloud**

FoxESS firmware, after receiving SSID/password/token, connects to your Wi-Fi and calls TuyaLink’s /device/activate flow (standard BLE-WiFi combo activation) as described in *Pair Over Bluetooth* .

Once the cloud reports **success**, your MiniApp can close itself; the OEM SDK will immediately load the panel bound to the device’s PID.

---

## **5 · UX checklist inside the MiniApp**

| **Task** | **API** | **Note** |
| --- | --- | --- |
| Enable/disable Bluetooth in real time | onBluetoothAdapterStateChange | Give a hint if the user switches BT off mid-process |
| Show RSSI for proximity feedback | advertisData parsing | display as signal bars |
| Cancel pairing | closeBLEConnection → openBluetoothAdapter | always stop discovery first |
| Handle iOS background limits | tie long operations to a foreground indicator; Apple halts BLE after ~30 s in background |  |

---

## **6 · What you did not have to change in Tuya OEM app**

*The OEM scan page stays intact*—users never reach it because they enter your MiniApp directly.

Therefore no native code or private SDK hooks are required on the Tuya side, satisfying Tuya’s review rules.

---

### **Recap**

1. **Enable the MiniApp container** in your branded Tuya app.
2. **Write a MiniApp** that performs raw BLE discovery (startBluetoothDevicesDiscovery) and connection (connectBLEDevice) to FoxESS’s custom UUID.
3. **Fetch a Bluetooth-pairing token** from /v1.0/iot-03/device-registration/token.
4. **Transmit Wi-Fi + token** over writeBLECharacteristicValue.
5. FoxESS firmware completes standard Tuya activation; the device pops into the user’s home with its normal panel.

This bypasses Tuya’s hard-coded UUID filter while staying 100 % inside official, documented MiniApp and Cloud APIs.

To integrate the FoxESS inverter's Bluetooth pairing protocol into your Tuya OEM mini app or device panel, you'll need to bridge the communication gap between the FoxESS device's custom BLE protocol and the capabilities of the Tuya mini app. Since the FoxESS device does not have a Tuya chip, the primary approach will be for your Tuya OEM app to *understand and implement the FoxESS BLE protocol*, rather than modifying the FoxESS device itself.

Here's a detailed plan of action, based solely on the provided FoxESS pairing protocol document and the general capabilities of Tuya Mini App BLE APIs (assuming standard BLE operations like scanning, connecting, and characteristic R/W are available).

### Understanding the FoxESS BLE Protocol

The FoxESS pairing protocol document outlines a clear BLE communication method:

1.  **Communication Method:** BLE
2.  **Device Naming Convention:** `DL_Device SN` (e.g., `DL_609C4E7D3C6A015`)
3.  **Service UUID:** `00FF`
4.  **Characteristic UUID:** `ff01` (supports Write, READ, INDICATE)
5.  **Data Packet Structure:**
    * **Data Frame Header:** `7E7E` (for upload from module to app) or `7F7F` (for app to module commands and module to app responses).
    * **Data Length:** `Uint16`, total length of the packet including user data.
    * **Function Code:** `0x3B` for setting Wi-Fi, `0x3A` for reading network status/SSID list.
    * **Timestamp:** 4 bytes (random `u32`, non-zero, if no Unix timestamp is available).
    * **User Data:** Varies based on Function Code.
    * **Checksum:** `CRC-16: MODBUS`. Calculated from the Function Code to the User Data (excluding the Data Frame Header), with low byte first, high byte second.
    * **Data Frame Tail:** `E7E7` (for upload from module to app) or `F7F7` (for app to module commands and module to app responses).
6.  **MTU:** `ble_mtu 517`. If data length exceeds this, it needs to be transmitted in multiple packets and reassembled on the application side.
7.  **No Handshake Required:** For network configuration, just send the instruction after connection.
8.  **Connection Termination:** The device terminates the BLE connection 15 seconds after receiving an indication if no parsable data is received.

### Integrating the FoxESS Protocol into Your Tuya Mini App

The core of the solution is to implement the FoxESS protocol's logic within your Tuya OEM mini app. This requires the Tuya Mini App's BLE APIs to provide low-level access to scanning, connecting, and reading/writing characteristic values.

#### Plan of Action for Tuya OEM App Changes:

**Step 1: Device Discovery and Scanning**

* **Objective:** Make the FoxESS device discoverable by your Tuya OEM app.
* **Action:** Your Tuya mini app will need to initiate a BLE scan using the Tuya Mini App's `startBluetoothDevicesDiscovery` API.
    * **Filtering by Service UUID:** The most robust way to discover the FoxESS device is to filter the scan by its advertised Service UUID.
        * Call `startBluetoothDevicesDiscovery` and pass `services: ['00FF']` (the FoxESS Service UUID) in the options. This will instruct the Tuya app to only discover devices advertising this specific service.
    * **Filtering by Device Name (Fallback/Alternative):** If filtering by service UUID is not sufficient or not consistently advertised, you can scan for all devices and then filter the results in the `onBluetoothDeviceFound` callback.
        * Call `startBluetoothDevicesDiscovery` without a `services` filter (or with an empty array `[]`).
        * In the `onBluetoothDeviceFound` callback, check the `name` property of discovered devices. Look for names that start with `DL_`. This allows you to identify FoxESS devices.

**Step 2: Connecting to the Device**

* **Objective:** Establish a BLE connection with the discovered FoxESS device.
* **Action:** Once the FoxESS device is identified (either by Service UUID or name), use its `deviceId` with the Tuya Mini App's `connectBLEDevice` API to establish a connection.

**Step 3: Service and Characteristic Discovery**

* **Objective:** Find the specific service and characteristic used for communication on the connected FoxESS device.
* **Action:** After a successful connection:
    1.  Use `getBLEDeviceServices` to retrieve a list of services provided by the FoxESS device. Iterate through them to find the service with UUID `00FF`.
    2.  Once the `00FF` service is found, use `getBLEDeviceCharacteristics` for that service to retrieve its characteristics. Identify the characteristic with UUID `ff01`.

**Step 4: Implementing the FoxESS Data Protocol (Custom Logic)**

This is the most critical part, as your Tuya mini app will need to handle the custom FoxESS packet format.

* **A. CRC-16 MODBUS Checksum Calculation:**
    * You will need to implement the CRC-16 MODBUS algorithm in JavaScript within your mini app.
    * This function will take a byte array (from the Function Code to the User Data) and return the 2-byte CRC checksum (low byte first, high byte second).
    * You'll use this for both sending commands (to calculate the checksum) and receiving responses (to verify the checksum).

* **B. Packet Construction for Commands (App to Datalogger):**
    * **General Structure:** All command packets will follow the format: `7F 7F` (Header) + Function Code + Timestamp + Data Length + User Data + CRC-16 Checksum + `F7 F7` (Tail).
    * **Setting Wi-Fi (Function Code `0x3B`):**
        * The User Data for this command will be structured as: `0x02` (Setting Item: Set WiFi name and password) + SSID Length (1 byte) + SSID (N bytes, ASCII) + Password Length (1 byte) + Password (N bytes, ASCII).
        * Your app will need to take the user-entered SSID and password, convert them to byte arrays, calculate their lengths, and assemble the User Data portion.
        * Then, combine with Header, Function Code, a random 4-byte Timestamp, calculate the total Data Length, compute the CRC, and add the Tail.
    * **Reading Network Status/SSID List (Function Code `0x3A`):**
        * For connection status, User Data is `0x04`.
        * For SSID list, User Data is `0x06`.
        * Construct the full packet similarly to the Wi-Fi setting command.

* **C. Sending Commands:**
    * Once a command packet (as a byte array/ArrayBuffer) is constructed, use the Tuya Mini App's `writeBLECharacteristicValue` API to send it to the `ff01` characteristic. Ensure the `value` parameter is an `ArrayBuffer`.

* **D. Packet Parsing and Response Handling (Datalogger to App):**
    * **Enable Notifications/Indications:** Use `notifyBLECharacteristicValueChange` for the `ff01` characteristic to receive data from the FoxESS device.
    * **Receive Data:** Implement an `onBLECharacteristicValueChange` listener. When data is received:
        * **Reassembly (if needed):** If the received data is part of a fragmented packet (due to MTU limits), your app needs to buffer and reassemble the fragments until a complete FoxESS data frame is received. The `Data Length` field in the FoxESS packet header will tell you the expected total length.
        * **Header/Tail Verification:** Check for `7F 7F` (or `7E7E` if the device sends it) at the beginning and `F7 F7` (or `E7E7`) at the end.
        * **Checksum Verification:** Extract the Function Code, Timestamp, Data Length, and User Data. Calculate the CRC-16 MODBUS checksum on this extracted data and compare it with the received checksum. If they don't match, the packet is corrupted.
        * **User Data Parsing:** Based on the Function Code (e.g., `0x3A` for status/SSID list), parse the User Data to extract the relevant information (e.g., connection status code, list of SSIDs with signal strength).
        * **Handle 15-second Timeout:** Be aware that the device will terminate the connection if no parsable data is received within 15 seconds after an indication. Your app should send commands or queries periodically if it needs to maintain the connection.

**Step 5: User Interface (UI) Development**

* Design a user-friendly interface within your Tuya mini app that allows:
    * Initiating a BLE scan.
    * Displaying discovered FoxESS devices (e.g., by their `DL_` name).
    * Selecting a device to connect.
    * Inputting Wi-Fi SSID and password.
    * Displaying the network connection status of the FoxESS device.
    * Displaying a list of available SSIDs from the device.

### Summary of Changes Required

* **On FoxESS Device Side:** Ideally, no changes are needed to the FoxESS device firmware, as the Tuya app will adapt to its existing protocol.
* **On Tuya OEM App Side:**
    * **BLE Scan Logic:** Modify `startBluetoothDevicesDiscovery` to include `00FF` service UUID or filter by `DL_` device name prefix.
    * **Custom Protocol Implementation:**
        * Implement `CRC-16 MODBUS` calculation.
        * Develop functions to construct FoxESS command packets (for Wi-Fi settings, status requests).
        * Develop functions to parse FoxESS response packets (for connection status, SSID lists).
        * Utilize `writeBLECharacteristicValue` to send custom packets and `notifyBLECharacteristicValueChange` to receive and process responses from the `ff01` characteristic.
        * Handle potential MTU fragmentation for larger data transfers.

By implementing the FoxESS BLE protocol's specifics within your Tuya OEM mini app, you can achieve the desired integration and bring the FoxESS inverter online via your custom application. This approach leverages the low-level BLE capabilities typically available in mini-app development environments.