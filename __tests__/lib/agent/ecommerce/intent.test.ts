import { describe, test, expect } from 'vitest'
import { classifyIntent, isGreeting, looksLikeQuestion } from '../../../../lib/agent/ecommerce/intent'

describe('isGreeting', () => {
  test('recognizes a French greeting', () => {
    expect(isGreeting('salam')).toBe(true)
    expect(isGreeting('Bonjour !')).toBe(true)
  })

  test('does not treat an unrelated message as a greeting', () => {
    expect(isGreeting('je veux commander le t-shirt')).toBe(false)
  })
})

describe('looksLikeQuestion', () => {
  test('a trailing "?" is a question', () => {
    expect(looksLikeQuestion('vous livrez le vendredi ?')).toBe(true)
  })

  test('an interrogative marker without "?" is still a question (audit finding F7)', () => {
    expect(looksLikeQuestion("c'est combien la livraison")).toBe(true)
    expect(looksLikeQuestion('شحال الثمن')).toBe(true)
  })

  test('a greeting counts as a question', () => {
    expect(looksLikeQuestion('salam')).toBe(true)
  })

  test('a plain slot answer is not a question', () => {
    expect(looksLikeQuestion('Rynas Kebdi')).toBe(false)
    expect(looksLikeQuestion('Akbou, Ighram')).toBe(false)
  })

  test('empty text is not a question', () => {
    expect(looksLikeQuestion('   ')).toBe(false)
  })
})

describe('classifyIntent — cross-cutting intents (audit finding F6)', () => {
  test('an explicit cancel phrase is recognized from any awaited field', () => {
    expect(classifyIntent('annuler ma commande', 'wilaya')).toBe('cancel')
    expect(classifyIntent('laisser tomber', 'nom complet')).toBe('cancel')
  })

  test('a bare "non" is NOT treated as cancel outside the confirmation step', () => {
    // This is the actual bug the module documents fixing: "non" answering
    // a delivery-mode question must never cancel the order on its own.
    expect(classifyIntent('non', 'mode de livraison')).not.toBe('cancel')
  })

  test('a human-handoff request is recognized', () => {
    expect(classifyIntent('je veux parler à un humain', 'téléphone')).toBe('human')
    expect(classifyIntent('parler à un responsable svp', 'wilaya')).toBe('human')
  })

  test('a restart request is recognized', () => {
    expect(classifyIntent('je veux recommencer', 'wilaya')).toBe('restart')
  })

  test('a change-of-product request is recognized once a product is being filled in', () => {
    expect(classifyIntent('je veux changer de produit', 'taille')).toBe('change_product')
  })

  test('change-product is not misfired while a product is still being picked', () => {
    expect(classifyIntent('un autre produit', 'produit')).toBe('answer')
  })

  test('a greeting mid-flow classifies as a question, not an answer', () => {
    expect(classifyIntent('salam', 'nom complet')).toBe('question')
  })

  test('a plain slot answer classifies as answer', () => {
    expect(classifyIntent('Rynas Kebdi', 'nom complet')).toBe('answer')
    expect(classifyIntent('0794055836', 'téléphone')).toBe('answer')
  })

  test('empty text classifies as answer (nothing to act on)', () => {
    expect(classifyIntent('   ', 'nom complet')).toBe('answer')
  })
})
