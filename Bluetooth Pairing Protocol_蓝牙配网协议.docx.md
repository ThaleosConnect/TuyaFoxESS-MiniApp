# **Bluetooth Pairing Protocol	蓝牙配网协议**

1. ## **定义介绍**

通讯方式:BLE  
通用定义:  
采集器ble\_mtu 517  
如果发送的数据长度大于通讯双方较小MTU值，需要分多次传送，然后在应用侧组包。   
约定:  
采集器蓝牙名称：DL\_设备SN  
例：DL\_609C4E7D3C6A015  
蓝牙模块需包含一组服务通道 Service UUID:00FF  
Characteristic uuid ：ff01   
特征值支持 Write，READ,INDICATE.  
数据方向：模块=\>app     INDICATE  
数据方向：app=\>模块     Write

1. ## **Introduction**

Communication Method: BLE

General Definition:  
Datalogger ble\_mtu 517: If the length of the transmitted data exceeds the smaller MTU value between the two communication parties, it needs to be transmitted in multiple times and then grouped on the application side.

Conventions:

Bluetooth Name of the Datalogger: DL\_Device SN  
Example: DL\_609C4E7D3C6A015The Bluetooth module must include a set of service channels: Service UUID: 00FF  
Characteristic UUID: ff01  
The characteristic value supports Write, READ, and INDICATE.  
Data Direction: Module \=\> App: INDICATE; App \=\> Module: Write

![descript][image1]      	  
a) 数据帧头：表示上传数据包的起始位，设定为固定数据：7E7E。  
b) 数据长度：表示上传数据包的长度，包括用户数据；数据长度类型Uint16  
c) 功能码：表示各种功能需求和响应标志，详见各部分表  
d) 时间戳：表示当前时间，单位是秒。  
e) 用户数据：  
f) 校验：MODBUS CRC16校验，低位在前高位在后，不含数据帧头  
g) 数据帧尾：表示上传数据包的结束字符，设定为固定字符：E7E7。

a) **Data Frame Header**: Indicates the start of the uploaded data packet. Set to fixed data: 7E7E.  
b) **Data Length**: Represents the length of the uploaded data packet, including user data. Data type: **Uint16**.  
c) **Function Code**: Indicates various functional requirements and response flags. See respective tables for details.  
d) **Timestamp**: Represents the current time in seconds.  
e) **User Data**: \[No specific format provided\].  
f) **Checksum**: **MODBUS CRC16** checksum, with low byte first and high byte second. Excludes the data frame header.  
g) **Data Frame Tail**: Indicates the end of the uploaded data packet. Set to fixed character: E7E7.

### 

## **2.设置采集器**

命令帧:app==》采集器   
功能码：0X3b

### 

## **2\. Setting the Datalogger** **Command Frame**: App \==\>Datalogger **Function Code**: 0x3B

| 数据帧头 Data Frame Header | 功能码 Function Code | 时间戳 Timestamp | 数据长度 Data Length | 用户数据 User Data | 校验 Checksum | 数据帧尾 Data Frame Tail |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 7F 7F  | 0x3b | 4 bytes | 2 bytes | N bytes | 2 Bytes | F7 F7 |

用户数据：  
user data

| 序号Item | 数据项 Data Item | 数据长度 Data Length | 数据类型 Data Type | 备注 Remarks |
| :---- | :---- | :---- | :---- | :---- |
| 1 | 设置项 Setting Item | 1 1 | hex hex | 0x02：设置 WiFi 名密码，数据参照表 3B-2 0x02: Set WiFi name and password, data reference Table 3B-2 |
| 2 | 具体数据 Specific Data | N BYTE N BYTE | HEX/char HEX/char | 由设置项决定 Determined by the setting item |

 

| 序号 Item | 数据项 Data Item | 数据长度 Data Length | 数据类型 Data Type | 备注 Remarks |
| :---- | :---- | :---- | :---- | :---- |
| 1 | ssid长度 | 1 byte | HEX |   |
| 2 | ssid | N bytes | char |   |
| 3 | password长度 | 1 byte | hex |   |
| 4 | password | N bytes | char |   |

表3B-2  
Table 3B-2  
应答帧：采集器==》app   
Response Frame: Datalogger \--\> App

