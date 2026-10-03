export const services = {
  api: {
    baseURL: import.meta.env.VITE_APP_API_URL,
  },
  menus: {
    url: 'https://cdeapi.event1.cn/api/cmenu',
  },
  wechat: {
    sdkUrl: 'https://wechat.event1.cn/api/getJsSdk',
    codeUrl: 'https://wechat.event1.cn/api/getCode',
    name: 'hudongweipingtai',
  },
  upload: {
    stsUrl: 'https://rally.event1.cn/bn9z/sts/oss',
    endpoint: 'https://up.eventnet.cn',
    publicUrl: 'https://up.eventnet.cn',
  },
  mqtt: {
    scriptUrl: 'https://cdn.aodianyun.com/dms/rop_client.js',
    publishUrl: import.meta.env.VITE_APP_MQTT_API_URL,
    pub: 'pub_357ce949f839716f0487fa733b49d3f8',
    sub: 'sub_3ffbe7827a221c20387302a165211dc3',
  },
}
