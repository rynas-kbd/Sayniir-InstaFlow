# Tasks: Instagram Card Messages

## 1. Type Definitions

### 1.1 Define CardButton Interface
- [x] Create `CardButton` interface with:
  - `type: 'web_url' | 'postback'`
  - `title: string`
  - `url?: string`
  - `payload?: string`
- [x] Add JSDoc comments explaining each field and constraints

### 1.2 Define CardElement Interface
- [ ] Create `CardElement` interface with:
  - `title: string`
  - `subtitle?: string`
  - `image_url?: string`
  - `buttons?: CardButton[]`
- [ ] Add JSDoc comments with length constraints

### 1.3 Define API Payload Interfaces
- [ ] Create `GenericTemplatePayload` interface
- [ ] Create `AttachmentMessage` interface
- [ ] Create `SendCardReplyBody` interface
- [ ] Ensure all interfaces align with Instagram Graph API v21.0 spec

## 2. Validation Functions

### 2.1 Implement validateCardButton Helper
- [ ] Create `validateCardButton(button: CardButton): boolean` function
- [ ] Validate title length (1-20 characters)
- [ ] Validate type is 'web_url' or 'postback'
- [ ] Validate web_url buttons have url field
- [ ] Validate postback buttons have payload field
- [ ] Validate payload length (max 1000 characters)
- [ ] Add descriptive error logging for each validation failure

### 2.2 Implement validateCardElement Helper
- [ ] Create `validateCardElement(card: CardElement): boolean` function
- [ ] Validate title exists and length (1-80 characters)
- [ ] Validate subtitle length if present (max 80 characters)
- [ ] Validate buttons array length (max 3)
- [ ] Call `validateCardButton` for each button
- [ ] Add descriptive error logging for each validation failure

### 2.3 Implement validateCardsArray Helper
- [ ] Create `validateCardsArray(cards: CardElement[]): boolean` function
- [ ] Validate array is not empty
- [ ] Validate array length (max 10 cards)
- [ ] Call `validateCardElement` for each card
- [ ] Return true only if all validations pass

## 3. Core sendCardReply Function

### 3.1 Implement Function Signature
- [ ] Create `sendCardReply` async function with parameters:
  - `igUserId: string`
  - `accessToken: string`
  - `recipientId: string`
  - `cards: CardElement[]`
- [ ] Add return type: `Promise<{ message_id: string } | null>`
- [ ] Add comprehensive JSDoc comment

### 3.2 Implement Input Validation
- [ ] Call `validateCardsArray(cards)` at function start
- [ ] Return `null` if validation fails
- [ ] Log validation errors with descriptive messages

### 3.3 Implement Payload Construction
- [ ] Build `SendCardReplyBody` object with:
  - `recipient: { id: recipientId }`
  - `message.attachment.type: 'template'`
  - `message.attachment.payload.template_type: 'generic'`
  - `message.attachment.payload.elements: cards`
  - `messaging_type: 'RESPONSE'`

### 3.4 Implement API Request
- [ ] Construct Instagram Graph API URL: `https://graph.instagram.com/v${GRAPH_API_VERSION}/${igUserId}/messages`
- [ ] Make POST request with:
  - Headers: Content-Type: application/json, Authorization: Bearer {accessToken}
  - Body: JSON.stringify(body)

### 3.5 Implement Response Handling
- [ ] Parse JSON response
- [ ] Check for errors in response
- [ ] If error code 190: throw `TokenExpiredError`
- [ ] If other error: log error and return `null`
- [ ] If success: log success message and return `{ message_id: data.message_id }`

## 4. Testing

### 4.1 Unit Tests - Valid Input
- [ ] Test: Send single card with all fields populated
- [ ] Test: Send single card with only title (minimal)
- [ ] Test: Send carousel with 2 cards
- [ ] Test: Send carousel with 10 cards (boundary)
- [ ] Test: Card with 3 buttons (boundary)
- [ ] Test: Card with web_url button
- [ ] Test: Card with postback button
- [ ] Test: Card with mixed button types
- [ ] Mock fetch to return successful response
- [ ] Assert correct message_id returned

### 4.2 Unit Tests - Validation Failures
- [ ] Test: Empty cards array returns null
- [ ] Test: 11 cards returns null (exceeds max)
- [ ] Test: Card with missing title returns null
- [ ] Test: Card with 81-char title returns null
- [ ] Test: Card with 81-char subtitle returns null
- [ ] Test: Card with 4 buttons returns null
- [ ] Test: Button with missing title returns null
- [ ] Test: Button with 21-char title returns null
- [ ] Test: web_url button without url returns null
- [ ] Test: postback button without payload returns null
- [ ] Test: Payload exceeding 1000 chars returns null
- [ ] Verify no API calls made when validation fails

### 4.3 Unit Tests - Error Handling
- [ ] Test: API error code 190 throws TokenExpiredError
- [ ] Test: API error code 100 returns null
- [ ] Test: API error with no code returns null
- [ ] Test: Malformed API response returns null
- [ ] Mock fetch responses for each error scenario

### 4.4 Unit Tests - Data Integrity
- [ ] Test: Input cards array is not mutated
- [ ] Test: Card objects within array are not mutated
- [ ] Use deep equality check before/after function call