| 数据帧头 Data Frame Header | 功能码 Function Code | 时间戳 Timestamp | 数据长度 Data Length | 校验 Checksum | 数据帧尾 Data Frame Tail |
| :---- | :---- | :---- | :---- | :---- | :---- |
| 7F 7F  | 0x3b | 4 bytes | 0x00 0x00 | 2 Bytes | F7 F7 |

   
示例数据：  
命令帧:app==》采集器  
7F 7F 3B 11 22 33 44 00 16 02 0B 58 69 61 6F 6D 69 5F 31 34 44 43 08 31 32 33 34 35 36 37 38 D0 73 F7 F7  
说明：  
帧头 7F 7F  
功能码：3B  
时间戳：11 22 33 44   
数据长度：00 16   
数据项：02   
Ssid长度：0B  
SSID: 58 69 61 6F 6D 69 5F 31 34 44 43   (Xiaomi\_14DC)  
密码长度：08  
密码：31 32 33 34 35 36 37 38            (12345678)  
CRC:D0 73  
帧尾：F7 F7  
应答帧：采集器==》app  
7f 7f 3b 11 22 33 44 00 00 25 d4 f7 f7 

Example Data:  
Command Frame: App \==\> Datalogger

7F 7F 3B 11 22 33 44 00 16 02 0B 58 69 61 6F 6D 69 5F 31 34 44 43 08 31 32 33 34 35 36 37 38 D0 73 F7 F7    
Explanation:

Frame Header: 7F 7F (fixed start identifier).

Function Code: 3B (configures the collector, e.g., sets Wi-Fi).

Timestamp: 11 22 33 44 (4-byte UNIX timestamp in seconds).

Data Length: 00 16 (total user data length: 22 bytes).

Setting Item: 02 (indicates Wi-Fi name and password configuration, referenced in Table 3B-2).

SSID Length: 0B (11 bytes).

SSID: 58 69 61 6F 6D 69 5F 31 34 44 43 (hex to ASCII: "Xiaomi\_14DC").

Password Length: 08 (8 bytes).

Password: 31 32 33 34 35 36 37 38 (hex to ASCII: "12345678").

CRC Checksum: D0 73 (MODBUS CRC16, LSB first, excluding frame header).

Frame Tail: F7 F7 (fixed end identifier).

Response Frame: Collector \==\> App

7F 7F 3B 11 22 33 44 00 00 25 D4 F7 F7


## **3.读取网络连接状态**

命令帧:app==》采集器   
功能码：0X3a

3. ## **Read Network Connection Status**

**Command Frame**: App \==\> Datalogger  
**Function Code**: 0X3a

| 数据帧头 Data Frame Header | 功能码 Function Code | 时间戳 Timestamp | 数据长度 Data Length | 用户数据 User Data | 校验 Checksum | 数据帧尾 Data Frame Tail |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 7F 7F  | 0x3a | 4 bytes | 00 01 | 1bytes | 2 Bytes | F7 F7 |

应答帧：采集器==》app

Response Frame: Collector \==\> App

| 数据帧头 Data Frame Header | 功能码 Function Code | 时间戳 Timestamp | 数据长度 Data Length | 用户数据 User Data | 校验 Checksum | 数据帧尾 Data Frame Tail |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| 7F 7F  | 0x3a | 4 bytes | 2byte | Nbytes | 2 Bytes | F7 F7 |

   
示例数据1获取采集器连接状态：  
命令帧:app==》采集器  
7F 7F 3A 11 22 33 44 00 01 04 D4 44 F7 F7   
说明：  
帧头 7F 7F  
功能码：3A  
时间戳：11 22 33 44   
数据长度：00 16   
用户数据：04  （固定）  
CRC:D4 44  
帧尾：F7 F7  
应答帧：采集器==》app  
7F 7F 3A 11 22 33 44 00 04 04 01 01 04 EE AB F7 F7  
说明：  
帧头 7F 7F  
功能码：3A  
时间戳：11 22 33 44   
数据长度：00 04   
用户数据：04 01 01 04 （具体解析见表3a-1）  
CRC : EE AB  
帧尾：F7 F7  
 

Example Data 1: Obtain Datalogger Connection Status

Command Frame: App \==\> Collector

7F 7F 3A 11 22 33 44 00 01 04 D4 44 F7 F7  

Explanation:

Frame Header: 7F 7F (fixed start identifier).

Function Code: 3A (command to read connection status).

Timestamp: 11 22 33 44 (4-byte UNIX timestamp in seconds).

Data Length: 00 01 (user data length: 1 byte).

User Data: 04 (fixed value for connection status request).

