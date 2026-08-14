export const errors = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Something went wrong',
  REQUIRED_FIELD: 'This field is required',
  FIELD_TOO_LONG: 'This field exceeds the maximum length',
  FIELD_TOO_SHORT: 'This field is too short',

  INTENT_REQUIRED: 'Please describe your intent',
  INTENT_LENGTH_INVALID: 'The intent must be between 1 and 500 characters',
  CHANNEL_ACCOUNT_ID_REQUIRED: 'The account is required',
  RATE_LIMIT_SUGGESTIONS: 'Too many suggestions, try again in a minute',
  RULE_SUGGESTION_FAILED: 'Could not generate the rule suggestion',

  ACCOUNT_ID_REQUIRED: 'The account is required',
  DISCOUNT_CODE_FIELDS_REQUIRED: 'The account and code are required',
  DISCOUNT_AMOUNT_REQUIRED: 'A percentage or amount discount is required',
  DISCOUNT_CODE_CREATE_FAILED: 'Could not create the discount code (it may already exist)',

  INVALID_BODY: 'Invalid request body',
  NODES_EDGES_MUST_BE_ARRAYS: 'Invalid flow structure',
  TOO_MANY_NODES: 'This flow exceeds the maximum allowed number of nodes',
  TOO_MANY_EDGES: 'This flow exceeds the maximum allowed number of connections',
  TRIGGER_NODE_REQUIRED: 'A flow must have exactly one trigger node',
  EXTERNAL_REQUEST_URL_INVALID: 'The URL provided for this node is invalid',
  FLOW_SAVE_FAILED: 'Could not save the flow',

  INVALID_FROM_PARAM: 'Invalid "from" parameter',
  INVALID_TO_PARAM: 'Invalid "to" parameter',

  boundary: {
    title: 'Unable to load this page',
    description: 'An error occurred while fetching your data. Please try again in a moment.',
    retry: 'Try again',
  },
}
