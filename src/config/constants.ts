export const ossVideoSuffix = (time = 100) => `?x-oss-process=video/snapshot,t_${time},f_jpg,m_fast`

export const cosVideoSuffix = (time = 100) => `?ci-process=snapshot&time=${time}&format=jpg`

export const ossWebp = '?x-oss-process=image/format,webp'

export const getAvatar = (id = 1) => `https://oss.eventnet.cn/H5/zz/public/font/12/avatar/${id}.jpg`
