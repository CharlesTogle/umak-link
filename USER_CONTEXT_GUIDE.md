# User Context & Auth Services - Usage Guide

## Overview
A global user context and authentication service for managing user accounts with Supabase integration.

## Files Created

### 1. `src/contexts/UserContext.tsx`
Global context for managing user state across the application.

### 2. `src/features/auth/services/authServices.ts`
Authentication services for Register, Login, and Logout operations.

### 3. `src/app/App.tsx` (Updated)
Wrapped with `UserProvider` to provide user context globally.

---

## User Interface

```typescript
interface User {
  user_id: string                    // UUID from Supabase
  user_name: string                  // Display name
  email: string                      // User email
  profile_picture_url: string | null // Profile picture URL
  user_type: 'User' | 'Staff' | 'Admin' // User role
  last_login: string | null          // Last login timestamp (ISO string)
}
```

---

## Using the User Context

### Basic Usage - Access Current User

```typescript
import { useUser } from '@/contexts/UserContext'

function MyComponent() {
  const { user, loading } = useUser()

  if (loading) {
    return <div>Loading user...</div>
  }

  if (!user) {
    return <div>Not logged in</div>
  }

  return (
    <div>
      <h1>Welcome, {user.user_name}!</h1>
      <p>Email: {user.email}</p>
      <p>Role: {user.user_type}</p>
      {user.profile_picture_url && (
        <img src={user.profile_picture_url} alt="Profile" />
      )}
    </div>
  )
}
```

### Update User Information

```typescript
import { useUser } from '@/contexts/UserContext'

function EditProfile() {
  const { user, updateUser } = useUser()
  const [name, setName] = useState(user?.user_name || '')

  const handleSave = async () => {
    try {
      await updateUser({ user_name: name })
      alert('Profile updated!')
    } catch (error) {
      console.error('Update failed:', error)
    }
  }

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="User Name"
      />
      <button onClick={handleSave}>Save</button>
    </div>
  )
}
```

### Refresh User Data

```typescript
import { useUser } from '@/contexts/UserContext'

function UserProfile() {
  const { user, refreshUser } = useUser()

  const handleRefresh = async () => {
    await refreshUser()
    console.log('User data refreshed!')
  }

  return (
    <div>
      <h2>{user?.user_name}</h2>
      <button onClick={handleRefresh}>Refresh Profile</button>
    </div>
  )
}
```

---

## Using Auth Services

### 1. Register New User

```typescript
import { authServices } from '@/features/auth/services/authServices'
import { useUser } from '@/contexts/UserContext'

function RegisterForm() {
  const { setUser } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')

  const handleRegister = async () => {
    const { user, error } = await authServices.Register({
      email,
      password,
      user_name: userName,
      user_type: 'User' // Optional: defaults to 'User'
    })

    if (error) {
      alert(`Registration failed: ${error}`)
      return
    }

    if (user) {
      setUser(user)
      alert('Registration successful!')
      // Navigate to home or dashboard
    }
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <input
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        placeholder="User Name"
      />
      <button onClick={handleRegister}>Register</button>
    </div>
  )
}
```

### 2. Login User

```typescript
import { authServices } from '@/features/auth/services/authServices'
import { useUser } from '@/contexts/UserContext'

function LoginForm() {
  const { setUser } = useUser()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const { user, error } = await authServices.Login({
      email,
      password
    })

    if (error) {
      alert(`Login failed: ${error}`)
      return
    }

    if (user) {
      setUser(user)
      alert(`Welcome back, ${user.user_name}!`)
      // Navigate to home or dashboard
    }
  }

  return (
    <div>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  )
}
```

### 3. Logout User

```typescript
import { authServices } from '@/features/auth/services/authServices'
import { useUser } from '@/contexts/UserContext'

function LogoutButton() {
  const { clearUser } = useUser()

  const handleLogout = async () => {
    const { error } = await authServices.Logout()

    if (error) {
      alert(`Logout failed: ${error}`)
      return
    }

    clearUser()
    alert('Logged out successfully!')
    // Navigate to login page
  }

  return <button onClick={handleLogout}>Logout</button>
}
```

---

## Full Authentication Flow Example

