/*
脚本：取关京东店铺和商品
更新时间：2021-05-08
因种豆得豆和宠汪汪以及NobyDa大佬的京东签到脚本会关注店铺和商品，故此脚本用来取消已关注的店铺和商品
默认：每运行一次脚本全部已关注的店铺与商品
建议此脚本运行时间在 种豆得豆和宠汪汪脚本运行之后 再执行
现有功能: 1、取关商品。2、取关店铺。3、匹配到boxjs输入的过滤关键词后，不再进行此商品/店铺后面(包含输入的关键词商品/店铺)的取关
脚本兼容: Quantumult X, Surge, Loon, JSBox, Node.js, 小火箭
==============Quantumult X===========
[task_local]
#取关京东店铺商品
55 23 * * * jd_unsubscribe.js, tag=取关京东店铺商品, img-url=https://raw.githubusercontent.com/Orz-3/mini/master/Color/jd.png, enabled=true
===========Loon============
[Script]
cron "55 23 * * *" script-path=jd_unsubscribe.js,tag=取关京东店铺商品
============Surge=============
取关京东店铺商品 = type=cron,cronexp="55 23 * * *",wake-system=1,timeout=3600,script-path=jd_unsubscribe.js
===========小火箭========
取关京东店铺商品 = type=cron,script-path=jd_unsubscribe.js, cronexpr="55 23 * * *", timeout=3600, enable=true
 */
