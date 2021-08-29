/*
特物Z|万物皆可国创
抄自 @yangtingxiao 抽奖机脚本
活动入口：
更新地址：https://raw.githubusercontent.com/asd920/Auto-jd/main/jd_superBrand.js
已支持IOS双京东账号, Node.js支持N个京东账号
脚本兼容: QuantumultX, Surge, Loon, 小火箭，JSBox, Node.js
============Quantumultx===============
[task_local]
#特物Z|万物皆可国创
30 11 * * * https://raw.githubusercontent.com/asd920/Auto-jd/main/jd_superBrand.js, tag=特物Z|万物皆可国创, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true

================Loon==============
[Script]
cron "30 11 * * *" script-path=https://raw.githubusercontent.com/asd920/Auto-jd/main/jd_superBrand.js tag=特物Z|万物皆可国创

===============Surge=================
特物Z|万物皆可国创 = type=cron,cronexp="30 11 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/asd920/Auto-jd/main/jd_superBrand.js

============小火箭=========
特物Z|万物皆可国创 = type=cron,script-path=https://raw.githubusercontent.com/asd920/Auto-jd/main/jd_superBrand.js, cronexpr="30 11 * * *", timeout=3600, enable=true

 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('特物Z|万物皆可国创');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const randomCount = $.isNode() ? 20 : 5;
const Opencardtw = $.isNode() ? (process.env.Opencardtw ? process.env.Opencardtw : false) : false;
const notify = $.isNode() ? require('./sendNotify') : '';
let merge = {};
let codeList = [];
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}

const JD_API_HOST = `https://api.m.jd.com/client.action`;

!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', {
      'open-url': 'https://bean.m.jd.com/',
    });
    return;
  }
  const signeid = 'zFayjeUTzZWJGwv2rVNWY4DNAQw';
  const signactid = 1000021;
  const signenpid = 'uK2fYitTgioETuevoY88bGEts3U';
  const signdataeid = '47E6skJcyZx7GSUFXyomLgF1FLCA';
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      $.beans = 0;
      message = '';
      $.cando = true;
      await $.totalBean();
      //   await shareCodesFormat();
      console.log(`\n******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      await getid('superBrandSecondFloorMainPage', 'secondfloor');
      if ($.cando && $.enpid) {
        await getCode('secondfloor', $.actid);
        if ($.taskList) {
          for (task of $.taskList) {
            if (task.assignmentType == 3) {
              //关注店铺
              //    console.log(task)
              await doTask('secondfloor', $.enpid, task.encryptAssignmentId, task.ext.followShop[0].itemId, 3);
            } else if (task.assignmentType == 0) {
              // 分享任务
              await doTask('secondfloor', $.enpid, task.encryptAssignmentId, null, 0);
            } else {
              if (Opencardtw) {
                //领取开卡奖励
                await doTask('secondfloor', $.enpid, task.encryptAssignmentId, task.ext.brandMemberList[0].itemId, 7);
              } else {
                console.log('默认不执行开卡任务');
              }
            }
          }
        }
        await superBrandTaskLottery();
        await $.wait(500);
        await superBrandTaskLottery();
        await $.wait(1000);
        //             await doTask("sign", signenpid, signdataeid, 1, 5)
        //     await $.wait(1000);
        //   await superBrandTaskLottery("sign", signactid, signenpid, signeid)
      }
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      console.log(`\n******开始【京东账号${$.index}】\n`);
      for (l = 0; l < codeList.length; l++) {
        console.log(`为 ${codeList[l]}助力中`);
        let code = await doTask('secondfloor', $.enpid, $.inviteenaid, codeList[l], 2);
        if (code == 108) {
          l = 9999;
          console.log('助力次数已满');
        } else if (code == 103) {
          codeList.splice(l--, 1); //任务已完成
        }
      }
    }
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    $.cookie = cookie = cookiesArr[i];
    if (cookie) {
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      console.log(`\n******开始【京东账号${$.index}】抽奖\n`);
      await superBrandTaskLottery();
      //    await superBrandTaskLottery()
      await superBrandTaskLottery();
    }
  }
})()
  .catch((e) => $.logErr(e))
  .finally(() => $.done());
//获取活动信息

function getid(functionid, source) {
  return new Promise(async (resolve) => {
    const options = taskPostUrl(functionid, `{"source":"${source}"}`);
    //  console.log(options)
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //      console.log(data)
          if (data.data && data.code === '0' && data.data.result) {
            let result = data.data.result;
            if (result.activityBaseInfo) {
              $.actid = result.activityBaseInfo.activityId;
              $.actname = result.activityBaseInfo.activityName;
              $.enpid = result.activityBaseInfo.encryptProjectId;
              console.log(`当前活动：${$.actname}  ${$.actid}`);
            }
          } else {
            console.log('获取失败');
            $.cando = false;
            resolve();
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function getCode(source, actid) {
  return new Promise(async (resolve) => {
    const options = taskPostUrl('superBrandTaskList', `{"source":"${source}","activityId":${actid},"assistInfoFlag":1}`);
    //   console.log(options)
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //  console.log(data.data.result)
          if (data && data.data && data.code === '0' && source === 'secondfloor') {
            if (data.data.result && data.data.result.taskList) {
              $.taskList = data.data.result.taskList.filter((x) => x.assignmentType == 3 || x.assignmentType == 7 || x.assignmentType == 0);
              //       console.log(data.data.result.taskList)
              let result = data.data.result.taskList.filter((x) => x.assignmentType == 2)[0];
              let encryptAssignmentId = result.encryptAssignmentId;
              let itemid = result.ext.assistTaskDetail.itemId;
              //  console.log(result)
              $.inviteenaid = result.encryptAssignmentId;
              codeList[codeList.length] = itemid;
              console.log(`获取邀请码成功 ${itemid}`);
            } else {
              console.log(data);
            }
          } else {
            //  console.log(data.data.result)
          }
          resolve(data.data.result.taskList);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function doTask(source, pid, encryptAssignmentId, id, type) {
  return new Promise(async (resolve) => {
    body = `{"source":"${source}","activityId":${$.actid},"encryptProjectId":"${pid}","encryptAssignmentId":"${encryptAssignmentId}","assignmentType":${type},"itemId":"${id}","actionType":0}`;
    if (type === 0) {
      body = `{"source":"${source}","activityId":${$.actid},"encryptProjectId":"${pid}","encryptAssignmentId":"${encryptAssignmentId}","assignmentType":${type},"completionFlag":1,"itemId":"${id}","actionType":0}`;
    }
    const options = taskPostUrl(`superBrandDoTask`, body);
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          //      console.log(data)
          data = JSON.parse(data);
          if (data && data.code === '0') {
            if (data.data.bizCode === '0') {
              console.log('任务成功啦~');
            } else {
              console.log(data.data.bizMsg);
            }
            resolve(data.data.bizCode);
          } else {
            console.log(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function superBrandTaskLottery(source = 'secondfloor', actid, enpid, signeid) {
  return new Promise(async (resolve) => {
    body = `{"source":"${source}","activityId":${$.actid}}`;
    if (source === 'sign') {
      console.log('签到抽奖中');
      //    console.log(
      body = `{"source":"sign","activityId":${actid},"encryptProjectId":"${enpid}","encryptAssignmentId":"${signeid}"}`;
    }
    //    console.log(body)
    const options = taskPostUrl('superBrandTaskLottery', body);
    //    console.log(options)
    $.post(options, async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          data = JSON.parse(data);
          //   console.log(data)
          if (data && data.code === '0') {
            if (data.data.bizCode === 'TK000') {
              let reward = data.data.result.userAwardInfo;
              if (reward && reward.beanNum) {
                console.log(`恭喜你 获得 ${reward.beanNum}京🐶`);
              } else {
                console.log(`获得 你猜获得了啥🐶`);
              }
            } else {
              console.log(data.data.bizMsg);
            }
          } else {
            console.log(data);
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve();
      }
    });
  });
}

function taskPostUrl(functionid, body) {
  const time = Date.now();
  return {
    url: `https://api.m.jd.com/api?functionId=${functionid}&appid=ProductZ4Brand&client=wh5&t=${time}&body=${encodeURIComponent(body)}`,
    body: '',
    headers: {
      Accept: 'application/json,text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'zh-cn',
      Connection: 'keep-alive',
      Cookie: cookie,
      Host: 'api.m.jd.com',
      Referer:
        'https://prodev.m.jd.com/mall/active/NrHM6Egy96gxeG4eb7vFX7fYXf3/index.html?activityId=1000007&encryptProjectId=cUNnf3E6aMLQcEQbTVxn8AyhjXb&assistEncryptAssignmentId=2jpJFvC9MBNC7Qsqrt8WzEEcVoiT&assistItemId=S5KkcRBgR8AbVIR_zwv8NcA&tttparams=GgS7lUeyJnTGF0IjoiMzMuMjUyNzYyIiwiZ0xuZyI6IjEwNy4xNjA1MDcifQ6%3D%3D&lng=107.147022&lat=33.255229&sid=e5150a3fdd017952350b4b41294b145w&un_area=27_2442_2444_31912',
      'User-Agent':
        'jdapp;android;9.4.4;10;3b78ecc3f490c7ba;network/UNKNOWN;model/M2006J10C;addressid/138543439;aid/3b78ecc3f490c7ba;oaid/7d5870c5a1696881;osVer/29;appBuild/85576;psn/3b78ecc3f490c7ba|541;psq/2;uid/3b78ecc3f490c7ba;adk/;ads/;pap/JA2015_311210|9.2.4|ANDROID 10;osv/10;pv/548.2;jdv/0|iosapp|t_335139774|appshare|CopyURL|1606277982178|1606277986;ref/com.jd.lib.personal.view.fragment.JDPersonalFragment;partner/xiaomi001;apprpd/MyJD_Main;Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36',
    },
  };
}
