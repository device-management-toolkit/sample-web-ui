import { AmTimeAgoFormatterPipe } from './time-ago-formatter.pipe.ts.pipe'

describe('AmTimeAgoFormatterPipe', () => {
  let pipe: AmTimeAgoFormatterPipe

  beforeEach(() => {
    pipe = new AmTimeAgoFormatterPipe()
  })

  it('create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should transform date to time ago format', () => {
    const date = new Date()
    const result = pipe.transform(date)
    expect(result).toContain('less than a minute ago')
  })

  it('should transform date string to time ago format', () => {
    const date = new Date().toISOString()
    const result = pipe.transform(date)
    expect(result).toContain('less than a minute ago')
  })

  it('should transform timestamp to time ago format', () => {
    const timestamp = Date.now()
    const result = pipe.transform(timestamp)
    expect(result).toContain('less than a minute ago')
  })

  it('should return empty string if no date is provided', () => {
    const result = pipe.transform('')
    expect(result).toBe('')
  })

  it('should add suffix if addSuffix is true', () => {
    const date = new Date(Date.now() - 60000) // 1 minute ago
    const result = pipe.transform(date, true)
    expect(result).toContain('minute ago')
  })

  it('should not add suffix if addSuffix is false', () => {
    const date = new Date(Date.now() - 60000) // 1 minute ago
    const result = pipe.transform(date, false)
    expect(result).toContain('minute')
    expect(result).not.toContain('ago')
  })
})
