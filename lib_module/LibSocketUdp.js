/**
 * @file .
 * @date: 13. 4. 22
 * @version:
 * @author: "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright KT. All right reserved.
 * @brief 파일에 대한 간략한 설명
 */
//======================================================================================================================
var path = require('path');
var kLib = require('./LibUtil');
//======================================================================================================================
var udpList = new Array(
    ['pushsocket',4100],
    ['auth',4101],
    ['admtm',4102],
    ['pna_socket',4103],
    ['message',4104],
    ['knet',4000]
);
var myUdp = null;
var myUdpPort = 0;
//======================================================================================================================
function GetUdpPort(sock_name) {

    var nn = 0;
    var trname = "";

    if(nn>0) {
        trname = path.basename(sock_name);
    }
    else {
        nn = sock_name.lastIndexOf('\\');
        trname = (nn<0) ? sock_name : sock_name.substring(nn+1);
        nn = trname.lastIndexOf('.');
        trname = (nn<0) ? trname : trname.substring(0,nn);
    }
    trname = trname.toLowerCase();
    nn = trname.lastIndexOf('service');
    trname = (nn<0) ? trname : trname.substring(0,nn);

    for(var i in udpList) {
        if(udpList[i][0]==trname) {
            kLib.log('sock_name::'+trname+', port::'+udpList[i][1]);
            return(udpList[i][1]);
        }
    }
    kLib.clog('GetPort() sock_name::'+sock_name+', not found...');
    return(0);
}
//======================================================================================================================
function GetUdpName(port) {

    for(var i in udpList) {
        if(udpList[i][1]==port) {
//            kLib.log('sock_name::'+udpList[i][0]+', port::'+udpList[i][1]);
            return(udpList[i][0]);
        }
    }
    kLib.clog('GetName() port::'+port+', sock_name not found...');
    return("");
}
//======================================================================================================================
exports.GetPort = function (sock_name) {
    return(GetUdpPort(sock_name));
}
//======================================================================================================================
exports.GetName = function (port) {
    return(GetUdpName(port));
}
//======================================================================================================================
exports.Send = function (sock_name,json_data) {

    var buff = new Buffer(JSON.stringify(json_data));
    var port = GetUdpPort(sock_name);

    console.log('kNet.Send()  udp_name:'+sock_name+',port:'+port+', buff.length::'+buff.length);
    console.log(json_data);

    myUdp.send(buff,0,buff.length, port,'127.0.0.1', function(err, bytes) {
        kLib.log('myUdp.send('+port+')  byte::'+bytes+', err:: '+err);
    });
}
//======================================================================================================================
exports.MakeUdpSocket = function (fname, callback_func) {

    kLib.flog('>>>>>>>> '+fname);

    var udpSock = require('dgram');
    var socket = udpSock.createSocket('udp4');
    var makePort = GetUdpPort(fname);

    if(myUdp==null) {
        myUdpPort = makePort
        myUdp = udpSock;
        kLib.log('MakeUdpSocket() fname::'+fname+', port::'+makePort+","+ GetUdpName(makePort));
    }

    socket.on('listening', function() {
        var address = socket.address();
        kLib.log('server listening on ' + address.address + ':' + address.port);
    });
    socket.on('message', function(data, rinfo) {
        kLib.log('recv_message :: '+rinfo.address+':'+rinfo.port+","+ GetUdpName(rinfo.port));
        callback_func(JSON.parse(data.toString()), rinfo, makePort);
    });
    socket.bind(makePort,'127.0.0.1');

    return makePort;
}
//======================================================================================================================
