const GRAPH_API_VERSION = 'v21.0'

/**
 * Custom error for expired tokens — allows callers to handle separately.
 */
export class TokenExpiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TokenExpiredError'
  }
}

/**
 * Button configuration for Instagram card messages (generic templates).
 * 
 * Represents an action button that can be attached to a card element in Instagram DMs.
 * Each card can have up to 3 buttons, which can be either web links or postback actions.
 * 
 * @example
 * // Web URL button - opens a webpage
 * const webButton: CardButton = {
 *   type: 'web_url',
 *   title: 'Visit Website',
 *   url: 'https://example.com/products'
 * }
 * 
 * @example
 * // Postback button - sends data to webhook
 * const postbackButton: CardButton = {
 *   type: 'postback',
 *   title: 'Learn More',
 *   payload: 'PRODUCT_INFO_123'
 * }
 */
export interface CardButton {
  /**
   * The action type of the button.
   * 
   * - `'web_url'`: Opens a web page in the user's browser when clicked
   * - `'postback'`: Sends a payload to your webhook when clicked
   * 
   * @see {@link url} Required when type is 'web_url'
   * @see {@link payload} Required when type is 'postback'
   */
  type: 'web_url' | 'postback'
  
  /**
   * The button label text displayed to the user.
   * 
   * **Constraints:**
   * - Must be between 1 and 20 characters (inclusive)
   * - Will be displayed as the clickable button text in Instagram
   * - Should be concise and action-oriented (e.g., "Buy Now", "Learn More")
   * 
   * **Validation:**
   * - Empty strings are not allowed
   * - Strings longer than 20 characters will cause validation to fail
   */
  title: string
  
  /**
   * The URL to open when the button is clicked.
   * 
   * **Required when:** `type === 'web_url'`
   * 
   * **Optional when:** `type === 'postback'` (ignored if provided)
   * 
   * **Constraints:**
   * - Must be a valid HTTPS URL
   * - Should point to a publicly accessible webpage
   * 
   * **Validation:**
   * - Missing this field when `type` is 'web_url' will cause validation to fail
   * 
   * @example 'https://example.com/product/123'
   */
  url?: string
  
  /**
   * The data payload sent to your webhook when the button is clicked.
   * 
   * **Required when:** `type === 'postback'`
   * 
   * **Optional when:** `type === 'web_url'` (ignored if provided)
   * 
   * **Constraints:**
   * - Must be between 1 and 1000 characters (inclusive)
   * - Can contain any string data you need to identify the button action
   * - Will be included in the webhook event when the user clicks the button
   * 
   * **Validation:**
   * - Missing this field when `type` is 'postback' will cause validation to fail
   * - Strings longer than 1000 characters will cause validation to fail
   * 
   * @example 'USER_SELECTED_OPTION_A'
   * @example 'PRODUCT_ID_123_ADD_TO_CART'
   */
  payload?: string
}

/**
 * Card element configuration for Instagram generic template messages (carousels).
 * 
 * Represents a single card in a carousel message sent via Instagram DMs.
 * Each carousel can contain 1-10 cards, and each card can display rich media
 * content including an image, title, subtitle, and action buttons.
 * 
 * @example
 * // Product card with image and buttons
 * const productCard: CardElement = {
 *   title: 'New Summer Collection',
 *   subtitle: 'Starting at $49.99',
 *   image_url: 'https://example.com/summer-collection.jpg',
 *   buttons: [
 *     {
 *       type: 'web_url',
 *       title: 'Shop Now',
 *       url: 'https://example.com/shop/summer'
 *     },
 *     {
 *       type: 'postback',
 *       title: 'Learn More',
 *       payload: 'SUMMER_COLLECTION_INFO'
 *     }
 *   ]
 * }
 * 
 * @example
 * // Simple text-only card
 * const textCard: CardElement = {
 *   title: 'Thank you for your interest!',
 *   subtitle: 'We will get back to you soon.'
 * }
 */
export interface CardElement {
  /**
   * The main heading text of the card.
   * 
   * **Required field** - every card must have a title.
   * 
   * **Constraints:**
   * - Must be between 1 and 80 characters (inclusive)
   * - Will be displayed prominently at the top of the card
   * - Should be concise and descriptive
   * 
   * **Validation:**
   * - Empty strings are not allowed
   * - Strings longer than 80 characters will cause validation to fail
   */
  title: string
  
  /**
   * Optional descriptive text displayed below the title.
   * 
   * **Constraints:**
   * - Maximum 80 characters
   * - Typically used for additional details, pricing, or descriptions
   * 
   * **Validation:**
   * - If provided, strings longer than 80 characters will cause validation to fail
   * 
   * @example 'Premium quality · Free shipping'
   * @example '$99.99 · In stock'
   */
  subtitle?: string
  
  /**
   * Optional image URL to display in the card.
   * 
   * **Constraints:**
   * - Must be a valid HTTPS URL
   * - Image should be publicly accessible
   * - Recommended aspect ratio: 1.91:1 (horizontal)
   * - Recommended minimum width: 600px
   * 
   * **Validation:**
   * - If provided, must be a valid HTTPS URL (not HTTP)
   * 
   * @example 'https://example.com/images/product-photo.jpg'
   */
  image_url?: string
  
  /**
   * Optional array of action buttons displayed at the bottom of the card.
   * 
   * **Constraints:**
   * - Maximum 3 buttons per card
   * - Each button must be a valid {@link CardButton}
   * - Buttons are displayed in the order provided
   * 
   * **Validation:**
   * - If provided, array length must not exceed 3
   * - Each button must pass CardButton validation
   * 
   * @see {@link CardButton} for button configuration options
   */
  buttons?: CardButton[]
}

/**
 * Send a text message reply via the Instagram Messaging API.
 * Uses the Instagram Business Graph API (graph.instagram.com).
 */
interface SendReplyBody {
  recipient: { id: string }
  message: {
    text: string
    quick_replies?: Array<{ content_type: string; title: string; payload: string }>
  }
  messaging_type: string
}

export async function sendReply(
  igUserId: string,
  accessToken: string,
  recipientId: string,
  messageText: string,
  quickReplies?: Array<{ title: string; payload: string }>
): Promise<{ message_id: string } | null> {
  const body: SendReplyBody = {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: 'RESPONSE',
  }

  if (quickReplies && quickReplies.length > 0) {
    body.message.quick_replies = quickReplies.slice(0, 13).map(qr => ({
      content_type: 'text',
      title: qr.title.substring(0, 20),
      payload: qr.payload.substring(0, 1000)
    }))
  }

  // New Instagram Business API endpoint
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/messages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (!res.ok || data.error) {
    console.error('[sendReply] Meta API error:', JSON.stringify(data.error))
    if (data.error?.code === 190) {
      throw new TokenExpiredError(`Access token expired for ${igUserId}: ${data.error.message}`)
    }
    return null
  }

  console.log(`[sendReply] ✅ Sent to ${recipientId}:`, messageText)
  return { message_id: data.message_id as string }
}

export async function fetchSenderProfile(
  senderId: string,
  accessToken: string
): Promise<{ name?: string; profile_pic?: string; username?: string } | null> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${senderId}?fields=name,profile_pic,username&access_token=${accessToken}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch (err) {
    console.error('[fetchSenderProfile] Failed to fetch sender profile:', err)
    return null
  }
}
