/**
 * @file . MessageService.js
 * @date: 13. 4. 18
 * @version:
 * @author:   "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright  KT. All right reserved.
 * @brief      긴급메세지 입력을 받고 그해당 사용자들에게 메세지를 전달 하라~~
 */
//======================================================================================================================
var kLib = require('./../lib_module/LibUtil');
var ClientSocket = require('./../lib_module/LibSocket');
//======================================================================================================================
kLib.setFname(__filename);
//======================================================================================================================
var SERVER_IP = '127.0.0.1';
var SERVER_PORT = 8095;

ClientSocket.ConnectServer(SERVER_IP, SERVER_PORT, 1, RecvFromServer);
//======================================================================================================================
//======================================================================================================================
/*
 [nodadm@dmopap01 ~]$ vmstat
procs -----------memory---------- ---swap-- -----io---- --system-- -----cpu------
    r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
0  0      0 8408292 588692 1338324    0    0     1     5    4   10  0  0 100  0  0
0  0      0 8408268 588704 1338324    0    0     0    22  187  700  0  0 100  0  0

 [nodadm@dmopap01 ~]$ free
 total       used       free     shared    buffers     cached
 Mem:      12582912    4179228    8403684          0     593208    1338404
 -/+ buffers/cache:    2247616   10335296
 Swap:     31457272          0   31457272

 [nodadm@dmopap01 ~]$ netstat
 Proto Recv-Q Send-Q Local Address               Foreign Address             State
 tcp        0    232 dmopap01:ssh                10.222.111.2:iwlistener     ESTABLISHED

 [nodadm@dmopap01 ~]$ df
 Filesystem           1K-blocks      Used Available Use% Mounted on
 /dev/mapper/vg_sys-lv_root 30472188    910436  27988888   4% /
 /dev/mapper/vg_sys-lv_var  30472188    351472  28547852   2% /var
 /dev/mapper/vg_sys-lv_home 30472188   1360116  27539208   5% /home
 /dev/xvda1                   101086     42076     53791  44% /boot

 [nodadm@dmopap01 ~]$ ps -aux
 Warning: bad syntax, perhaps a bogus '-'? See /usr/share/doc/procps-3.2.7/FAQ
 USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
 root         1  0.0  0.0  10368   684 ?        Ss   May11   0:00 init [5]
 root         2  0.0  0.0      0     0 ?        S<   May11   0:00 [migration/0]
 gdm       2028  0.0  0.1 220928 16220 ?        Ss   May11   0:00 /usr/libexec/gdmgreeter
 mogadm    2630  0.0  0.0  63888  1200 ?        S    May11   0:00 /bin/sh /app/jboss/jboss-eap-5.1/jboss-as/bin/run.
 mogadm    2668  0.0  9.6 3183024 1218636 ?     Sl   May11   3:53 /app/jdk1.6.0_32/bin/java -Dprogram.name=run.sh -s
 root      4293  0.0  0.0  90152  3320 ?        Ss   11:43   0:00 sshd: nodadm [priv]
 nodadm    4323  0.0  0.0  90152  1732 ?        S    11:44   0:00 sshd: nodadm@pts/0
 oracle   19993  0.0  0.0  35032 11216 ?        S    May11   0:00 /home/oracle/emagent/core/12.1.0.2.0/perl/bin/perl
*/
function MakeAndSendToServer() {
    var json_obj = {header:"watch.js",
        cpu: "0  0      0 8408292 588692 1338324    0    0     1     5    4   10  0  0 100  0  0"
    };
    ClientSocket.SendToTcpServer(json_obj);
}
//======================================================================================================================
function RecvFromServer(socket, json_obj) {

    if(!json_obj) return;
    kLib.json_log(json_obj,"RecvFromServer() ------------------------------------.");
}
//======================================================================================================================
//======================================================================================================================
function SendAutoTest(max_cnt) {
    var cnt = 1;
    var timerId = setInterval(function() {

        MakeAndSendToServer();

        if(cnt>max_cnt) {
            clearInterval(timerId);
            return;
        }
    },5000);
}
//======================================================================================================================
var max_count = (process.argv.length<3) ? 600 : process.argv[2];
SendAutoTest(max_count);
//======================================================================================================================