```typescript
import { useState } from 'react'
import { authServices } from '@/features/auth/services/authServices'
import { useUser } from '@/contexts/UserContext'
import { useIonRouter } from '@ionic/react'

function AuthPage() {
  const { user, setUser, clearUser } = useUser()
  const router = useIonRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    
    if (mode === 'register') {
      const { user, error } = await authServices.Register({
        email,
        password,
        user_name: userName
      })
      
      if (error) {
        alert(error)
        setLoading(false)
        return
      }
      
      setUser(user)
      router.push('/user/home', 'none', 'replace')
    } else {
      const { user, error } = await authServices.Login({
        email,
        password
      })
      
      if (error) {
        alert(error)
        setLoading(false)
        return
      }
      
      setUser(user)
      router.push('/user/home', 'none', 'replace')
    }
    
    setLoading(false)
  }

  const handleLogout = async () => {
    await authServices.Logout()
    clearUser()
    router.push('/auth', 'none', 'replace')
  }

  if (user) {
    return (
      <div>
        <h1>Welcome, {user.user_name}!</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  }

  return (
    <div>
      <h1>{mode === 'login' ? 'Login' : 'Register'}</h1>
      
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      
      {mode === 'register' && (
        <input
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder="User Name"
        />
      )}
      
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Register'}
      </button>
      
      <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        Switch to {mode === 'login' ? 'Register' : 'Login'}
      </button>
    </div>
  )
}
```

---

## Role-Based Access Control Example

```typescript
import { useUser } from '@/contexts/UserContext'

function AdminPanel() {
  const { user } = useUser()

  if (!user) {
    return <div>Please login</div>
  }

  if (user.user_type !== 'Admin') {
    return <div>Access denied. Admin only.</div>
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin-only content */}
    </div>
  )
}

// Or as a custom hook
function useRequireAuth(requiredRole?: 'User' | 'Staff' | 'Admin') {
  const { user, loading } = useUser()
  const router = useIonRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth', 'none', 'replace')
    } else if (!loading && requiredRole && user?.user_type !== requiredRole) {
      router.push('/unauthorized', 'none', 'replace')
    }
  }, [user, loading, requiredRole, router])

  return { user, loading }
}

// Usage
function StaffOnlyPage() {
  const { user, loading } = useRequireAuth('Staff')

  if (loading) return <div>Loading...</div>

  return <div>Staff content for {user?.user_name}</div>
}
```

---

## API Reference

### UserContext API

```typescript
interface UserContextType {
  user: User | null              // Current user or null if not logged in
  loading: boolean               // True while initializing or fetching user
  setUser: (user: User | null) => void  // Manually set user
  refreshUser: () => Promise<void>      // Refresh user from Supabase
  updateUser: (updates: Partial<User>) => Promise<void>  // Update user in DB
  clearUser: () => void          // Clear user (for logout)
}
```

### Auth Services API

```typescript
// Register
authServices.Register(params: RegisterParams): Promise<LoginResponse>

interface RegisterParams {
  email: string
  password: string
  user_name: string
  user_type?: 'User' | 'Staff' | 'Admin'  // Optional, defaults to 'User'
  profile_picture_url?: string             // Optional
}

// Login
authServices.Login(params: LoginParams): Promise<LoginResponse>

interface LoginParams {
  email: string
  password: string
}

// Logout
authServices.Logout(): Promise<{ error: string | null }>

// Common response
interface LoginResponse {
  user: User | null
  error: string | null
}
```

---

## Supabase Table Schema

Make sure your Supabase `users` table has these columns:

```sql
CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profile_picture_url TEXT,
  user_type TEXT NOT NULL DEFAULT 'User' CHECK (user_type IN ('User', 'Staff', 'Admin')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## Features

✅ Global user state management  
✅ Automatic session restoration on app load  
✅ Supabase auth integration  
✅ Real-time auth state changes  
✅ Register, Login, Logout functionality  
✅ User profile updates  
✅ Role-based access (User, Staff, Admin)  
✅ Last login tracking  
✅ Error handling  
✅ TypeScript support  

---

## Notes

1. **Automatic Session Restoration**: When the app loads, `UserContext` automatically checks for an existing Supabase session and loads the user data.

2. **Auth State Listener**: The context listens for Supabase auth changes (sign in, sign out, token refresh) and updates the user state automatically.

3. **Error Handling**: All auth methods return error messages if something goes wrong. Always check for errors before proceeding.

4. **Security**: User data is fetched from your Supabase `users` table. Make sure Row Level Security (RLS) is enabled on this table.

5. **Google/Social Login**: The existing Google OAuth and Social Login flows should work alongside this. After successful OAuth, you'll need to create/fetch the user record from the `users` table.

---

## Next Steps

1. Create the `users` table in Supabase with the schema above
2. Test the Register flow
3. Test the Login flow
4. Test the Logout flow
5. Update `ProtectedRoute` to use `useUser()` instead of mock data
6. Integrate with existing Google OAuth flow