const jd_helpers = require('./utils/JDHelpers.js');
const jd_env = require('./utils/JDEnv.js');
const $ = jd_env.env('取关京东店铺和商品');
//Node.js用户请在jdCookie.js处填写京东ck;
const jdCookieNode = $.isNode() ? require('./jdCookie.js') : '';
const notify = $.isNode() ? require('./sendNotify') : '';
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
let args_xh = {
  /*
   * 是否执行取消关注，默认true
   * 可通过环境变量控制：JD_UNSUB
   * */
  isRun: process.env.JD_UNSUB || true,
  /*
   * 执行完毕是否进行通知，默认false
   * 可用环境变量控制：JD_TRY_PLOG
   * */
  isNotify: process.env.JD_UNSEB_NOTIFY || false,
  /*
   * 每次获取已关注的商品数
   * 可设置环境变量：JD_UNSUB_GPAGESIZE，默认为20，不建议超过20
   * */
  goodPageSize: process.env.JD_UNSUB_GPAGESIZE * 1 || 20,
  /*
   * 每次获取已关注的店铺数
   * 可设置环境变量：JD_UNSUB_SPAGESIZE，默认为20，不建议超过20
   * */
  shopPageSize: process.env.JD_UNSUB_SPAGESIZE * 1 || 20,
  /*
   * 商品类过滤关键词，只要商品名内包含关键词，则不会被取消关注
   * 可设置环境变量：JD_UNSUB_GKEYWORDS，用@分隔
   * */
  goodsKeyWords: (process.env.JD_UNSUB_GKEYWORDS && process.env.JD_UNSUB_GKEYWORDS.split('@')) || [],
  /*
   * 店铺类过滤关键词，只要店铺名内包含关键词，则不会被取消关注
   * 可设置环境变量：JD_UNSUB_SKEYWORDS，用@分隔
   * */
  shopKeyWords: (process.env.JD_UNSUB_SKEYWORDS && process.env.JD_UNSUB_SKEYWORDS.split('@')) || [],
  /*
   * 间隔，防止提示操作频繁，单位毫秒(1秒 = 1000毫秒)
   * 可用环境变量控制：JD_UNSUB_INTERVAL，默认为3000毫秒
   * */
  unSubscribeInterval: process.env.JD_UNSUB_INTERVAL * 1 || 1000,
  /*
   * 是否打印日志
   * 可用环境变量控制：JD_UNSUB_PLOG，默认为true
   * */
  printLog: process.env.JD_UNSUB_PLOG || true,
  /*
   * 失败次数，当取关商品或店铺时，如果连续 x 次失败，则结束本次取关，防止死循环
   * 可用环境变量控制：JD_UNSUB_FAILTIMES，默认为3次
   * */
  failTimes: process.env.JD_UNSUB_FAILTIMES || 3,
};
!(async () => {
  console.log('X1a0He留：运行前请看好脚本内的注释，日志已经很清楚了，有问题带着日志来问');
  if (args_xh.isRun) {
    if (!cookiesArr[0]) {
      $.msg('【京东账号一】取关京东店铺商品失败', '【提示】请先获取京东账号一cookie\n直接使用NobyDa的京东签到获取', 'https://bean.m.jd.com/bean/signIndex.action', {
        'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
      });
    }
    await requireConfig();
    for (let i = 0; i < cookiesArr.length; i++) {
      if (cookiesArr[i]) {
        $.cookie = cookie = cookiesArr[i];
        $.UserName = decodeURIComponent(cookie.match(/pt_pin=([^; ]+)(?=;?)/) && cookie.match(/pt_pin=([^; ]+)(?=;?)/)[1]);
        $.index = i + 1;
        $.isLogin = true;
        $.nickName = '';
        await $.totalBean();
        console.log(`\n****开始【京东账号${$.index}】${$.nickName || $.UserName}*****\n`);
        if (!$.isLogin) {
          $.msg($.name, `【提示】cookie已失效`, `京东账号${$.index} ${$.nickName || $.UserName}\n请重新登录获取\nhttps://bean.m.jd.com/bean/signIndex.action`, {
            'open-url': 'https://bean.m.jd.com/bean/signIndex.action',
          });
          if ($.isNode()) {
            await notify.sendNotify(`${$.name}cookie已失效 - ${$.UserName}`, `京东账号${$.index} ${$.UserName}\n请重新登录获取cookie`);
          }
          continue;
        }
        $.shopsKeyWordsNum = 0;
        $.goodsKeyWordsNum = 0;
        $.unsubscribeGoodsNum = 0;
        $.unsubscribeShopsNum = 0;
        $.goodsTotalNum = 0; //记录当前总共关注了多少商品
        $.shopsTotalNum = 0; //记录当前总共关注了多少店铺
        $.commIdList = ``;
        $.shopIdList = ``;
        $.endGoods = $.endShops = false;
        $.failTimes = 0;
        console.log(`=====京东账号${$.index} ${$.nickName || $.UserName}内部变量=====`);
        console.log(`$.unsubscribeGoodsNum: ${$.unsubscribeGoodsNum}`);
        console.log(`$.unsubscribeShopsNum: ${$.unsubscribeShopsNum}`);
        console.log(`$.goodsTotalNum: ${$.goodsTotalNum}`);
        console.log(`$.shopsTotalNum: ${$.shopsTotalNum}`);
        console.log(`$.commIdList: ${$.commIdList}`);
        console.log(`$.shopIdList: ${$.shopIdList}`);
        console.log(`$.failTimes: ${$.failTimes}`);
        console.log(`================`);
        await favCommQueryFilter(); //获取商品并过滤
        await $.wait(1000);
        if (!$.endGoods && parseInt($.goodsTotalNum) !== parseInt($.goodsKeyWordsNum)) await favCommBatchDel();
        //取关商品
        else console.log('不执行取消收藏商品\n');
        await $.wait(args_xh.unSubscribeInterval);
        await queryShopFavList(); //获取店铺并过滤
        await $.wait(args_xh.unSubscribeInterval);
        if (!$.endShops && parseInt($.shopsTotalNum) !== parseInt($.shopsKeyWordsNum)) await batchunfollow();
        //取关店铺
        else console.log('不执行取消收藏店铺\n');
        do {
          //如果商品总数和店铺总数都为0则已清空，跳出循环
          if (parseInt($.goodsTotalNum) === 0 && parseInt($.shopsTotalNum) === 0) break;
          else {
            //如果商品总数或店铺总数有一个不为0的话，先判断是哪个不为0
            if (parseInt($.goodsTotalNum) !== 0) {
              if (parseInt($.goodsTotalNum) === parseInt($.goodsKeyWordsNum)) break;
              else {
                $.commIdList = ``;
                await favCommQueryFilter(); //获取商品并过滤
                await $.wait(args_xh.unSubscribeInterval);
                if (!$.endGoods && parseInt($.goodsTotalNum) !== parseInt($.goodsKeyWordsNum)) await favCommBatchDel();
                //取关商品
                else console.log('不执行取消收藏商品\n');
              }
            } else if (parseInt($.shopsTotalNum) !== 0) {
              if (parseInt($.shopsTotalNum) === parseInt($.shopsKeyWordsNum)) break;
              else {
                $.shopIdList = ``;
                await queryShopFavList(); //获取店铺并过滤
                await $.wait(args_xh.unSubscribeInterval);
                if (!$.endShops && parseInt($.shopsTotalNum) !== parseInt($.shopsKeyWordsNum)) await batchunfollow();
                //取关店铺
                else console.log('不执行取消收藏店铺\n');
              }
            }
          }
          if ($.failTimes >= args_xh.failTimes) {
            console.log('失败次数到达设定值，触发防死循环机制，该帐号已跳过');
            break;
          }
        } while (true);
        await showMsg_xh();
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

function requireConfig() {
  return new Promise((resolve) => {
    if ($.isNode() && process.env.JD_UNSUB) {
      args_xh.isRun = process.env.JD_UNSUB === 'true';
      args_xh.isNotify = process.env.JD_UNSEB_NOTIFY === 'true';
      args_xh.printLog = process.env.JD_UNSUB_PLOG === 'true';
      console.log('=====环境变量配置如下=====');
      console.log(`isNotify: ${typeof args_xh.isNotify}, ${args_xh.isNotify}`);
      console.log(`goodPageSize: ${typeof args_xh.goodPageSize}, ${args_xh.goodPageSize}`);
      console.log(`shopPageSize: ${typeof args_xh.shopPageSize}, ${args_xh.shopPageSize}`);
      console.log(`goodsKeyWords: ${typeof args_xh.goodsKeyWords}, ${args_xh.goodsKeyWords}`);
      console.log(`shopKeyWords: ${typeof args_xh.shopKeyWords}, ${args_xh.shopKeyWords}`);
      console.log(`unSubscribeInterval: ${typeof args_xh.unSubscribeInterval}, ${args_xh.unSubscribeInterval}`);
      console.log(`printLog: ${typeof args_xh.printLog}, ${args_xh.printLog}`);
      console.log(`failTimes: ${typeof args_xh.failTimes}, ${args_xh.failTimes}`);
      console.log('=======================');
    }
    resolve();
  });
}

function showMsg_xh() {
  if (args_xh.isNotify) {
    $.msg($.name, ``, `【京东账号${$.index}】${$.nickName}\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个`);
  } else {
    $.log(`【京东账号${$.index}】${$.nickName}\n【还剩关注店铺】${$.shopsTotalNum}个\n【还剩关注商品】${$.goodsTotalNum}个`);
  }
}

function getSubstr(str, leftStr, rightStr) {
  let left = str.indexOf(leftStr);
  let right = str.indexOf(rightStr, left);
  if (left < 0 || right < left) return '';
  return str.substring(left + leftStr.length, right);
}

function favCommQueryFilter() {
  return new Promise((resolve) => {
    console.log('正在获取已关注的商品...');
    const option = {
      url: `https://wq.jd.com/fav/comm/FavCommQueryFilter?cp=1&pageSize=${args_xh.goodPageSize}&category=0&promote=0&cutPrice=0&coupon=0&stock=0&sceneval=2`,
      headers: {
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        Referer: 'https://wqs.jd.com/',
      },
    };
    $.get(option, async (err, resp, data) => {
      try {
        data = JSON.parse(getSubstr(data, 'try{(', ');}catch(e){}'));
        if (data.iRet === '0') {
          $.goodsTotalNum = parseInt(data.totalNum);
          console.log(`当前已关注商品：${$.goodsTotalNum}个`);
          $.goodsKeyWordsNum = 0;
          for (let item of data.data) {
            if (args_xh.goodsKeyWords.some((keyword) => item.commTitle.includes(keyword))) {
              args_xh.printLog ? console.log(`${item.commTitle} `) : '';
              args_xh.printLog ? console.log('商品被过滤，含有关键词\n') : '';
              $.goodsKeyWordsNum += 1;
            } else {
              $.commIdList += item.commId + ',';
              $.unsubscribeGoodsNum++;
            }
          }
        } else {
          $.endGoods = true;
          console.log('无商品可取消收藏\n');
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function favCommBatchDel() {
  return new Promise((resolve) => {
    console.log('正在取消收藏商品...');
    const option = {
      url: `https://wq.jd.com/fav/comm/FavCommBatchDel?commId=${$.commIdList}&sceneval=2&g_login_type=1`,
      headers: {
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        Referer: 'https://wqs.jd.com/',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.iRet === '0' && data.errMsg === 'success') {
          console.log(`成功取消收藏商品：${$.unsubscribeGoodsNum}个\n`);
          $.failTimes = 0;
        } else {
          console.log(`批量取消收藏商品失败，失败次数：${++$.failTimes}\n`, data);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function queryShopFavList() {
  return new Promise((resolve) => {
    console.log('正在获取已关注的店铺...');
    const option = {
      url: `https://wq.jd.com/fav/shop/QueryShopFavList?cp=1&pageSize=${args_xh.shopPageSize}&sceneval=2&g_login_type=1&callback=jsonpCBKA`,
      headers: {
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        Referer: 'https://wqs.jd.com/',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(getSubstr(data, 'try{jsonpCBKA(', ');}catch(e){}'));
        if (data.iRet === '0') {
          $.shopsTotalNum = parseInt(data.totalNum);
          console.log(`当前已关注店铺：${$.shopsTotalNum}个`);
          if (data.data.length > 0) {
            $.shopsKeyWordsNum = 0;
            for (let item of data.data) {
              if (args_xh.shopKeyWords.some((keyword) => item.shopName.includes(keyword))) {
                args_xh.printLog ? console.log('店铺被过滤，含有关键词') : '';
                args_xh.printLog ? console.log(`${item.shopName}\n`) : '';
                $.shopsKeyWordsNum += 1;
              } else {
                $.shopIdList += item.shopId + ',';
                $.unsubscribeShopsNum++;
              }
            }
          } else {
            $.endShops = true;
            console.log('无店铺可取消关注\n');
          }
        } else console.log(`获取已关注店铺失败：${JSON.stringify(data)}`);
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}

function batchunfollow() {
  return new Promise((resolve) => {
    console.log('正在执行批量取消关注店铺...');
    const option = {
      url: `https://wq.jd.com/fav/shop/batchunfollow?shopId=${$.shopIdList}&sceneval=2&g_login_type=1`,
      headers: {
        Cookie: cookie,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36',
        Referer: 'https://wqs.jd.com/',
      },
    };
    $.get(option, (err, resp, data) => {
      try {
        data = JSON.parse(data);
        if (data.iRet === '0') {
          console.log(`已成功取消关注店铺：${$.unsubscribeShopsNum}个\n`);
          $.failTimes = 0;
        } else {
          console.log(`批量取消关注店铺失败，失败次数：${++$.failTimes}\n`);
        }
      } catch (e) {
        $.logErr(e, resp);
      } finally {
        resolve(data);
      }
    });
  });
}
