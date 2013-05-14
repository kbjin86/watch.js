/**
 * @file .
 * @date: 13. 4. 17
 * @version:
 * @author: "Ko Bongjin"<kbjin86#gmail.com>
 * @copyright KT. All right reserved.
 * @brief 파일에 대한 간략한 설명
 */

// ------------------------------------------------------------
var path = require('path');

var logFName = '$';
var logHdr = '$';
var debugOn = true;

exports.setFname = function (fname) {

    logFName = path.basename(fname);
    var nn = logFName.lastIndexOf('.');
    logFName = (nn<0) ? logFName : logFName.substring(0,nn);

//    console.log(logHdr+ '>>>>>>>> '+fname);
}

/**
 * @param   user_id, tocken
 * @return  유효한 토큰이면 TRUE
 * @author "Ko Bongjin"<kbjin86#gmail.com>
 * @brief   유효한 토큰값을 확인하여 리턴..
 */
exports.log = function (level, msg) {
    console.log(logHdr+ '-> '+msg);
}
exports.log = function (msg) {
    console.log(logHdr+ '-> '+msg);
}
exports.klog = function (msg) {
    console.log(msg);
}

exports.flog = function (msg) {
    console.log("")
    console.log(logHdr+ '===>>> '+msg);
}
exports.clog = function (msg) {
    console.log(logHdr+ '['+logFName+'] ** '+msg);
}
exports.json_log = function (data, msg) {
    console.log(logHdr+ " [[ json_log ]] "+msg);
    console.log(JSON.stringify(data));
    console.log("")
}

// ------------------------------------------------------------
exports.dlog = function (msg) {
    console.log(logHdr+ '-- '+msg);
}
exports.dlogOn = function (on_off) {
    debugOn = on_off;
}


//======================================================================================================================
var getNetworkIPs = (function () {
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

    var exec = require('child_process').exec;
    var cached;
    var command;
    var filterRE;

    switch (process.platform) {
        case 'win32':
            //case 'win64': // TODO: test
            command = 'ipconfig';
            filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
            break;
        case 'darwin':
            command = 'ifconfig';
            filterRE = /\binet\s+([^\s]+)/g;
            // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
            break;
        default:
            command = 'ifconfig';
            filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
            // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
            break;
    }

    return function (callback, bypassCache) {
        if (cached && !bypassCache) {
            callback(null, cached);
            return;
        }
        // system call
        exec(command, function (error, stdout, sterr) {
            cached = [];
            var ip;
            var matches = stdout.match(filterRE) || [];
            //if (!error) {
            for (var i = 0; i < matches.length; i++) {
                ip = matches[i].replace(filterRE, '$1')
                if (!ignoreRE.test(ip)) {
                    cached.push(ip);
                }
            }
            //}
            callback(error, cached);
        });
    };
})();
//======================================================================================================================


