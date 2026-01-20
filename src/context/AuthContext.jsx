import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser()
        if (mounted) setUser(data?.user || null)
      } catch (e) {
        console.error('Auth init error', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signup = async (email, password, full_name = '', organization_name = '') => {
    try {
      // Step 1: Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password 
      })
      
      if (authError) throw authError
      
      const userId = authData?.user?.id
      if (!userId) throw new Error('User creation failed')

      // Step 2: CRITICAL - Login immediately to establish session
      // This ensures auth.uid() is available for RLS checks
      const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (sessionError) throw new Error('Auto-login failed: ' + sessionError.message)
      
      // Update user state with authenticated session
      setUser(sessionData.user)

      // Step 3: Create profile (now RLS can see auth.uid())
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ 
          id: userId, 
          email, 
          full_name 
        })
      
      if (profileError) {
        console.error('Profile creation error:', profileError)
        throw new Error('Failed to create profile: ' + profileError.message)
      }

      // Step 4: Create organization (auth.uid() now matches owner_id)
      const orgName = organization_name || `${full_name}'s Coaching Center`
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({ 
          name: orgName, 
          owner_id: userId  // This now matches auth.uid() from session
        })
        .select()
        .single()
      
      if (orgError) {
        console.error('Organization creation error:', orgError)
        throw new Error('Failed to create organization: ' + orgError.message)
      }

      // Step 5: Link user to organization
      const { error: linkError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: orgData.id,
          role: 'owner'
        })
      
      if (linkError) {
        console.error('User-org link error:', linkError)
        throw new Error('Failed to link user to organization: ' + linkError.message)
      }

      return { 
        success: true, 
        data: authData,
        autoLoggedIn: true
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { 
        success: false, 
        error: error.message || String(error) 
      }
    }
  }

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      setUser(data.user || null)
      return { success: true, data }
    } catch (error) {
      return { success: false, error: error.message || String(error) }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.warn('Logout error', e)
    } finally {
      setUser(null)
    }
  }

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
