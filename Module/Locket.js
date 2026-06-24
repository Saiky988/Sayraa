const mapping = {
  '%E8%BD%A6%E7%A5%A8%E7%A5%A8': ['vip+watch_vip'], // Tên app viết bằng URL Encode
  'Locket': ['Gold']                            // Locket Gold
};

var ua = $request.headers["User-Agent"] || $request.headers["user-agent"];
var obj = JSON.parse($response.body);

obj.Attention = "Chúc mừng bạn! Vui lòng không bán hoặc chia sẻ cho người khác!";

var ohoang7 = {
  is_sandbox: false,
  ownership_type: "PURCHASED",
  billing_issues_detected_at: null,
  period_type: "normal",
  expires_date: "2099-12-18T01:04:17Z",
  grace_period_expires_date: null,
  unsubscribe_detected_at: null,
  original_purchase_date: "2024-07-28T01:04:18Z",
  purchase_date: "2024-07-28T01:04:17Z",
  store: "app_store"
};

var vuong2023 = {
  grace_period_expires_date: null,
  purchase_date: "2024-07-28T01:04:17Z",
  product_identifier: "com.ohoang7.premium.yearly",
  expires_date: "2099-12-18T01:04:17Z"
};

const match = Object.keys(mapping).find(key => ua.includes(key));

if (match) {
  let [entitlementName, customProductId] = mapping[match];
  
  if (customProductId) {
    vuong2023.product_identifier = customProductId;
    obj.subscriber.subscriptions[customProductId] = ohoang7;
  } else {
    obj.subscriber.subscriptions["com.ohoang7.premium.yearly"] = ohoang7;
  }
  
  obj.subscriber.entitlements[entitlementName] = vuong2023;

} else {
  obj.subscriber.subscriptions["com.ohoang7.premium.yearly"] = ohoang7;
  obj.subscriber.entitlements.pro = vuong2023;
}

$done({ body: JSON.stringify(obj) });
