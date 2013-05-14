/**
 * @file  : SocketProcess.js
 * @date  : 2013. 5. 6
 * @version : 0.5
 * @author  : "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright KT. All right reserved.
 * @brief  : ClientSocket 를 발전시켜 Client/Server 공희 TCP Socket 처리를 담당하는 모듈
 */

//======================================================================================================================
var kLib = require('./LibUtil');
var net = require('net');
//======================================================================================================================
var ClientList = [];
var MaxConnect = 1;
var RecvEvent = null;
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
    ClientList[nn].take_id = take_id;
    ClientList[nn].json_obj = json_obj;
    ClientList[nn].val = 1;
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

    ClientList[nn].take_id = null;
    ClientList[nn].json_obj = null;
    ClientList[nn].val = 0;
    kLib.log('.. RemoveSocket()  idx:'+nn+',  take_id:'+take_id);

    ReleaseSocket();
    return(nn);
}
//======================================================================================================================
//======================================================================================================================
exports.TakeSocket = function (take_id, json_obj, on_off) {
    var nn = GetSocketIndex(null,take_id);
    kLib.flog('==>> TakeSocket()  idx:'+nn+',  take_id:'+take_id+',  on_off:'+on_off);

    if(on_off)
        return CreateSocket(take_id,json_obj,nn);

    return RemoveSocket(take_id,json_obj,nn);
};
//==============================================================================
function GetTakeDataExec(socket,take_id) {
    var ii = GetSocketIndex(socket,take_id);
    kLib.flog('==>> GetTakeData()  idx:'+ii+',  take_id:'+take_id);

    if(ii<0) {
        kLib.clog('GetTakeData() no socket ...');
        return(null);
    }

    return  ClientList[ii].json_obj;
};
//==============================================================================
exports.GetTakeData = function (socket,take_id) {
    return GetTakeDataExec(socket,take_id);
};
//======================================================================================================================
//======================================================================================================================
var ServerList = [];
function GetServerSocketExec(remote_addr) {

    for(var i in ServerList) {
        if(ServerList[i].remoteAddress == remote_addr) return(i);
    }
    kLib.clog('GetServerSocketExec('+remote_addr+') not found');
    return(-1);
}
//==============================================================================
exports.GetServerSocket = function (id) {
    var idx = GetServerSocketExec(id);
    if(idx<0) return(null);

    return(ServerList[idx]);
}
//==============================================================================
exports.GetSocketCount = function (a) {
    return(ClientList.length);
};
//======================================================================================================================
function  SizeString(num) {
    var form = "00000";
    var str_num = num.toString();
    var num_len = str_num.length;
    var form_len = form.length;
    var result = str_num;

    if(form_len > num_len)
        result = form.substring(0,form_len-num_len) + str_num;

//    kLib.log("form["+form+"] num["+str_num+"]  "+form_len+"/"+num_len+" -> ["+result+"]");
    return "size:"+result;
}
//======================================================================================================================
//======================================================================================================================
function SendTcpSocketExec(socket, send_data) {
    var buff = send_data;
    if(typeof send_data == 'object') {
        buff = JSON.stringify(send_data);
        buff = SizeString(buff.length) + buff;
    }
    var res = socket.write(buff);

    kLib.log('socket write() buff:'+buff);
    kLib.log('socket write() buff:'+buff.length +'/ res = '+ res +", write : "+ socket.bytesWritten);
    return res;
}
exports.SendTcpSocket = function (socket, data) {
    return SendTcpSocketExec(socket, data);
}
exports.SendTcpAllSocket = function (send_data) {
    var buff = send_data;
    if(typeof send_data == 'object') {
        buff = JSON.stringify(send_data);
        buff = SizeString(buff.length) + buff;
    }

    for(var i in ServerList) {
        var res = ServerList[i].write(buff);
        kLib.clog('SendTcpAllSocket('+ServerList[i].remote_addr+') res : '+res);
    }
}
//======================================================================================================================
exports.SendTcpTakeSocket = function (take_id, keep_obj, send_data) {

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

    var nn = GetSocketIndex(null,take_id);
    kLib.log('SendServerExec()  nn:'+nn+', take_id['+take_id+"]  commend:"+keep_obj.header.commend);
    if(nn<0) {
        return(-1);
    }

    ClientList[nn].json_obj = keep_obj;
    return SendTcpSocketExec(ClientList[nn].socket, send_data);
};
//======================================================================================================================
exports.SendToTcpServer = function (send_data) {
    return SendTcpSocketExec(ClientList[0].socket, send_data);
};
//======================================================================================================================
//======================================================================================================================
function RecvEventTcpSocket(socket, data, recv_func) {

    var recv_data = data.toString();
    kLib.log('-->> recv_data['+recv_data.length+']  recv_10_byte['+recv_data.substring(0,10) + '], bytesRead : '+socket.bytesRead);

    for(var i=0; recv_data.length>0; i++) {
        var one_mesg = recv_data;
        if (one_mesg.substring(0,5) == 'size:') {
            var one_size = Number(one_mesg.substring(6,10));
            one_mesg = recv_data.substring(10,one_size+10);
            recv_data =  recv_data.substring(10+one_size);
        }
        else recv_data = "";

        var json_obj = null;
        var json_type = (one_mesg.substring(0,10) == '{"header":');
        if(json_type) {
            json_obj = JSON.parse(one_mesg);
        }
        else {
            // 일반소켓에서 메세지를 받는 경우
            json_obj = GetTakeDataExec(socket,null);
            if(json_obj)
                json_obj.response = { code:200, data:one_mesg };
        }
        if(i>0) {
            kLib.log('-------------------------------------------------------------------------');
            kLib.log('recv_cnt['+i+']  recv_10_byte['+recv_data.substring(0,10) + '], bytesRead : '+socket.bytesRead);
            kLib.log('one_mesg : '+one_mesg);
        }

        recv_func(socket, json_obj);
    }
}
exports.RecvTcpSocket = function (socket, data, recv_func) {
    RecvEventTcpSocket(socket, data, recv_func);
}
//======================================================================================================================
//======================================================================================================================
function ListenServerExec(ip,port,recv_func) {

    var server = net.createServer(function(socket) {

        ServerList.push(socket);
        kLib.flog('>> new connection['+ServerList.length+"] "+ socket.remoteAddress+":"+socket.remotePort);
        //    console.log(socket);

        socket.on('close', function() {
            var idx = ServerList.indexOf(socket);
            ServerList.splice(idx,1);
            kLib.clog('-> close socket index::'+idx+'/'+ServerList.length);
        });
        socket.on('data', function(data) {
            kLib.flog("==>> Server socket recv-msg ["+data.length+"] data_type:"+typeof data);
            RecvEventTcpSocket(socket,data,recv_func);
        });
    }).listen(port);
}
exports.ListenServer = function (ip,port, recv_func) {
    ListenServerExec(ip,port,recv_func);
}
//======================================================================================================================
/*
function ConnectTcpServer(ip,port,idx,recv_func) {
    var socket = net.connect(port,ip, function() { //'connect' listener
        AddClientList(socket, null, null,0);
        console.log('client connected');
    });
    socket.on('data', function(data) {
        kLib.flog("-->> Client socket recv-msg ["+data.length+"] data_type:"+typeof data);
        RecvEventTcpSocket(socket,data,recv_func);
    });
    socket.on('end', function() {
        console.log('client disconnected');
        RemoveClientList(socket);
    });
}
*/
exports.ConnectServer = function (ip_addr, port_no, conn_cnt, recv_func) {
//    for(var i=0;i<conn_cnt;i++) {
//        ConnectTcpServer(ip_addr, port_no, 0, recv_func);
//    }
    for(var i=0;i<conn_cnt;i++) {
        ConnectServerExec(ip_addr, port_no, 0, recv_func);
    }
}
//======================================================================================================================
//======================================================================================================================
var try_cnt = 0;
var recv_cnt = 0;
function ConnectServerExec(ip,port,idx, recv_func) {
    try_cnt++;
    var cur_conn_cnt = ClientList.length;
    var connTxt = 'try '+try_cnt+' ('+idx+'/'+MaxConnect+') connect to '+ ip +':'+ port;
    var socket = net.connect(port,ip);
    socket.setEncoding('utf8');
    // --------------------------------------------------------------------------------------------------
    socket.on('error', function(err) {
        if(try_cnt<5 || (try_cnt>300 && (try_cnt%300)==0))
            kLib.clog('** ' + connTxt + ' error '+err.code + " "+err.message);
    });
    socket.on('close', function() {
        RemoveClientList(socket);
        setTimeout(ConnectServerExec(ip,port,idx,recv_func),1000);
    });
    // --------------------------------------------------------------------------------------------------
    socket.on('connect', function() {
        AddClientList(socket, null, null,0);
        kLib.flog(connTxt + ' OK  socket_count::' + ClientList.length + ','+socket.remoteUser);
    });
    // --------------------------------------------------------------------------------------------------
    socket.on('data',function(data) {
        kLib.flog('>> ClientSocket.RecvEventTcpSocket  socket on');
        kLib.klog(data.toString());
        RecvEventTcpSocket(socket,data,recv_func);
    });
    // --------------------------------------------------------------------------------------------------
};
//======================================================================================================================
function AddClientList(socket, take_id, json_obj, val) {
    ClientList.push({socket:socket, take_id:take_id, json_obj:json_obj, val:val});

    PrintClientList('connect');
//    console.log(socket);
}
function RemoveClientList(socket) {
    for(var i in ClientList) {
//            console.log("GetSocketIndexExec()  "+i+" : "+ClientList[i].take_id);
        if(ClientList[i].socket == socket) {
            ClientList.splice(i,1);
            return(true);
        }
    }
    return(false)
}
//======================================================================================================================
//======================================================================================================================
function GetSocketIndex(socket,take_id, log_on) {
    var idx= GetSocketIndexExec(socket,take_id);
    if(log_on)
        kLib.log("GetSocketIndex(socket:"+typeof socket+", take_id:"+typeof take_id+") --> idx:"+idx+"/"+ClientList.length);
    return(idx);
}
function GetSocketIndexExec(socket,take_id) {
//    kLib.log("GetSocketIndex(socket:"+typeof socket+", take_id["+typeof take_id+"]) ==> cnt:"+ClientList.length);
//    kLib.log("  take_id["+take_id+"]");

    if(socket==null && take_id==null) {
//        kLib.log("  socket==null && take_id==null");
        for(var i in ClientList) {
            if(ClientList[i].take_id == null) return(i);
        }
    }
    else if(socket) {
        for(var i in ClientList) {
//            console.log("GetSocketIndexExec()  "+i+" : "+ClientList[i].take_id);
            if(ClientList[i].socket == socket) return(i);
        }
    }
    else if(take_id) {
        for(var i in ClientList) {
//            console.log("GetSocketIndexExec() "+i+" : "+ClientList[i].take_id+"/"+take_id);
            if(ClientList[i].take_id == take_id) return(i);
        }
    }
    return(-1);
}
//======================================================================================================================
function PrintClientList(msg) {
    kLib.flog("=========> PrintClientList() "+msg+" count::"+ClientList.length);
    for(var i in ClientList) {
        kLib.log("  Sock["+i+"] take_id:"+ClientList[i].take_id+", sock_id:"+ClientList[i].socket.toString());
    }
    // console.log(ClientList[0].socket);
    kLib.log("------------------------------------------------------------------------------");
}
exports.PrintSocketList = function (msg) {
    PrintClientList(msg);
}
//======================================================================================================================
