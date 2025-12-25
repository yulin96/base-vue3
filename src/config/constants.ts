export const ossVideoSuffix = (time = 100) => `?x-oss-process=video/snapshot,t_${time},f_jpg,m_fast`

export const cosVideoSuffix = (time = 100) => `?ci-process=snapshot&time=${time}&format=jpg`