CRC Checksum: D4 44 (MODBUS CRC16, LSB first, excluding header).

Frame Tail: F7 F7 (fixed end identifier).

Response Frame: Collector \==\> App

7F 7F 3A 11 22 33 44 00 04 04 01 01 04 EE AB F7 F7  

Explanation:

Frame Header: 7F 7F.

Function Code: 3A (matches the command function code).

Timestamp: 11 22 33 44 (same as command frame for correlation).

Data Length: 00 04 (user data length: 4 bytes).

User Data: 04 01 01 04 (specific parsing reference Table 3A-1).

CRC Checksum: EE AB.

Frame Tail: F7 F7.

| 用户数据 | 中文定义 / English Definition |
| :---- | :---- |
| 04 01 01 00 | 未接入路由 / Not connected to the router |
| 04 01 01 01 | 已连接到路由器未获取到 IP/Connected to the router but no IP obtained |
| 04 01 01 02 | 已连接到路由器获取到 IP/Connected to the router and IP obtained |
| 04 01 01 03 | 已连接到服务器 / Connected to the server |
| 04 01 01 04 | 进入透传模式 / Enter transparent transmission mode |

   
示例数据1获取周围ssid列表：  
命令帧:app==》采集器  
7F 7F 3A 11 22 33 44 00 01 06 55 85 F7 F7   
应答帧：采集器==》app  
7F 7F 3A 11 22 33 44 01 2D 06 15 06 D1 79 78 31 32 33 15 C7 58 69 61 6F 6D 69 5F 38 30 44 43 2D 32 2E 34 47 2D 65 78 74 13 C7 33 36 30 E8 A1 8C E8 BD A6 E8 AE B0 E5 BD 95 E4 BB AA 0D C4 54 50 2D 4C 69 6E 6B 5F 37 44 41 30 0D C2 4D 31 2D 31 32 30 30 5F 32 2E 34 47 0B C2 46 4F 58 2D 45 53 53 2D 52 44 0F C1 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F C0 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0C BF 58 69 61 6F 6D 69 5F 31 34 44 43 0B BF 45 53 50 5F 44 33 36 38 31 39 0B BF 46 4F 58 2D 45 53 53 2D 52 44 0F BF 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BE 46 4F 58 2D 45 53 53 2D 52 44 0B BD 46 4F 58 2D 45 53 53 2D 52 44 0F BC 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BB 46 4F 58 2D 45 53 53 2D 52 44 10 B9 46 4F 58 2D 45 53 53 2D 46 61 63 74 6F 72 79 0B B5 46 4F 58 2D 45 53 53 2D 52 44 0B B3 46 4F 58 2D 45 53 53 2D 52 44 0F B3 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F B2 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 C5 39 F7 F7  
说明：  
帧头:7F 7F   
功能码:3A   
时间戳:11 22 33 44    
数据长度: 01 2D   
数据项(查询ssid列表固定):06  
ssid数量：15    
(第一条ssid信息长度)：06   
(第一条ssid信息)：D1 79 78 31 32 33    (信号强势 \-47ssid名称:yx123)  
(第二条ssid信息长度)：15  
(第二条ssid信息)：C7 58 69 61 6F 6D 69 5F 38 30 44 43 2D 32 2E 34 47 2D 65 78 74  
13 C7 33 36 30 E8 A1 8C E8 BD A6 E8 AE B0 E5 BD 95 E4 BB AA 0D C4 54 50 2D 4C 69 6E 6B 5F 37 44 41 30 0D C2 4D 31 2D 31 32 30 30 5F 32 2E 34 47 0B C2 46 4F 58 2D 45 53 53 2D 52 44 0F C1 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F C0 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0C BF 58 69 61 6F 6D 69 5F 31 34 44 43 0B BF 45 53 50 5F 44 33 36 38 31 39 0B BF 46 4F 58 2D 45 53 53 2D 52 44 0F BF 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BE 46 4F 58 2D 45 53 53 2D 52 44 0B BD 46 4F 58 2D 45 53 53 2D 52 44 0F BC 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BB 46 4F 58 2D 45 53 53 2D 52 44 10 B9 46 4F 58 2D 45 53 53 2D 46 61 63 74 6F 72 79 0B B5 46 4F 58 2D 45 53 53 2D 52 44 0B B3 46 4F 58 2D 45 53 53 2D 52 44 0F B3 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F B2 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45   
CRC:C5 39   
帧尾：F7 F7  
Nbytes SSID信息组成：

