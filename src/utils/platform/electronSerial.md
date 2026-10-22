# Electron 串口

F12「串口设备」中搜索设备，为固定编号 1～20 设置绑定和通信参数，点击「保存重启」。编号按数值排列，删除一路或换设备不会重排其他编号；不同内容地址独立保存绑定。H5 无需声明设备，只使用发送与接收两个方法。

```ts
import { onBeforeUnmount } from 'vue'
import { electronSerial } from '@/utils/platform/electronSerial'

// 先监听，再发送，避免漏掉快速回包。
const off = electronSerial.receive(1, ({ data, error }) => {
  if (error) {
    console.error('串口异常：', error)
    return
  }
  console.log(data) // Uint8Array，按设备协议解析
})
onBeforeUnmount(off)

async function start() {
  try {
    await electronSerial.send(1, { hex: 'AA 01 00 FF' })
  } catch (error) {
    console.error('发送失败：', error)
  }
}
```

发送参数三选一：`{ hex: 'AA 01' }`、`{ text: 'start\r\n' }`（UTF-8）或 `{ bytes: new Uint8Array([0xAA, 1]) }`。十六进制必须是完整双位字节，可带空白；不自动添加换行、帧头或校验码。禁止空数据，单次最多 64 KiB；发送队列超限会拒绝。

`send()` 返回 `Promise<void>`，成功表示写入并排空发送缓冲，不代表设备已执行；失败必须处理。普通浏览器缺少客户端接口时明确报错，不模拟成功。

`receive()` 返回取消监听函数；组件卸载时调用。回调的 `error` 非空时为错误通知，此时 `data` 为空；正常数据是串口原始数据块，可能半包或粘包，业务自行缓存并按协议分帧。跨块文本应复用 `TextDecoder`，用 `decode(data, { stream: true })` 解码。

客户端首次收发自动连接。同一物理串口只能由一个业务页面使用；刷新、完整导航、崩溃或窗口销毁释放连接。活动监听遇到设备断开后自动尝试重连，不重发指令；取消最后一个监听会停止后台重连，连接仍由当前页面管理。未绑定编号会报错，请在 F12 配置。

有唯一序列号的设备可在 COM 号变化后重新识别；无序列号时按原端口及可用设备信息识别，端口变化需要重新绑定，相同型号设备无法仅凭型号保证身份。
