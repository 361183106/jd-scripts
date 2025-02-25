/*
众筹许愿池
活动入口：京东-京东众筹-众筹许愿池
脚本兼容: QuantumultX, Surge, Loon, JSBox, Node.js
===============Quantumultx===============
[task_local]
#众筹许愿池
40 0,2 * * * https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_wish.js, tag=众筹许愿池, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
================Loon==============
[Script]
cron "40 0,2 * * *" script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_wish.js,tag=众筹许愿池
===============Surge=================
众筹许愿池 = type=cron,cronexp="40 0,2 * * *",wake-system=1,timeout=3600,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_wish.js
============小火箭=========
众筹许愿池 = type=cron,script-path=https://raw.githubusercontent.com/Aaron-lv/sync/jd_scripts/jd_wish.js, cronexpr="40 0,2 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('众筹许愿池');
const notify = $.isNode() ? require('./sendNotify') : '';
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
let message = '',
  allMessage = '';
//IOS等用户直接用NobyDa的jd cookie
let cookiesArr = [],
  cookie = '';
const JD_API_HOST = 'https://api.m.jd.com/client.action';
let appIdArr = ['1FFVQyqw', '1GVFUx6g', '1E1xZy6s'];
let appNameArr = ['1111点心动', 'JOY年尾之旅', 'PLUS生活特权'];
let appId, appName;
$.shareCode = [
  {
    appId: '1FFVQyqw',
    code: 'T0225KkcRRcd_AbUJB2nk_YCcADjRXlq-7zx55awQ',
  },
];
if ($.isNode()) {
  Object.keys(jdCookieNode).forEach((item) => {
    cookiesArr.push(jdCookieNode[item]);
  });
  if (process.env.JD_DEBUG && process.env.JD_DEBUG === 'false') console.log = () => {};
} else {
  cookiesArr = [$.getdata('CookieJD'), $.getdata('CookieJD2'), ...jd_helpers.jsonParse($.getdata('CookiesJD') || '[]').map((item) => item.cookie)].filter((item) => !!item);
}
!(async () => {
  if (!cookiesArr[0]) {
    $.msg($.name, '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', { 'open-url': 'https://bean.m.jd.com/bean/signIndex.action' });
    return;
  }
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      $.cookie = cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      $.index = i + 1;
      $.isLogin = true;
      $.nickName = '';
      message = '';
      await $.totalBean();
      console.log(`\n*******开始【京东账号${$.index}】${$.nickName || $.UserName}*********\n`);
      if (!$.isLogin) {
        $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
          'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
        });

        if ($.isNode()) {
          await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
        }
        continue;
      }
      for (let j = 0; j < appIdArr.length; j++) {
        appId = appIdArr[j];
        appName = appNameArr[j];
        console.log(`\n开始第${j + 1}个活动：${appName}\n`);
        await jd_wish();
      }
    }
  }
  if (allMessage) {
    if ($.isNode()) await notify.sendNotify($.name, allMessage);
    $.msg($.name, '', allMessage);
  }
  let res = await getAuthorShareCode('https://raw.githubusercontent.com/Aaron-lv/updateTeam/master/shareCodes/wish.json');
  if (!res) {
    $.http
      .get({ url: 'https://purge.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/wish.json' })
      .then((resp) => {})
      .catch((e) => console.log('刷新CDN异常', e));
    await $.wait(1000);
    res = await getAuthorShareCode('https://cdn.jsdelivr.net/gh/Aaron-lv/updateTeam@master/shareCodes/wish.json');
  }
  $.shareCode = [...$.shareCode, ...(res || [])];
  for (let i = 0; i < cookiesArr.length; i++) {
    if (cookiesArr[i]) {
      cookie = cookiesArr[i];
      $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
      console.log(`开始内部助力\n`);
      for (let v = 0; v < appIdArr.length; v++) {
        $.canHelp = true;
        appId = appIdArr[v];
        appName = appNameArr[v];
        console.log(`开始助力第${v + 1}个活动：${appName}\n`);
        for (let j = 0; j < $.shareCode.length && $.canHelp; j++) {
          if ($.shareCode[j].appId === appId) {
            console.log(`${$.UserName} 去助力 ${$.shareCode[j].use} 的助力码 ${$.shareCode[j].code}`);
            if ($.UserName == $.shareCode[j].use) {
              console.log(`不能助力自己\n`);
              continue;
            }
            $.delcode = false;
            await harmony_collectScore({ appId: appId, taskToken: $.shareCode[j].code, actionType: '0', taskId: '6' });
            await $.wait(2000);
            if ($.delcode) {
              $.shareCode.splice(j, 1);
              j--;
              continue;
            }
          }
        }
      }
    }
  }
})()
  .catch((e) => {
    $.log('', `❌ ${$.name}, 失败! 原因: ${e}!`, '');
  })
  .finally(() => {
    $.done();
  });
async function jd_wish() {
  try {
    await healthyDay_getHomeData();
    await $.wait(2000);

    let getHomeDataRes = (await healthyDay_getHomeData(false)).data.result.userInfo;
    let forNum = Math.floor(getHomeDataRes.userScore / getHomeDataRes.scorePerLottery);
    await $.wait(2000);

    if (forNum === 0) {
      console.log(`没有抽奖机会\n`);
    } else {
      console.log(`可以抽奖${forNum}次，去抽奖\n`);
    }

    $.canLottery = true;
    for (let j = 0; j < forNum && $.canLottery; j++) {
      await interact_template_getLotteryResult();
      await $.wait(2000);
    }
    if (message) allMessage += `京东账号${$.index} ${$.nickName || $.UserName}\n${appName}\n${message}${$.index !== cookiesArr.length ? '\n\n' : ''}`;
  } catch (e) {
    $.logErr(e);
  }
}

async function healthyDay_getHomeData(type = true) {
  return new Promise(async (resolve) => {
    $.post(taskUrl('healthyDay_getHomeData', { appId: appId, taskToken: '', channelId: 1 }), async (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getHomeData API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (type) {
              for (let key of Object.keys(data.data.result.taskVos).reverse()) {
                let vo = data.data.result.taskVos[key];
                if (vo.status !== 2 && vo.status !== 0) {
                  if (vo.taskType === 13 || vo.taskType === 12) {
                    console.log(`签到`);
                    await harmony_collectScore({ appId: appId, taskToken: vo.simpleRecordInfoVo.taskToken, taskId: vo.taskId, actionType: '0' }, vo.taskType);
                  } else if (vo.taskType === 1) {
                    $.complete = false;
                    for (let key of Object.keys(vo.followShopVo)) {
                      let followShopVo = vo.followShopVo[key];
                      if (followShopVo.status !== 2) {
                        console.log(`【${followShopVo.shopName}】${vo.subTitleName}`);
                        await harmony_collectScore({ appId: appId, taskToken: followShopVo.taskToken, taskId: vo.taskId, actionType: '0' });
                        if ($.complete) break;
                      }
                    }
                  } else if (vo.taskType === 8) {
                    $.complete = false;
                    for (let key of Object.keys(vo.productInfoVos)) {
                      let productInfoVos = vo.productInfoVos[key];
                      if (productInfoVos.status !== 2) {
                        console.log(`【${productInfoVos.skuName}】${vo.subTitleName}`);
                        await harmony_collectScore({ appId: appId, taskToken: productInfoVos.taskToken, taskId: vo.taskId, actionType: '1' });
                        await $.wait(vo.waitDuration * 1000);
                        await harmony_collectScore({ appId: appId, taskToken: productInfoVos.taskToken, taskId: vo.taskId, actionType: '0' });
                        if ($.complete) break;
                      }
                    }
                  } else if (vo.taskType === 9 || vo.taskType === 26) {
                    $.complete = false;
                    for (let key of Object.keys(vo.shoppingActivityVos)) {
                      let shoppingActivityVos = vo.shoppingActivityVos[key];
                      if (shoppingActivityVos.status !== 2) {
                        console.log(`【${shoppingActivityVos.title}】${vo.subTitleName}`);
                        if (vo.taskType === 9) {
                          await harmony_collectScore({ appId: appId, taskToken: shoppingActivityVos.taskToken, taskId: vo.taskId, actionType: '1' });
                          await $.wait(vo.waitDuration * 1000);
                        }
                        await harmony_collectScore({ appId: appId, taskToken: shoppingActivityVos.taskToken, taskId: vo.taskId, actionType: '0' });
                        if ($.complete) break;
                      }
                    }
                  } else if (vo.taskType === 14) {
                    console.log(`【京东账号${$.index}（${$.UserName}）的${appName}好友互助码】${vo.assistTaskDetailVo.taskToken}\n`);
                    if (vo.times !== vo.maxTimes) {
                      $.shareCode.push({
                        code: vo.assistTaskDetailVo.taskToken,
                        appId: appId,
                        use: $.UserName,
                      });
                    }
                  }
                } else {
                  console.log(`【${vo.taskName}】已完成\n`);
                }
              }
            }
          }
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
function harmony_collectScore(body = {}, taskType = '') {
  return new Promise((resolve) => {
    $.post(taskUrl('harmony_collectScore', body), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} collectScore API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            if (data && data.data && data.data.bizCode === 0) {
              if (taskType === 13) {
                console.log(`签到成功：获得${data.data.result.score}金币\n`);
              } else if (body.taskId == 6) {
                console.log(`助力成功：您的好友获得${data.data.result.score}金币\n`);
              } else {
                console.log(`完成任务：获得${data.data.result.score}金币\n`);
              }
            } else {
              if (taskType === 13) {
                console.log(`签到失败：${data.data.bizMsg}\n`);
              } else if (body.taskId == 6) {
                console.log(`助力失败：${data.data.bizMsg || data.msg}\n`);
                if (data.code === -30001 || (data.data && data.data.bizCode === 108)) $.canHelp = false;
                if (data.data.bizCode === 103) $.delcode = true;
              } else {
                console.log(body.actionType === '0' ? `完成任务失败：${data.data.bizMsg}\n` : data.data.bizMsg);
                if (data.data.bizMsg === '任务已完成') $.complete = true;
              }
            }
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
function interact_template_getLotteryResult() {
  return new Promise((resolve) => {
    $.post(taskUrl('interact_template_getLotteryResult', { appId: appId }), (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`);
          console.log(`${$.name} getLotteryResul API请求失败，请检查网路重试`);
        } else {
          if (jd_helpers.safeGet(data)) {
            data = JSON.parse(data);
            let userAwardsCacheDto = data && data.data && data.data.result && data.data.result.userAwardsCacheDto;
            if (userAwardsCacheDto) {
              if (userAwardsCacheDto.type === 2) {
                console.log(`抽中：${userAwardsCacheDto.jBeanAwardVo.quantity}${userAwardsCacheDto.jBeanAwardVo.ext || `京豆`}`);
              } else if (userAwardsCacheDto.type === 0) {
                console.log(`很遗憾未中奖~`);
              } else if (userAwardsCacheDto.type === 1) {
                console.log(
                  `抽中：${userAwardsCacheDto.couponVo.prizeName}，金额${userAwardsCacheDto.couponVo.usageThreshold}-${userAwardsCacheDto.couponVo.quota}，使用时间${userAwardsCacheDto.couponVo.useTimeRange}`
                );
              } else {
                console.log(`抽中：${JSON.stringify(data)}`);
                message += `抽中：${JSON.stringify(data)}\n`;
              }
            } else {
              $.canLottery = false;
              console.log(`此活动已黑，无法抽奖\n`);
            }
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

function taskUrl(function_id, body = {}) {
  return {
    url: `${JD_API_HOST}`,
    body: `functionId=${function_id}&body=${JSON.stringify(body)}&client=wh5&clientVersion=1.0.0`,
    headers: {
      Host: 'api.m.jd.com',
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'https://h5.m.jd.com',
      Cookie: cookie,
      'Accept-Language': 'zh-cn',
      'User-Agent': $.isNode()
        ? process.env.JD_USER_AGENT
          ? process.env.JD_USER_AGENT
          : require('./USER_AGENTS').USER_AGENT
        : $.getdata('JDUA')
        ? $.getdata('JDUA')
        : 'jdapp;iPhone;9.4.4;14.3;network/4g;Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148;supportJDSHWK/1',
      Referer: 'https://h5.m.jd.com/babelDiy/Zeus/4FdmTJQNah9oDJyQN8NggvRi1nEY/index.html',
      'Accept-Encoding': 'gzip, deflate, br',
    },
  };
}

function getAuthorShareCode(url) {
  return new Promise(async (resolve) => {
    const options = {
      url: `${url}?${new Date()}`,
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/87.0.4280.88',
      },
    };
    if ($.isNode() && process.env.TG_PROXY_HOST && process.env.TG_PROXY_PORT) {
      const tunnel = require('tunnel');
      const agent = {
        https: tunnel.httpsOverHttp({
          proxy: {
            host: process.env.TG_PROXY_HOST,
            port: process.env.TG_PROXY_PORT * 1,
          },
        }),
      };
      Object.assign(options, { agent });
    }
    $.get(options, async (err, resp, data) => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        // $.logErr(e, resp)
      } finally {
        resolve();
      }
    });
    await $.wait(10000);
    resolve();
  });
}