| 1byte 信号强度 | (N-1)bytes ssid名称 |
| :---- | :---- |
| Int8 | ASCII码 |

 

Example Data 1: Obtain Surrounding SSID List

Command Frame: App \==\> Collector

7F 7F 3A 11 22 33 44 00 01 06 55 85 F7 F7  

Response Frame: Collector \==\> App

7F 7F 3A 11 22 33 44 01 2D 06 15 06 D1 79 78 31 32 33 15 C7 58 69 61 6F 6D 69 5F 38 30 44 43 2D 32 2E 34 47 2D 65 78 74 13 C7 33 36 30 E8 A1 8C E8 BD A6 E8 AE B0 E5 BD 95 E4 BB AA 0D C4 54 50 2D 4C 69 6E 6B 5F 37 44 41 30 0D C2 4D 31 2D 31 32 30 00 5F 32 2E 34 47 0B C2 46 4F 58 2D 45 53 53 2D 52 44 0F C1 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F C0 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0C BF 58 69 61 6F 6D 69 5F 31 34 44 43 0B BF 45 53 50 5F 44 33 36 38 31 39 0B BF 46 4F 58 2D 45 53 53 2D 52 44 0F BF 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BE 46 4F 58 2D 45 53 53 2D 52 44 0B BD 46 4F 58 2D 45 53 53 2D 52 44 0F BC 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BB 46 4F 58 2D 45 53 53 2D 52 44 10 B9 46 4F 58 2D 45 53 53 2D 46 61 63 74 6F 72 79 0B B5 46 4F 58 2D 45 53 53 2D 52 44 0B B3 46 4F 58 2D 45 53 53 2D 52 44 0F B3 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F B2 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 C5 39 F7 F7  

Explanation:

Frame Header: 7F 7F (fixed start identifier).

Function Code: 3A (command to query SSID list).

Timestamp: 11 22 33 44 (4-byte UNIX timestamp in seconds).

Data Length: 01 2D (total user data length: 45 bytes).

Data Item (fixed for SSID list query): 06\.

**Number of SSIDs**: 15 (indicated by the first data byte after the fixed item).  
(First SSID information length): 06  
(First SSID information): D1 79 78 31 32 33 (Signal strength: \-47, SSID name: yx123)  
(Second SSID information length): 15  
(Second SSID information)：C7 58 69 61 6F 6D 69 5F 38 30 44 43 2D 32 2E 34 47 2D 65 78 74  
13 C7 33 36 30 E8 A1 8C E8 BD A6 E8 AE B0 E5 BD 95 E4 BB AA 0D C4 54 50 2D 4C 69 6E 6B 5F 37 44 41 30 0D C2 4D 31 2D 31 32 30 30 5F 32 2E 34 47 0B C2 46 4F 58 2D 45 53 53 2D 52 44 0F C1 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F C0 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0C BF 58 69 61 6F 6D 69 5F 31 34 44 43 0B BF 45 53 50 5F 44 33 36 38 31 39 0B BF 46 4F 58 2D 45 53 53 2D 52 44 0F BF 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BE 46 4F 58 2D 45 53 53 2D 52 44 0B BD 46 4F 58 2D 45 53 53 2D 52 44 0F BC 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0B BB 46 4F 58 2D 45 53 53 2D 52 44 10 B9 46 4F 58 2D 45 53 53 2D 46 61 63 74 6F 72 79 0B B5 46 4F 58 2D 45 53 53 2D 52 44 0B B3 46 4F 58 2D 45 53 53 2D 52 44 0F B3 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45 0F B2 46 4F 58 2D 45 53 53 2D 4F 46 46 49 43 45   
CRC:C5 39   
Frame Tail：F7 F7  
Nbytes SSID information composition：

| 1 字节 / 1 byte | (N-1) 字节 /(N-1) bytes |
| :---- | :---- |
| 信号强度 Signal Strength (Int8) | SSID 名称 SSID Name (ASCII characters) |

 

4. ## **常见问题**

§ 问：什么是正确的步骤？  
   答：配网只需要关注上面一条指令即可，其他数据可忽略  
§ 问：什么是 "时间戳"？对我们来说，似乎与 Unix 时间戳无关（太短了）。  
   答：没有“时间戳”可以用随机u32 （非零）代替  
