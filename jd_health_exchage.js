/*
东东健康社区
更新时间：2021-4-22
活动入口：京东APP首页搜索 "玩一玩"即可
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===================quantumultx================
[task_local]
#东东健康社区
13 1,6,22 * * * jd_health.js, tag=东东健康社区, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
=====================Loon================
[Script]
cron "13 1,6,22 * * *" script-path=jd_health.js, tag=东东健康社区
====================Surge================
东东健康社区 = type=cron,cronexp="13 1,6,22 * * *",wake-system=1,timeout=3600,script-path=jd_health.js
============小火箭=========
东东健康社区 = type=cron,script-path=jd_health.js, cronexpr="13 1,6,22 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('东东健康社区兑换');
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
let cookiesArr = [],
  cookie = '',
  allMessage = '',
  message;
process.env.JD_HEALTH_REWARD_NAME = '20';
let reward = $.isNode() ? (process.env.JD_HEALTH_REWARD_NAME ? process.env.JD_HEALTH_REWARD_NAME : '') : $.getdata('JD_HEALTH_REWARD_NAME') ? $.getdata('JD_HEALTH_REWARD_NAME') : '';
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  console.log(`如果出现提示 ?.data. 错误，请升级nodejs版本(进入容器后，apk add nodejs-current)`);
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...$.toObj($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
const JD_API_HOST = 'https://api.m.jd.com/';
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/', { 'open-url': 'https://bean.m.jd.com/' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      message = '';
      await $.totalBean();
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
      await main();
      await showMsg();
    }
  }
  if ($.isNode() && allMessage) {
    await notify.sendNotify(`${$.name}`, `${allMessage}`);
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });

async function main() {
  try {
    $.score = 0;
    $.earn = false;
    await getTaskDetail(-1);
    if (reward) {
      await getCommodities();
    }
  } catch (e) {
    $.logErr(e);
  }
}

function showMsg() {
  return new Promise(async (resolve) => {
    message += `本次获得${$.earn}健康值，累计${$.score}健康值\n`;
    $.msg($.name, '', `京东账号${$.index} ${$.UserName}\n${message}`);
    resolve();
  });
}
function getTaskDetail(taskId = '') {
  return new Promise((resolve) => {
    $.get(taskUrl('jdhealth_getTaskDetail', { buildingId: '', taskId: taskId === -1 ? '' : taskId, channelId: 1 }), async (err, resp, data) => {
      try {
        if (jd_helpers.safeGet(data)) {
          data = $.toObj(data);
          if (taskId === -1) {
            let tmp = parseInt(parseFloat(data?.data?.result?.userScore ?? '0'));
            if (!$.earn) {
              $.score = tmp;
              $.earn = 1;
            } else {
              $.earn = tmp - $.score;
              $.score = tmp;
            }
          } else if (taskId === 6) {
            if (data?.data?.result?.taskVos) {
              console.log(`\n【京东账号${$.index}（${$.UserName}）的${$.name}好友互助码】${data?.data?.result?.taskVos[0].assistTaskDetailVo.taskToken}\n`);
              // console.log('好友助力码：' + data?.data?.result?.taskVos[0].assistTaskDetailVo.taskToken)
            }
          } else if (taskId === 22) {
            console.log(`${data?.data?.result?.taskVos[0]?.taskName}任务，完成次数：${data?.data?.result?.taskVos[0]?.times}/${data?.data?.result?.taskVos[0]?.maxTimes}`);
            if (data?.data?.result?.taskVos[0]?.times === data?.data?.result?.taskVos[0]?.maxTimes) return;
            await doTask(data?.data?.result?.taskVos[0].shoppingActivityVos[0]?.taskToken, 22, 1); //领取任务
            await $.wait(1000 * (data?.data?.result?.taskVos[0]?.waitDuration || 3));
            await doTask(data?.data?.result?.taskVos[0].shoppingActivityVos[0]?.taskToken, 22, 0); //完成任务
          } else {
            for (let vo of data?.data?.result?.taskVos.filter((vo) => vo.taskType !== 19 && vo.taskType !== 25) ?? []) {
              console.log(`${vo.taskName}任务，完成次数：${vo.times}/${vo.maxTimes}`);
              for (let i = vo.times; i < vo.maxTimes; i++) {
                console.log(`去完成${vo.taskName}任务`);
                if (vo.taskType === 13) {
                  await doTask(vo.simpleRecordInfoVo?.taskToken, vo?.taskId);
                } else if (vo.taskType === 8) {
                  await doTask(vo.productInfoVos[i]?.taskToken, vo?.taskId, 1);
                  await $.wait(1000 * 10);
                  await doTask(vo.productInfoVos[i]?.taskToken, vo?.taskId, 0);
                } else if (vo.taskType === 9) {
                  await doTask(vo.shoppingActivityVos[0]?.taskToken, vo?.taskId, 1);
                  await $.wait(1000 * 10);
                  await doTask(vo.shoppingActivityVos[0]?.taskToken, vo?.taskId, 0);
                } else if (vo.taskType === 10) {
                  await doTask(vo.threeMealInfoVos[0]?.taskToken, vo?.taskId);
                } else if (vo.taskType === 26 || vo.taskType === 3) {
                  await doTask(vo.shoppingActivityVos[0]?.taskToken, vo?.taskId);
                } else if (vo.taskType === 1) {
                  for (let key of Object.keys(vo.followShopVo)) {
                    let taskFollow = vo.followShopVo[key];
                    if (taskFollow.status !== 2) {
                      await doTask(taskFollow.taskToken, vo.taskId, 0);
                      break;
                    }
                  }
                }
                await $.wait(2000);
              }
            }
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve();
      }
    });
  });
}
async function getCommodities() {
  return new Promise(async (resolve) => {
    const options = taskUrl('jdhealth_getCommodities');
    $.post(options, async (err, resp, data) => {
      try {
        if (jd_helpers.safeGet(data)) {
          data = $.toObj(data);
          let beans = data.data.result.jBeans.filter((x) => x.status !== 1);
          if (beans.length !== 0) {
            for (let key of Object.keys(beans)) {
              let vo = beans[key];
              if (vo.title == reward && $.score >= vo.exchangePoints) {
                await $.wait(1000);
                await exchange(vo.type, vo.id);
              }
            }
          } else {
            console.log(`兑换京豆次数已达上限`);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(data);
      }
    });
  });
}
function exchange(commodityType, commodityId) {
  return new Promise((resolve) => {
    const options = taskUrl('jdhealth_exchange', { commodityType, commodityId });
    $.post(options, (err, resp, data) => {
      try {
        if (jd_helpers.safeGet(data)) {
          data = $.toObj(data);
          if (data.data.bizCode === 0 || data.data.bizMsg === 'success') {
            $.score = data.data.result.userScore;
            console.log(`兑换${data.data.result.jingBeanNum}京豆成功`);
            message += `兑换${data.data.result.jingBeanNum}京豆成功\n`;
            if ($.isNode()) {
              allMessage += `【京东账号${$.index}】 ${$.UserName}\n兑换${data.data.result.jingBeanNum}京豆成功🎉${$.index !== cookiesArr.length ? '\n\n' : ''}`;
            }
          } else {
            console.log(data.data.bizMsg);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        resolve(data);
      }
    });
  });
}
function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}?functionId=${function_id}&body=${escape(JSON.stringify(body))}&client=wh5&clientVersion=1.0.0&uuid=`,
    headers: {
      Cookie: cookie,
      origin: 'https://h5.m.jd.com',
      referer: 'https://h5.m.jd.com/',
      'accept-language': 'zh-cn',
      'accept-encoding': 'gzip, deflate, br',
      accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
    },
  };
}
