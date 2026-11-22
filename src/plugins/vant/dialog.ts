import { setDialogDefaultOptions, showDialog as vantShowDialog } from 'vant'
import 'vant/es/dialog/style'

setDialogDefaultOptions({
  title: '温馨提示',
  theme: 'round-button',
  allowHtml: false,
  teleport: '#app',
  transition: 'popup',
})

export const myDialog = vantShowDialog
