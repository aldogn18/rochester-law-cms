'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface Column<T> {
  key: keyof T
  label: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  pagination?: {
    page: number
    totalPages: number
    totalItems: number
    onPageChange: (page: number) => void
  }
  sorting?: {
    field: keyof T | null
    direction: 'asc' | 'desc' | null
    onSort: (field: keyof T) => void
  }
  filtering?: {
    query: string
    onFilter: (query: string) => void
  }
  selection?: {
    selectedItems: string[]
    onSelectionChange: (selectedItems: string[]) => void
    getItemId: (item: T) => string
  }
  actions?: {
    label: string
    onClick: (items: T[]) => void
    disabled?: (items: T[]) => boolean
  }[]
  className?: string
  emptyMessage?: string
  onRefresh?: () => void
}

function DataTable<T>({
  data,
  columns,
  loading = false,
  pagination,
  sorting,
  filtering,
  selection,
  actions,
  className = '',
  emptyMessage = 'No data available',
  onRefresh
}: DataTableProps<T>) {
  const [localFilter, setLocalFilter] = useState('')
  const [localSort, setLocalSort] = useState<{ field: keyof T | null; direction: 'asc' | 'desc' | null }>({
    field: null,
    direction: null
  })

  // Use local state if no external state provided
  const filterQuery = filtering?.query ?? localFilter
  const sortField = sorting?.field ?? localSort.field
  const sortDirection = sorting?.direction ?? localSort.direction

  // Filter and sort data locally if no external handlers
  const processedData = useMemo(() => {
    let result = [...data]

    // Local filtering
    if (!filtering && filterQuery) {
      result = result.filter(item => {
        return columns.some(column => {
          if (!column.filterable) return false
          const value = String(item[column.key] || '').toLowerCase()
          return value.includes(filterQuery.toLowerCase())
        })
      })
    }

    // Local sorting
    if (!sorting && sortField && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        
        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1
        
        return sortDirection === 'desc' ? -comparison : comparison
      })
    }

    return result
  }, [data, columns, filterQuery, sortField, sortDirection, filtering, sorting])

  const handleSort = useCallback((field: keyof T) => {
    if (sorting) {
      sorting.onSort(field)
    } else {
      setLocalSort(prev => ({
        field,
        direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
      }))
    }
  }, [sorting])

  const handleFilter = useCallback((query: string) => {
    if (filtering) {
      filtering.onFilter(query)
    } else {
      setLocalFilter(query)
    }
  }, [filtering])

  const handleSelectAll = useCallback((checked: boolean) => {
    if (!selection) return
    
    if (checked) {
      const allIds = processedData.map(selection.getItemId)
      selection.onSelectionChange(allIds)
    } else {
      selection.onSelectionChange([])
    }
  }, [selection, processedData])

  const handleSelectItem = useCallback((itemId: string, checked: boolean) => {
    if (!selection) return
    
    const newSelection = checked
      ? [...selection.selectedItems, itemId]
      : selection.selectedItems.filter(id => id !== itemId)
    
    selection.onSelectionChange(newSelection)
  }, [selection])

  const selectedItems = useMemo(() => {
    if (!selection) return []
    return processedData.filter(item => 
      selection.selectedItems.includes(selection.getItemId(item))
    )
  }, [processedData, selection])

  const isAllSelected = selection && processedData.length > 0 && 
    processedData.every(item => selection.selectedItems.includes(selection.getItemId(item)))
  
  const isSomeSelected = selection && selection.selectedItems.length > 0 && !isAllSelected

  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-300" />
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-blue-600" />
      : <ChevronDownIcon className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Table Header with Search and Actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={filterQuery}
                onChange={(e) => handleFilter(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter indicator */}
            {filterQuery && (
              <div className="flex items-center text-sm text-gray-600">
                <FunnelIcon className="w-4 h-4 mr-1" />
                Filtered
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Selection actions */}
            {selection && selectedItems.length > 0 && actions && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => action.onClick(selectedItems)}
                    disabled={action.disabled?.(selectedItems)}
                    className="btn btn-sm btn-secondary"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            {/* Refresh button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                aria-label="Refresh data"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selection && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected || false}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected || false
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="spinner mr-2"></div>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => {
                const itemId = selection?.getItemId(row)
                const isSelected = itemId && selection?.selectedItems.includes(itemId)
                
                return (
                  <tr key={itemId || index} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                    {selection && (
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected || false}
                          onChange={(e) => itemId && handleSelectItem(itemId, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={String(column.key)}
                        className={`px-4 py-4 text-sm ${
                          column.align === 'center' ? 'text-center' : 
                          column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {column.render ? 
                          column.render(row[column.key], row) : 
                          String(row[column.key] || '')
                        }
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.totalPages} 
              <span className="ml-2 text-gray-500">
                ({pagination.totalItems} total items)
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i
                if (pageNum > pagination.totalPages) return null
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => pagination.onPageChange(pageNum)}
                    className={`px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100 ${
                      pageNum === pagination.page ? 'bg-blue-600 text-white border-blue-600' : ''
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DataTable