§ 问：我们需要如何解释有效载荷？我们假设 FuncCode 2A 与连接设置有某种关系。  
   答：除配网指令应答外收到的数据可忽略  
§ 尾页：在我们的转储中，我们收到了 E7E7，但根据文档，应该是 F7F7。  
   答：配网只需要关注上面一条指令即可，其他数据可忽略  
§ 问：什么才是正确的？  
   答：配网只需要关注上面一条指令即可，其他数据可忽略  
   
§ 我们还不能计算出正确的校验和。  
§ 问：我们需要把哪些数据放进去？(从头开始，FuncCode，时间戳，DataLen，用户数据？）  
   答：不包含数据帧头，从功能码到用户数据  
§ 问：我们到底需要使用什么算法？你们有参考的实现方法吗，比如用 C 语言？  
   答：CRC-16:MODBUS   
§ 问：在文档中，你们说 "低位在前，高位在后" \-\> 这里是指字节吗？如果不是，请详细解释：)  
   答：是字节  
§ 收到指示 15 秒后，设备会终止 BLE 连接。  
   答：是的，是为防止被不使用的设备长时间占用连接，15秒内收到可解析数据（如配网指令，查询指令）就不会断开。  
§ 我们假设需要完成握手。  
§ 问：如何完成？  
   答：配网不需要握手，连接成功发送配网指令即可，其他数据请忽略  
   
   
**WIFI 设置：**  
o 问：我们如何才能读出设备是否已成功连接，或者如果未成功连接，错误出在哪里？(通过 Blueetoth LE）  
  答：可以，参考状态读取状态指令  
o 问：支持哪些 Wifi 安全模式（WPA、WPA2、WPA3、WEP）？固件会自动正确选择它们吗？  
  答：出于安全考虑，不支持WEP,  
\- 问：我们无法通过 "Fox Cloud 2.0 "应用程序连接电池。这样可以吗？  
  答：电池数据通过逆变器上传。  
 

4. ## **Common Questions**

* **Question**: What is correct process?  
  **Answer**: For network configuration, just focus on the above \- mentioned instruction. Other data can be ignored.  
* **Question**: What is a "timestamp"? For us, it seems to have nothing to do with the Unix timestamp (it's too short).  
  **Answer**: If there is no "timestamp", a random u32 (non \- zero) can be used instead.  
* **Question**: How do we interpret the payload? We assume that FuncCode 2A has some relationship with the connection settings.  
  **Answer**: Ignore the data received except for the response to the network configuration instruction.  
* **Question (from the last page)**: In our dump, we received E7E7, but according to the document, it should be F7F7.  
  **Answer**: For network configuration, just focus on the above \- mentioned instruction. Other data can be ignored.  
* **Question**: What is correct after all?  
  **Answer**: For network configuration, just focus on the above \- mentioned instruction. Other data can be ignored.  
* **Question**: We haven't been able to calculate the correct checksum yet. What data do we need to put in? (From the beginning, FuncCode, timestamp, DataLen, user data?)  
  **Answer**: Exclude the data frame header, and include data from the function code to the user data.  
* **Question**: What algorithm do we actually need to use? Do you have a reference implementation, for example, in C language?  
  **Answer**: CRC \- 16: MODBUS.  
* **Question**: In the document, it says "lower byte first, higher byte second". Does this refer to bytes? If not, please explain in detail.  
  **Answer**: Yes, it refers to bytes.  
* **Question**: The device will terminate the BLE connection 15 seconds after receiving the indication. Why?  
  **Answer**: Yes, this is to prevent the connection from being occupied by unused devices for a long time. If parsable data (such as network configuration instructions, query instructions) is received within 15 seconds, the connection will not be disconnected.  
* **Question**: We assume that handshake is required. How to complete it?  
  **Answer**: Handshake is not required for network configuration. Just send the network configuration instruction after the connection is successful. Please ignore other data.

### 

**WiFi Settings**

* **Question**: How can we tell if the device has been successfully connected, or if not, where the error is? (Through Bluetooth LE)  
  **Answer**: Yes, refer to the status \- reading instruction.  
* **Question**: Which Wi \- Fi security modes are supported (WPA, WPA2, WPA3, WEP)? Will the firmware automatically select the correct one?  
  **Answer**: For security reasons, WEP is not supported.  
* **Question**: We can't connect to the battery through the "Fox Cloud 2.0" application. Is this okay?   
  **Answer**: battery is recognized via the inverter.

# 

[image1]: <data:image/png;base64,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>