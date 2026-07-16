# Requirements: Instagram Card Messages

## 1. Functional Requirements

### 1.1 Card Message Structure

**The system SHALL support sending Instagram generic template cards with the following elements:**

- **Title** (required): Text content, maximum 80 characters
- **Subtitle** (optional): Text content, maximum 80 characters
- **Image URL** (optional): HTTPS URL pointing to an image
- **Buttons** (optional): Array of action buttons, maximum 3 per card

### 1.2 Button Types

**The system SHALL support two types of buttons:**

1. **Web URL Button**: Opens a web page in browser
   - Requires: `type: 'web_url'`, `title` (1-20 chars), `url` (valid HTTPS URL)
   
2. **Postback Button**: Sends payload back to webhook
   - Requires: `type: 'postback'`, `title` (1-20 chars), `payload` (1-1000 chars)

### 1.3 Carousel Support

**The system SHALL support sending multiple cards in a carousel format:**

- Minimum cards per message: 1
- Maximum cards per message: 10
- Each card follows the structure defined in 1.1

### 1.4 API Integration

**The system SHALL send card messages via Instagram Graph API:**

- Endpoint: `https://graph.instagram.com/v21.0/{igUserId}/messages`
- Method: POST
- Authentication: Bearer token in Authorization header
- Message type: `messaging_type: 'RESPONSE'`
- Payload structure: Generic template format as specified by Instagram

### 1.5 Backward Compatibility

**The system SHALL maintain existing text message functionality:**

- Existing `sendReply` function remains unchanged
- Text messages with quick replies continue to work
- No breaking changes to existing API consumers

### 1.6 Response Handling

**The system SHALL return message delivery status:**

- Success: Return object containing `message_id` string
- Failure (non-token): Return `null`
- Token expired: Throw `TokenExpiredError` exception

## 2. Input Validation Requirements

### 2.1 Card Array Validation

**The system SHALL validate the cards array:**

- MUST reject empty arrays (length = 0)
- MUST reject arrays with more than 10 cards
- MUST validate each individual card element

### 2.2 Card Element Validation

**The system SHALL validate each card element:**

- Title MUST be present and non-empty
- Title MUST NOT exceed 80 characters
- Subtitle, if present, MUST NOT exceed 80 characters
- Image URL, if present, SHOULD be valid HTTPS URL
- Buttons array, if present, MUST NOT exceed 3 elements

### 2.3 Button Validation

**The system SHALL validate each button:**

- Title MUST be present and between 1-20 characters
- Type MUST be either 'web_url' or 'postback'
- If type is 'web_url', URL field MUST be present
- If type is 'postback', payload field MUST be present
- Payload, if present, MUST NOT exceed 1000 characters

### 2.4 Validation Error Handling

**When validation fails, the system SHALL:**

- Log descriptive error message indicating validation failure
- Return `null` to caller (not throw exception)
- NOT make API request to Instagram

## 3. Error Handling Requirements

### 3.1 Token Expiration

**When Instagram API returns error code 190, the system SHALL:**

- Throw `TokenExpiredError` exception (existing class)
- Include descriptive error message with `igUserId` and API error message
- Allow caller to implement token refresh logic

### 3.2 API Errors

**When Instagram API returns non-190 error codes, the system SHALL:**

- Log full error response from API
- Return `null` to caller
- NOT throw exception (allow graceful degradation)

### 3.3 Network Errors

**When network request fails, the system SHALL:**

- Allow native fetch exception to propagate to caller
- NOT catch network-level errors internally
- Enable caller to implement retry logic

### 3.4 Malformed Response

**When API returns unexpected response structure, the system SHALL:**

- Handle missing `message_id` gracefully
- Return `null` if response structure is invalid
- Log warning about unexpected response format

## 4. Data Integrity Requirements

### 4.1 Immutability

**The system SHALL NOT mutate input parameters:**

- Cards array passed to function remains unchanged
- Card objects within array remain unchanged
- No side effects on caller's data structures

### 4.2 Type Safety

**The system SHALL provide TypeScript type definitions for:**

