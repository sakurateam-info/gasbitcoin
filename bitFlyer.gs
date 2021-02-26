/**
 * -------------------------------------------------------------------
 * bitFlyerクラス
 * -------------------------------------------------------------------
 */
class bitFlyer {
  constructor() {
    this.DEF_BASEURL = 'https://api.bitflyer.jp';
    this.DEF_VERSION = '/v1/';
    this.DEF_GETTICKER = 'getticker?product_code=';
    this.DEF_SENDORDER = 'me/sendchildorder';
    this.BITFLYER_API_KEY =  '';        // API有効化画面の API Keyを指定（必須）
    this.BITFLYER_API_SECRET =  '';     // API有効化画面の API Secretを指定（必須）
    this.BITFLYER_OPTION =  {
      product_code      : 'BTC_JPY',    // 注文するプロダクト
      child_order_type  : 'MARKET',     // 指値注文の場合は "LIMIT", 成行注文の場合は "MARKET"
      side              : 'SELL',       // 買い注文の場合は "BUY", 売り注文の場合は "SELL" 
      price             : 0,            // "LIMIT" を指定した場合は価格
      size              : 0.001,        // 注文数量(～0.001)
      minute_to_expire  : 300,	        // 期限切れまでの時間を分で指定
      time_in_force     : 'GTC'         // 執行数量条件 を "GTC", "IOC", "FOK"
    };
    this.BITFLYER_MAIL =  '';           // 取引通知（取引結果をメールする場合はアドレスを指定）
    this.BITFLYER_FEERATE = 0.07;       // 売買手数料(0.01～0.15% BTC)
    this.BITFLYER_ISORDER = false;      // 取引状態
    this.PREVIOUS_DATANAME = 'data.txt';// 前回データ格納ファイル名
    this.PREVIOUS_DATACOUNT =  10;      // 前回履歴の保存件数
  }
  // Data storage methods
  Log() {
    var data = this.getData();
    Logger.log( this.getTradeMessage(data) );
  }
  getTradeMessage(data){
    if( data.p_side1 === '' ) {
      return "前回売買：" + data.ticker.toLocaleString() + " (" + data.side +") " +
             "→ 今回価格：" + data.p_ticker1.toLocaleString() + " (なし) " + data.p_message1 ;
    } else {
      return "前回売買：" + data.prevticker.toLocaleString() + " (" + data.prevside +") " +
             "→ 今回価格：" + data.p_ticker1.toLocaleString() + " (" + data.p_side1 + ")" + 
             data.message + " [ " + data.size + " " + data.product_code + " ]";
    }
  }
  sendOrderMail(para) {
    if( this.BITFLYER_MAIL != '' ) {
      var m_subject = '',m_body = '';
      if( 'error' in para ) {
        m_subject = "BTC自動売買[エラー]" ;
        m_body = JSON.stringify(para);
      } else {
        m_subject = "BTC自動売買[" + para.side + "]"; 
        m_body = this.getTradeMessage(para) + "\n\n" + JSON.stringify(para, null, 2);
      }
      MailApp.sendEmail( this.BITFLYER_MAIL, m_subject, m_body);  
    }
  }
  getData(){
    var data = JSON.parse(this.getDataFile(this.PREVIOUS_DATANAME));
    if( data ) {
      return data;
    } else {
      var obj = Object.assign({}, this.BITFLYER_OPTION );
      obj.ticker = 0;
      this.setDataOption(obj);
      return obj;
    }
  }
  setData( obj ){
    this.setDataOption(obj);
    if( 'side' in obj && 'ticker' in obj ) {
      obj.p_side1 =  obj.side;
      obj.p_size1 =  obj.size;
      obj.p_ticker1 =  obj.ticker;
      this.setPreviousData(obj);
      var approxincome = 0,approxfee = 0;
      if( parseInt( obj.prevticker ) > 0 ) {
        if( obj.side === 'SELL' ) {
          approxincome = (parseInt(obj.ticker)*parseFloat(obj.size)) - (parseInt(obj.prevticker)*parseFloat(obj.prevsize));
        } else {
          approxincome = (parseInt(obj.prevticker)*parseFloat(obj.prevsize)) - (parseInt(obj.ticker)*parseFloat(obj.size));
        }
        approxfee = (parseInt(obj.ticker)*parseFloat(obj.size)) * this.BITFLYER_FEERATE * 0.01;
      }
      obj.approxincome = parseInt(obj.approxincome) + parseInt(approxincome);
      obj.approxfee = parseInt(obj.approxfee) + parseInt(approxfee);
      obj.tradecount = parseInt(obj.tradecount) + 1;
    } else {
      Logger.log("CONSISTENCY ERROR:" + JSON.stringify(obj));
    }
    this.setDataFile(this.PREVIOUS_DATANAME,JSON.stringify(obj, null, 2));
  }
  setDataOption (obj) {
      obj.prevside = '';
      obj.prevticker = obj.prevsize = 0;
      obj.prevmessage = '';
      obj.tradecount = obj.approxfee = obj.approxincome = 0;
      for (var i = 1; i <= this.PREVIOUS_DATACOUNT; i++) {
        obj['p_side' + i ] =  '';
        obj['p_size' + i ] =  '';
        obj['p_ticker' + i ] = 0;
        obj['p_message' + i ] =  '';
      }
  }
  setPreviousData(obj) {
    var predata = this.getData();
    if( predata ) {
      for (var i = 1; i < this.PREVIOUS_DATACOUNT; i++) {
          if( ( 'p_side' + i ) in predata ) obj['p_side' + (i + 1) ] =  predata['p_side' + i];
          if( ( 'p_size' + i ) in predata ) obj['p_size' + (i + 1) ] =  predata['p_size' + i];
          if( ( 'p_ticker' + i ) in predata ) obj['p_ticker' + (i + 1) ] =  predata['p_ticker' + i];
          if( ( 'p_message' + i ) in predata ) obj['p_message' + (i + 1) ] =  predata['p_message' + i];
      }
      if( obj.p_side1 != '' ) {
        obj.prevside = predata.side;
        obj.prevsize = predata.size;
        obj.prevticker = predata.ticker;
        obj.prevmessage = predata.message;
        obj.approxincome = predata.approxincome;
        obj.approxfee = predata.approxfee;
        obj.tradecount = predata.tradecount;
      }
    }
  }
  // Trading methods
  setSendOrder(order_type = '',order_message = '') {
    this.BITFLYER_OPTION.side = order_type;
    var resultOrder = this.sendChildOrder();
    resultOrder.message = order_message;
    if( 'error' in resultOrder ) {
      Logger.log("ERROR:" + JSON.stringify(resultOrder));
    } else {
      this.setData(resultOrder);
    }
    this.sendOrderMail(resultOrder);
  }
  setNoOrder(order_message = '') {
    var obj = this.getData();
    obj.p_side1 = obj.p_size1 = '';
    obj.p_ticker1 = this.getTicker();
    obj.p_message1 = order_message;
    this.setPreviousData(obj);
    this.setDataFile(this.PREVIOUS_DATANAME,JSON.stringify(obj, null, 2));
  }
  // API usage method
  getTicker() {
    var json = UrlFetchApp.fetch(
      this.DEF_BASEURL + this.DEF_VERSION + this.DEF_GETTICKER + this.BITFLYER_OPTION.product_code);
    var jsonData = JSON.parse(json);
    return parseFloat(jsonData.ltp);
  }
  sendChildOrder() {
    var url = this.DEF_BASEURL + this.DEF_VERSION + this.DEF_SENDORDER,
        para = Object.assign({}, this.BITFLYER_OPTION ),
        timestamp = Date.now().toString(),
        method = 'POST',
        path = this.DEF_VERSION + this.DEF_SENDORDER,
        body = JSON.stringify( para ),
        text = timestamp + method + path + body,
        signature = Utilities.computeHmacSha256Signature(text, this.BITFLYER_API_SECRET);
    var sign = signature.reduce(function(str,chr) {
        chr = (chr < 0 ? chr + 256 : chr).toString(16);
        return str + (chr.length==1?'0':'') + chr;
      },'');
    var headers = {
      'ACCESS-KEY'        : this.BITFLYER_API_KEY,
      'ACCESS-TIMESTAMP'  : timestamp,
      'ACCESS-SIGN'       : sign,
      'Content-Type'      : 'application/json'
    };
    var options = {
      method  : method,
      headers : headers,
      payload : body,
      muteHttpExceptions: true
    };
    var order_ticker = this.getTicker();
    var response = UrlFetchApp.fetch(url, options);
    if( response != null ){
      var json = response.getContentText();
      var jsonData = JSON.parse(json);
      if( jsonData.child_order_acceptance_id ) {
        this.BITFLYER_ISORDER = true;
        para.datetime = Utilities.formatDate( new Date(), 'Asia/Tokyo', 'yyyy/MM/dd hh:mm:ss');
        para.child_order_acceptance_id = jsonData.child_order_acceptance_id;
        para.ticker = order_ticker;
      } else {
        para.error = json;
      }
    } else {
      para.error = "Connection Error";
    }
    return para;
  }
  // DriveApp usage method
  setDataFile(filename, contents){
    const scriptid = ScriptApp.getScriptId();
    const parentFolder = DriveApp.getFileById(scriptid).getParents();
    const folderid = parentFolder.next().getId();
    const folder = DriveApp.getFolderById(folderid);
    const file = this.getDataByName(folder, filename);
    if( file ){
      file.setContent(contents);
    } else {
      const blob = Utilities.newBlob('', 'text/plain', filename).setDataFromString(contents, 'utf-8');
      folder.createFile(blob);
    }
  }
  getDataFile(filename){
    const scriptid = ScriptApp.getScriptId();
    const parentFolder = DriveApp.getFileById(scriptid).getParents();
    const folderid = parentFolder.next().getId();
    const folder = DriveApp.getFolderById(folderid);
    const file = this.getDataByName(folder, filename);
    if( file ){
      return file.getBlob().getDataAsString("utf-8");
    } else {
      return null;
    }
  }
  getDataByName (folder, filename) {
    var files = folder.getFilesByName(filename)
    while (files.hasNext()) {
      return files.next();
    }
    return null;
  }
}
