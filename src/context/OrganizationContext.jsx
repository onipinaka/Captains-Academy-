import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const OrganizationContext = createContext(null)

export function OrganizationProvider({ children }) {
  const [organizations, setOrganizations] = useState([])
  const [currentOrganization, setCurrentOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load user's organizations
  const loadOrganizations = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }
      
      if (!user) {
        console.log('No user found')
        setOrganizations([])
        setCurrentOrganization(null)
        setLoading(false)
        return
      }

      console.log('Loading organizations for user:', user.id)

      // Get organizations user belongs to
      const { data: userOrgs, error } = await supabase
        .from('user_organizations')
        .select('organization_id, organizations(*)')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading user_organizations:', error)
        throw error
      }

      console.log('Raw userOrgs data:', userOrgs)

      const orgs = userOrgs?.map(uo => uo.organizations).filter(Boolean) || []
      console.log('Processed organizations:', orgs)
      
      setOrganizations(orgs)

      // Set current organization from localStorage or default to first
      const savedOrgId = localStorage.getItem('currentOrganizationId')
      if (savedOrgId && orgs.find(o => o.id === savedOrgId)) {
        setCurrentOrganization(orgs.find(o => o.id === savedOrgId))
        console.log('Set current org from localStorage:', savedOrgId)
      } else if (orgs.length > 0) {
        setCurrentOrganization(orgs[0])
        localStorage.setItem('currentOrganizationId', orgs[0].id)
        console.log('Set current org to first:', orgs[0].id)
      } else {
        console.warn('No organizations found for user')
      }
    } catch (error) {
      console.error('Error loading organizations:', error)
      // Don't block the app - set empty state but still finish loading
      setOrganizations([])
      setCurrentOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        loadOrganizations()
      } else if (event === 'SIGNED_OUT') {
        setOrganizations([])
        setCurrentOrganization(null)
        localStorage.removeItem('currentOrganizationId')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const switchOrganization = (orgId) => {
    const org = organizations.find(o => o.id === orgId)
    if (org) {
      setCurrentOrganization(org)
      localStorage.setItem('currentOrganizationId', orgId)
    }
  }

  const refreshOrganizations = () => {
    loadOrganizations()
  }

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        loading,
        switchOrganization,
        refreshOrganizations
      }}
    >
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}

export default OrganizationContext
