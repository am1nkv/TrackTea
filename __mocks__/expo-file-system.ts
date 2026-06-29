export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
}

export const readAsStringAsync = jest.fn().mockResolvedValue('mockBase64Data')
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined)
export const deleteAsync = jest.fn().mockResolvedValue(undefined)
export const getInfoAsync = jest.fn().mockResolvedValue({ exists: true, size: 1024 })
export const documentDirectory = '/mock/documents/'
export const cacheDirectory = '/mock/cache/'
