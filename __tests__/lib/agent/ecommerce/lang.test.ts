import { describe, test, expect } from 'vitest'
import { detectLanguage } from '../../../../lib/agent/ecommerce/lang'

describe('detectLanguage', () => {
  test('detects Modern Standard Arabic script', () => {
    expect(detectLanguage('أريد شراء هذا المنتج')).toBe('ar')
  })

  test('detects darija written in Arabic script via darija markers', () => {
    expect(detectLanguage('واش كاين هذا في المقاس ميديوم')).toBe('darija')
  })

  test('detects darija written in latin/arabizi script', () => {
    expect(detectLanguage('Nebghi nedi t-shirt ta3 Sasuke f M')).toBe('darija')
  })

  test('detects plain French', () => {
    expect(detectLanguage('Je veux prendre le t-shirt sasuke')).toBe('fr')
  })

  test('detects English', () => {
    expect(detectLanguage('Hello, what is the price please')).toBe('en')
  })

  test('falls back to the provided fallback for short ambiguous replies', () => {
    expect(detectLanguage('M', 'ar')).toBe('ar')
    expect(detectLanguage('oui', 'fr')).toBe('fr')
  })

  test('defaults fallback to fr when none is given and text is ambiguous', () => {
    expect(detectLanguage('25')).toBe('fr')
  })

  test('does not misfire English on accented French text', () => {
    expect(detectLanguage('Vous préférez la livraison à domicile ?')).toBe('fr')
  })
})
