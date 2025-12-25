import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
// import updateLocale from 'dayjs/plugin/updateLocale'
import 'dayjs/locale/zh'

dayjs.extend(relativeTime)
dayjs.locale('zh')

// dayjs.extend(updateLocale)
// dayjs.updateLocale('zh', {
//   relativeTime: {
//     future: '%s内',
//     past: '%s前',
//     s: '几秒',
//     m: '1分钟',
//     mm: '%d分钟',
//     h: '1小时',
//     hh: '%d小时',
//     d: '1天',
//     dd: '%d天',
//     M: '1个月',
//     MM: '%d个月',
//     y: '1年',
//     yy: '%d年',
//   },
// })

export function timeAgo(time: string | number | Date | dayjs.Dayjs) {
  const a = dayjs()
  const b = dayjs(time)
  return a.to(b)
}