- `CardButton` interface
- `CardElement` interface
- `GenericTemplatePayload` interface
- `AttachmentMessage` interface
- `SendCardReplyBody` interface

### 4.3 API Compliance

**The system SHALL construct payloads compliant with Instagram Graph API specification:**

- Template type MUST be 'generic'
- Attachment type MUST be 'template'
- Recipient ID format MUST be Instagram-scoped user ID (IGSID)
- Messaging type MUST be 'RESPONSE' for reply messages

## 5. Logging Requirements

### 5.1 Success Logging

**Upon successful message delivery, the system SHALL log:**

- Number of cards sent
- Recipient ID
- Success indicator (e.g., ✅ emoji)
- Message ID (if available)

### 5.2 Error Logging

**Upon failure, the system SHALL log:**

- Error type (validation, API, token expiration)
- Error details from Instagram API (if applicable)
- Affected user/account identifiers
- Error indicator (e.g., ❌ emoji or [ERROR] prefix)

### 5.3 Security Logging

**The system SHALL NOT log sensitive information:**

- Access tokens
- Full user identifiers (mask if necessary)
- Button payloads containing potentially sensitive data

## 6. Performance Requirements

### 6.1 Validation Performance

**The system SHALL complete validation within acceptable time:**

- Total validation time for max payload (10 cards × 3 buttons) SHOULD be < 1ms
- Validation logic SHALL be O(n×m) where n = cards, m = buttons

### 6.2 API Request Timeout

**The system SHALL handle API request timeouts:**

- Rely on fetch default timeout behavior
- Allow caller to implement custom timeout logic if needed

## 7. Security Requirements

### 7.1 Token Handling

**The system SHALL protect access tokens:**

- Never log access tokens
- Never include tokens in error messages
- Pass tokens only in Authorization header

### 7.2 Input Sanitization

**The system SHALL enforce length limits to prevent abuse:**

- Card title: 80 characters maximum
- Card subtitle: 80 characters maximum
- Button title: 20 characters maximum
- Button payload: 1000 characters maximum

### 7.3 URL Security

**The system SHOULD validate URLs when provided:**

- Image URLs SHOULD be HTTPS
- Button URLs SHOULD be HTTPS
- Consider implementing URL format validation helper

## 8. Testing Requirements

### 8.1 Unit Test Coverage

**The system SHALL have unit tests covering:**

- Valid single card delivery
- Valid carousel delivery (2-10 cards)
- Boundary conditions (max cards, max buttons, max lengths)
- Validation failures (empty array, too many cards, missing fields)
- Error handling (token expiration, API errors)
- Input immutability verification

### 8.2 Property-Based Testing

**The system SHALL have property-based tests verifying:**

- Card count constraints (1-10)
- Title length constraints (1-80)
- Button count constraints (0-3)
- Button type consistency
- Input immutability

### 8.3 Integration Testing

**The system SHOULD have integration tests verifying:**

- Actual Instagram API interaction
- Message delivery to test account
- Button functionality (web_url, postback)
- Error handling with invalid credentials

## 9. Documentation Requirements

### 9.1 Code Documentation

**The system SHALL include:**

- JSDoc comments for all exported functions
- TypeScript type definitions for all interfaces
- Inline comments explaining complex validation logic

### 9.2 Usage Examples

**The system SHALL provide examples for:**

- Single card with all optional fields
- Multi-card carousel
- Web URL buttons
- Postback buttons
- Error handling patterns

## 10. Compatibility Requirements

### 10.1 Runtime Compatibility

**The system SHALL be compatible with:**

- Deno runtime (Supabase Functions environment)
- TypeScript compilation
- Native fetch API

### 10.2 API Version Compatibility

**The system SHALL use:**

- Instagram Graph API v21.0
- Compatible with future minor version updates
- Version constant defined in shared configuration

### 10.3 Existing Code Compatibility

**The system SHALL NOT break:**

- Existing `sendReply` function signature
- Existing `TokenExpiredError` class
- Existing error handling patterns in codebase
