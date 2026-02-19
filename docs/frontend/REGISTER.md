# Register Flow Documentation

## Overview
This document describes the frontend implementation of the user registration flow, including API integration, error handling, and UI behavior.

## API Endpoint

**Method:** `POST`  
**Path:** `/api/v1/auth/register`  
**Content-Type:** `application/json`

### Request Body
```typescript
interface RegisterPayload {
  name: string;        // Required
  email: string;      // Required, must be valid email
  password: string;   // Required, min 8 characters
  phone?: string;     // Optional
  company?: string;   // Optional
}
```

### Success Response (201)
```typescript
interface RegisterResponse {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      company?: string;
      createdAt: string;
      updatedAt: string;
    };
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
}
```

### Error Responses

#### 400 - Validation Error
```typescript
{
  message: "Validation failed",
  errors: [
    { field: "email", message: "Invalid email format" },
    { field: "password", message: "Password too short" }
  ]
}
```

#### 409 - Duplicate Email
```typescript
{
  message: "Email already exists"
}
```

#### 429 - Rate Limited
```typescript
{
  message: "Too many requests, please try again later"
}
```

## Service Functions

### `createUser(payload: RegisterPayload): Promise<RegisterResponse>`
Located in `app/services/auth.ts`

- Makes POST request to `/api/v1/auth/register`
- On success: stores tokens and user data in secure storage
- Returns parsed response data

### `handleAuthError(error: unknown)`
Located in `app/services/auth.ts`

Parses API errors and returns structured error information:
- `message`: Human-readable error message
- `isDuplicateEmail`: Boolean for 409 errors
- `isRateLimited`: Boolean for 429 errors
- `fieldErrors`: Array of field-specific validation errors

## Storage

Tokens are stored securely using `expo-secure-store`:
- `access_token` - JWT access token
- `refresh_token` - JWT refresh token
- `user_data` - Serialized user object

## UI Flow

### Register Screen (`app/signup.tsx`)

1. **Initial State**
   - All form fields empty
   - Terms checkbox unchecked
   - Submit button enabled

2. **User Input**
   - User fills in: Full Name, Email, Password
   - User checks "I agree to Terms of Service"

3. **Client-Side Validation** (before API call)
   - Full Name: Required
   - Email: Required, must be valid format
   - Password: Required, minimum 8 characters
   - Terms: Must be checked

4. **Submission**
   - Button shows loading spinner
   - Form inputs disabled
   - API call initiated

5. **Success Flow**
   - Tokens stored in secure storage
   - User data stored in state
   - Navigate to home (`/`)

6. **Error Handling**

   | Error Type | User Message |
   |------------|---------------|
   | 400 (field errors) | Inline field errors below each input |
   | 409 (duplicate) | "Email already registered — try login" |
   | 429 (rate limit) | "Too many requests, please wait" |
   | Network/Other | "An unexpected error occurred" |

## Usage Example

```typescript
import { useAuth } from './contexts/AuthContext';

function RegisterScreen() {
  const { login } = useAuth();
  
  const handleRegister = async () => {
    const result = await login({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    });
    
    if (result.success) {
      // Navigate to home
    } else {
      // Handle errors
      // result.error - general error message
      // result.fieldErrors - array of field-specific errors
    }
  };
}
```

## Security Considerations

1. **Password Handling**
   - Never log passwords
   - Passwords are sent only in POST body
   - Stored passwords are never logged

2. **Token Storage**
   - Tokens stored in secure storage (expo-secure-store)
   - Tokens cleared on logout

3. **Input Validation**
   - Client-side validation before API call
   - Server-side validation errors displayed inline

## Testing

### Unit Tests
- `__tests__/services/auth.test.ts` - Tests for createUser and handleAuthError

### Integration Tests
- `__tests__/integration/register.test.tsx` - Tests for Register screen flow

### Run Tests
```bash
npm test           # Run all tests
npm run test:watch # Run in watch mode
npm run test:coverage # Generate coverage report
```

## File Structure
```
app/
├── services/
│   ├── api.ts        # Base API client
│   ├── auth.ts       # Auth service functions
│   └── storage.ts    # Secure storage utilities
├── contexts/
│   └── AuthContext.tsx  # Auth state management
├── signup.tsx        # Register screen
└── login.tsx         # Login screen

__tests__/
├── services/
│   └── auth.test.ts     # Unit tests
└── integration/
    └── register.test.tsx # Integration tests

docs/
└── frontend/
    └── REGISTER.md      # This documentation
```
