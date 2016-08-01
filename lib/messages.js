var error_messages = {
    invalid_issuer: "Invalid ISSUER",
    code_state_missing: "Code or state missing in response",
    state_differs: "Session state differs from response state",
    access_token_failed: "Access token request failed",
    access_token_json_parsing_error: "Access token invalid, JSON parsing failed",
    id_token_present: "ID Token not present in token response"
}
exports.messages = error_messages;
