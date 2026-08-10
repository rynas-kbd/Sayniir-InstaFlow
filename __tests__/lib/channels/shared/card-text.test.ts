import { describe, test, expect } from 'vitest'
import { renderCardAsText } from '@/lib/channels/shared/card-text'

describe('renderCardAsText', () => {
  test('renders title, subtitle and image URL as separate lines', () => {
    const text = renderCardAsText({ title: 'T-shirt bleu', subtitle: '2500 DA', imageUrl: 'https://cdn.example.com/shirt.jpg' })
    expect(text).toBe('T-shirt bleu\n2500 DA\nhttps://cdn.example.com/shirt.jpg')
  })

  test('renders title only when subtitle and image are absent', () => {
    expect(renderCardAsText({ title: 'T-shirt bleu' })).toBe('T-shirt bleu')
  })

  test('renders image URL only when title and subtitle are absent', () => {
    expect(renderCardAsText({ imageUrl: 'https://cdn.example.com/shirt.jpg' })).toBe('https://cdn.example.com/shirt.jpg')
  })

  test('returns an empty string when there is nothing to render', () => {
    expect(renderCardAsText({})).toBe('')
    expect(renderCardAsText({ title: null, subtitle: null, imageUrl: null })).toBe('')
  })

  test('appends buttons that carry a URL as "title : url" lines, skipping buttons without one', () => {
    const text = renderCardAsText({
      title: 'Panier',
      buttons: [
        { title: 'Reprendre ma commande', url: 'https://shop.example.com/cart' },
        { title: 'Postback sans URL', url: undefined },
      ],
    })
    expect(text).toBe('Panier\nReprendre ma commande : https://shop.example.com/cart')
  })
})
