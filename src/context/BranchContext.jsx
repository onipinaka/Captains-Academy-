// BranchContext removed — kept stub to avoid runtime import errors.
import React from 'react'

export function BranchProvider({ children }) {
  return React.createElement(React.Fragment, null, children)
}

export function useBranch() {
  return {
    branches: [],
    branch: null,
    setBranch: () => {},
    loading: false
  }
}

export default null
