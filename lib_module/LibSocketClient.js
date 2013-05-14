/**
 * @file .
 * @date: 13. 4. 19
 * @version:
 * @author: "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright KT. All right reserved.
 * @brief 파일에 대한 간략한 설명
 */

//======================================================================================================================
var kLib = require('./LibUtil');
kLib.setFname(__filename);
//======================================================================================================================
var sockIndex = 0;
var SocketPool = [];
var MaxConnect = 1;
var ConnectTryIp = '127.0.0.1';
var ConnectTryPort = 8092;
var RecvEvent = null;
var net = require('net');
// ------------------------------------------------------------
exports.ConnectServer = function (ip_addr, port_no, conn_cnt, recv_func) {
    MaxConnect = conn_cnt;
    ConnectTryIp = ip_addr;
    ConnectTryPort = port_no;
    RecvEvent = recv_func;

    kLib.flog(">> ConnectServer() :: "+ConnectTryIp + ":"+ ConnectTryPort);

    for(var i=0;i<MaxConnect;i++) {
        ConnectTryServer(ip_addr, port_no, i, recv_func);
    }
}
function ConnectServerExec(conn_cnt) {
    for(var i=0;i<conn_cnt;i++) {
        ConnectTryServer(ConnectTryIp, ConnectTryPort, MaxConnect+i, RecvEvent);
    }
    MaxConnect += conn_cnt;
}
//==============================================================================
exports.GetSocketCount = function (a) {
    return(SocketPool.length);
};
//==============================================================================
function SendServerExec(take_id, keep_obj, send_data) {
// pushClient.SendServer(client_id, json_data.body.params);

    var nn = GetSocketIndex(null,take_id);
    kLib.flog('SendServer()  nn:'+nn+', take_id['+take_id+"]  commend:"+keep_obj.header.commend);
    if(nn<0) {
        return(-1);
    }

    SocketPool[nn].json_obj = keep_obj;
    console.log(keep_obj);

    if(typeof send_data == 'object') {
        return SocketPool[nn].socket.write(JSON.stringify(send_data));
    }
    return SocketPool[nn].socket.write(send_data);
};
//==============================================================================
exports.SendServer = function (take_id, keep_obj, send_data) {

//    console.log('take_id : '+ typeof take_id+' ------------------------- ');
//    console.log(take_id);
//    console.log('keep_obj : '+ typeof keep_obj+' -------------------------');
//    console.log(keep_obj);

    if(typeof take_id=="object" && typeof keep_obj=="undefined") {
        keep_obj = take_id;
        take_id = null;
//        console.log('keep_obj : '+ typeof keep_obj+' -------------------------');
//        console.log('take_id : '+ typeof take_id+' ------------------------- ');
    }
    kLib.flog('==>> SendServer()  take_id:'+take_id+" keep_obj:"+typeof keep_obj+", cmd:"+keep_obj.header.commend);
    return SendServerExec(take_id, keep_obj, send_data);
};
//======================================================================================================================
//======================================================================================================================
function CreateSocket(take_id, json_obj, nn) {
    if(nn<0) nn =  GetSocketIndex(null,null);
    if(nn<0) {
        kLib.clog('TakeSocket() no room ...');
        // create socket , manage ...
        ConnectServerExec(2);

        nn =  GetSocketIndex(null,null);
        if(nn<0) {
            return(-1);
        }
    }
    SocketPool[nn].take_id = take_id;
    SocketPool[nn].json_obj = json_obj;
    SocketPool[nn].val = 1;
    kLib.log('.. CreateSocket()  idx:'+nn+',  take_id:'+take_id);
    return(nn);
}
//==============================================================================
function ReleaseSocket() {
    // 적당히 세션 정리를 하자 ...
}
//==============================================================================
function RemoveSocket(take_id, json_obj, nn) {
    if(nn<0) {
        // 이상한 일이 벌어진거지 ..
        kLib.clog('RemoveSocket() not found socket ...');
        return(-1);
    }

    SocketPool[nn].take_id = null;
    SocketPool[nn].json_obj = null;
    SocketPool[nn].val = 0;
    kLib.log('.. RemoveSocket()  idx:'+nn+',  take_id:'+take_id);

    ReleaseSocket();
    return(nn);
}
//==============================================================================
exports.TakeSocket = function (take_id, json_obj, on_off) {
// pushClient.TakeSocket(client_id, json_data, true);

    var nn = GetSocketIndex(null,take_id);
    kLib.flog('==>> TakeSocket()  idx:'+nn+',  take_id:'+take_id+',  on_off:'+on_off);

    if(on_off)
        return CreateSocket(take_id,json_obj,nn);

    return RemoveSocket(take_id,json_obj,nn);
};
//==============================================================================
exports.GetTakeData = function (socket,take_id) {
// pushClient.TakeSocket(client_id, json_data, true);

    var ii = GetSocketIndex(socket,take_id);
    kLib.flog('==>> GetTakeData()  idx:'+ii+',  take_id:'+take_id);

    if(ii<0) {
        kLib.clog('GetTakeData() no socket ...');
        return(null);
    }

    return  SocketPool[ii].json_obj;
};
//======================================================================================================================
//======================================================================================================================
var try_cnt = 0;
var recv_cnt = 0;
function ConnectTryServer(ip,port,idx, recv_cb) {
    try_cnt++;
    var cur_conn_cnt = SocketPool.length;
    var connTxt = 'try '+try_cnt+' ('+idx+'/'+MaxConnect+') connect to '+ ip +':'+ port;
    var socket = net.connect(port,ip);
    socket.setEncoding('utf8');

    // --------------------------------------------------------------------------------------------------
    socket.on('error', function(err) {
        if(try_cnt<5 || (try_cnt>300 && (try_cnt%300)==0))
            console.log('** ' + connTxt + ' error '+err.code + " "+err.message);
    });
    socket.on('close', function() {
        var index = GetSocketIndex(socket,null);
        SocketPool.splice(index,1);
        setTimeout(ConnectTryServer(ip,port,idx),5500+idx*377);
    });
    // --------------------------------------------------------------------------------------------------
    socket.on('connect', function() {
        var index = SocketPool.push({socket:socket, take_id:null, json_obj:null, val:0})-1;
        PrintSocketPool('connect');
//        SocketPool.push(take_id, socket, json_obj, 0);
        console.log(socket);
        kLib.flog(connTxt + ' OK index::' + index + ','+socket.remoteUser);
    });
    // --------------------------------------------------------------------------------------------------
    socket.on('data',function(data) {
        kLib.flog('>> ClientSocket.RecvFmServer data::' + data);

        var str_hdr = data.toString().substring(0,10);
        var recv_type_json = (str_hdr == '{"header":') ? true : false;

        kLib.log('recv_cnt[' + (++recv_cnt) +']  recv_type_json['+recv_type_json + '], bytesRead : '+socket.bytesRead);

        if(recv_type_json) {
            console.log('-> recv json_obj_text :'+str_hdr);
            RecvEvent(socket,JSON.parse(data));
        }
        else {
            var nn = GetSocketIndex(socket,null);
            var json_obj = SocketPool[nn].json_obj;
            json_obj.response = { data:data.toString(), code:200 };
            RecvEvent(socket, json_obj);
        }
    });
    // --------------------------------------------------------------------------------------------------
};
//======================================================================================================================
function GetSocketIndex(socket,take_id, log_on) {
    var idx= GetSocketIndexExec(socket,take_id);
    if(log_on)
        kLib.log("GetSocketIndex(socket:"+typeof socket+", take_id:"+typeof take_id+") --> idx:"+idx+"/"+SocketPool.length);
    return(idx);
}
function GetSocketIndexExec(socket,take_id) {
//    kLib.log("GetSocketIndex(socket:"+typeof socket+", take_id["+typeof take_id+"]) ==> cnt:"+SocketPool.length);
//    kLib.log("  take_id["+take_id+"]");

    if(socket==null && take_id==null) {
//        kLib.log("  socket==null && take_id==null");
        for(var i in SocketPool) {
            if(SocketPool[i].take_id == null) return(i);
        }
    }
    else if(socket) {
        for(var i in SocketPool) {
//            console.log("GetSocketIndexExec()  "+i+" : "+SocketPool[i].take_id);
            if(SocketPool[i].socket == socket) return(i);
        }
    }
    else if(take_id) {
        for(var i in SocketPool) {
//            console.log("GetSocketIndexExec() "+i+" : "+SocketPool[i].take_id+"/"+take_id);
            if(SocketPool[i].take_id == take_id) return(i);
        }
    }
    return(-1);
}
function PrintSocketPool(msg) {
    kLib.flog("=========> PrintSocketPool() "+msg+" count::"+SocketPool.length);
    for(var i in SocketPool) {
        kLib.log("  Sock["+i+"] take_id:"+SocketPool[i].take_id+", sock_id:"+SocketPool[i].socket.toString());
    }
    // console.log(SocketPool[0].socket);
    kLib.log("------------------------------------------------------------------------------");
}
exports.PrintSocketList = function (msg) {
    PrintSocketPool(msg);
}
//======================================================================================================================
