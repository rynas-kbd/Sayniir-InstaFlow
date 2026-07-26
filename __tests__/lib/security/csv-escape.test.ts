import { describe, it, expect } from 'vitest'
import { csvEscape } from '@/lib/security/csv-escape'

describe('csvEscape', () => {
  it('prefixes a leading = to prevent formula injection', () => {
    expect(csvEscape("=cmd|'/c calc'!A1")).toBe("'=cmd|'/c calc'!A1")
  })

  it('prefixes a leading +', () => {
    expect(csvEscape('+1+1')).toBe("'+1+1")
  })

  it('prefixes a leading -', () => {
    expect(csvEscape('-1+1')).toBe("'-1+1")
  })

  it('prefixes a leading @', () => {
    expect(csvEscape('@SUM(A1:A2)')).toBe("'@SUM(A1:A2)")
  })

  it('prefixes a leading tab', () => {
    expect(csvEscape('\t=malicious')).toBe("'\t=malicious")
  })

  it('leaves an ordinary name untouched', () => {
    expect(csvEscape('Jean Dupont')).toBe('Jean Dupont')
  })

  it('quotes values containing a comma', () => {
    expect(csvEscape('Dupont, Jean')).toBe('"Dupont, Jean"')
  })

  it('quotes and escapes embedded double quotes', () => {
    expect(csvEscape('He said "hi"')).toBe('"He said ""hi"""')
  })

  it('quotes values containing a newline', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"')
  })

  it('quotes a formula-guarded value that also contains a comma', () => {
    expect(csvEscape('=A1,B1')).toBe(`"'=A1,B1"`)
  })
})