### 4.5 Property-Based Tests
- [ ] Property: Valid cards (1-10) with valid structure always attempts API call
- [ ] Property: Cards with titles 1-80 chars pass validation
- [ ] Property: Cards with 0-3 buttons pass validation
- [ ] Property: web_url buttons with url defined pass validation
- [ ] Property: postback buttons with payload defined pass validation
- [ ] Property: Input immutability holds for all valid inputs
- [ ] Use fast-check library for property generation

### 4.6 Integration Tests (Optional)
- [ ] Test: Send card to test Instagram account
- [ ] Test: Send carousel to test Instagram account
- [ ] Test: Verify delivery in Instagram app
- [ ] Test: Click web_url button, verify redirect
- [ ] Test: Click postback button, verify webhook receives payload
- [ ] Requires: Test Instagram Business Account with valid token

## 5. Code Integration

### 5.1 Update api.ts File
- [ ] Add type definitions at top of file (after imports)
- [ ] Add validation helper functions before sendCardReply
- [ ] Add sendCardReply function after sendReply function
- [ ] Maintain consistent code style with existing sendReply
- [ ] Add blank line separators between functions

### 5.2 Export New Function
- [ ] Ensure sendCardReply is exported
- [ ] Ensure new interfaces are exported
- [ ] Update file-level JSDoc if present

### 5.3 Verify Existing Code Unchanged
- [ ] Confirm sendReply function remains identical
- [ ] Confirm TokenExpiredError class remains identical
- [ ] Confirm GRAPH_API_VERSION constant remains identical
- [ ] Confirm fetchSenderProfile function remains identical

## 6. Documentation

### 6.1 Add JSDoc Comments
- [ ] Add comprehensive JSDoc for sendCardReply function
- [ ] Document all parameters with types and constraints
- [ ] Document return value and error conditions
- [ ] Add @throws annotation for TokenExpiredError
- [ ] Add usage examples in JSDoc

### 6.2 Add Inline Comments
- [ ] Comment validation logic sections
- [ ] Comment payload construction logic
- [ ] Comment error handling branches
- [ ] Keep comments concise and meaningful

### 6.3 Create Usage Examples File (Optional)
- [ ] Create examples.md or examples.ts
- [ ] Example 1: Single card with image and buttons
- [ ] Example 2: Product carousel
- [ ] Example 3: Options card with postback buttons
- [ ] Example 4: Error handling pattern

## 7. Code Review Checklist

### 7.1 Functionality Review
- [ ] All requirements from requirements.md are implemented
- [ ] All test cases pass
- [ ] Function handles all error scenarios gracefully
- [ ] Validation logic is comprehensive

### 7.2 Code Quality Review
- [ ] Code follows existing style conventions
- [ ] No code duplication
- [ ] Variable names are descriptive
- [ ] Functions are single-responsibility
- [ ] No magic numbers or strings (use constants)

### 7.3 Security Review
- [ ] Access tokens never logged
- [ ] Input validation prevents injection
- [ ] Length constraints enforced
- [ ] Error messages don't leak sensitive data

### 7.4 Performance Review
- [ ] Validation runs efficiently (O(n×m))
- [ ] No unnecessary object copies
- [ ] No memory leaks

### 7.5 Compatibility Review
- [ ] TypeScript types are correct
- [ ] Works with Deno runtime
- [ ] Compatible with Instagram Graph API v21.0
- [ ] Backward compatible with existing code

## 8. Deployment Preparation

### 8.1 Run All Tests
- [ ] Run unit tests, verify 100% pass
- [ ] Run property-based tests, verify no failures
- [ ] Run integration tests (if available)
- [ ] Check test coverage meets 90%+ goal

### 8.2 Type Check
- [ ] Run TypeScript compiler
- [ ] Fix any type errors
- [ ] Ensure no 'any' types used

### 8.3 Lint Code
- [ ] Run linter (deno lint or equivalent)
- [ ] Fix all linting errors
- [ ] Fix style warnings

### 8.4 Manual Testing
- [ ] Test with real Instagram test account (if available)
- [ ] Verify cards render correctly in Instagram app
- [ ] Test button interactions
- [ ] Verify error handling with invalid token

## 9. Documentation Updates

### 9.1 Update README (if applicable)
- [ ] Add sendCardReply to API documentation
- [ ] Add usage examples
- [ ] Update feature list

### 9.2 Update CHANGELOG (if applicable)
- [ ] Add new feature entry
- [ ] Document breaking changes (none expected)
- [ ] Document new interfaces/types

### 9.3 Update API Documentation
- [ ] Document sendCardReply function
- [ ] Document new TypeScript interfaces
- [ ] Add migration guide (none needed, additive change)

## 10. Post-Implementation

### 10.1 Monitor Initial Usage
- [ ] Monitor error logs for unexpected failures
- [ ] Track success rate of card messages
- [ ] Collect feedback from API consumers

### 10.2 Performance Monitoring
- [ ] Monitor API response times
- [ ] Monitor validation performance
- [ ] Monitor error rates

### 10.3 Future Enhancements (Backlog)
- [ ] Consider adding URL validation helper
- [ ] Consider adding image dimension validation
- [ ] Consider adding rate limiting helper
- [ ] Consider adding retry logic for transient failures
- [ ] Consider adding metrics/analytics
