# 概要

#### GASを使ったビットコインの自動売買

bitFlyerのAPIを使用して仮想通貨の売買を自動化するGoogle Apps Scriptのスクリプトです。
容易に自動化ができるように自動売買のクラスを作成しました。

#### 動作概要

Google Apps Script（GAS）のトリガーを使用して自動売買を行います。

# 利用方法

#### 1. 取引所のAPI設定を有効化

    ビットコイン取引所（bitFlyer）に実装されているAPIを有効にします。
    https://lightning.bitflyer.com/developer
    - 上記にアクセスし、API キーを有効にする
    - 必要なActionは、トレードの「新規注文を出す」のみ

#### 2. スクリプト(GAS)を新規作成

    任意の名前でスクリプトを作成し、bitFlyer.gs の内容をコピーして貼付けます。

#### 3. myFunction で bitFlyerクラス を使用した売買を記述

    スクリプトのmyFunctionでbitFlyerクラスを呼び出し、売買の処理を自由に記述します。
    例：

```
function myFunction() {
  const bit = new bitFlyer();
  bit.BITFLYER_API_KEY = 'APIキー';
  bit.BITFLYER_API_SECRET = 'APIシークレット';
  
  var data = bit.getData();       // 履歴データ取得
  var ticker = bit.getTicker();   // 現在価格を取得（条件等で使用する場合）

  if( data.side === "SELL" ) {
    bit.setSendOrder('BUY');      // 売却（既定値は0.001 BTC）
  } else {
    bit.setSendOrder('SELL');     // 購入（既定値は0.001 BTC）
  }

  bit.Log();                      // 結果表示
}
```

#### 4. スクリプトのクラスのプロパティにAPI設定を定義

    スクリプトのAPIパラメタに必要な定義をセットします。
    API定義はAPIキー、APIシークレットです。
    ※これらの定義は機密情報となります。Webサイトに記載したり外部にでないよう注意が必要です。

#### 5. トリガーを設定し自動実行

    スクリプトのトリガーを指定します。
    例：5分に一回実行

#### 6. データファイルの確認

    売買を行った結果はスクリプトの格納場所に作成される「data.txt」に記述されます。
    data.txt

```
{
  "product_code": "BTC_JPY",
  "child_order_type": "MARKET",
  "side": "SELL",                   // 今回取引種別（SELL or BUY）
  "price": 0,
  "size": 0.001,                    // 今回取引単位（初期値：0.001）
  "minute_to_expire": 300,
  "time_in_force": "GTC",
  "datetime": "2021/02/22 22:22:22",
  "child_order_acceptance_id": "XXX20210222-123456-123456",
  "ticker": 5616970,                // 今回取引価格
  "message": "",
  "p_ticker1": 5599358,             // 前回の取引価格（1回前）
  "p_side1": "",                    // 前回の取引種別（1回前）
  "p_message1": "",
  ・・・・・・
  "p_ticker10": 5677015,            // 前回の取引価格（10回前）
  "p_side10": "",                   // 前回の取引種別（10回前）
  "p_message10": "",
  "prevticker": 5828286,            // 直近の取引価格（前回成立時）
  "prevside": "BUY",                // 直近の取引種別（前回成立時）
  "prevmessage": ""
}
```
