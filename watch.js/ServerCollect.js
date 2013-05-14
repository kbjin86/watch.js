/**
 * @file . PushSocket.js
 * @date: 13. 4. 16
 * @version:
 * @author: "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright KT. All right reserved.
 * @brief 파일에 대한 간략한 설명
 */
//======================================================================================================================
var kLib = require('./../lib_module/LibUtil');
var SockProc = require('./../lib_module/LibSocket');
//-----------------------------------------------------------------------
kLib.setFname(__filename);
var listenPort = 8095;
//-----------------------------------------------------------------------
SockProc.ListenServer("127.0.0.1",listenPort, RecvTcpClient);
//======================================================================================================================
//======================================================================================================================
function RecvTcpClient(socket,json_obj) {

    var log_str =  ' '+socket.remoteAddress;
    kLib.flog('==>> RecvTcpClient()  socket.remoteAddr: '+log_str);
    console.log(json_obj);
}
//======================================================================================================================








