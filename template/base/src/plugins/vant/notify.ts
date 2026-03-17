import { setNotifyDefaultOptions, showNotify as vantShowNotify } from 'vant'
import 'vant/es/notify/style'

setNotifyDefaultOptions({ type: 'warning', teleport: '#app' })

export const showNotify = vantShowNotify
