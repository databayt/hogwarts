"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useMemo } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import config from './config.json'
import { useMediaQuery } from "./use-media-query"

interface School {
  SCHUL_NM: string
  ATPT_OFCDC_SC_NM: string
  SCHUL_KND_SC_NM: string
  SD_SCHUL_CODE: string
}

interface ClassConfig {
  school: string
  schoolCode: string
  grade: string
  class: string
  lunchAfter: number
  showAllSubjects: boolean
  displayFallbackData: boolean
}

interface ConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classConfig: ClassConfig
  onConfigChange: (config: ClassConfig) => void
  onSave: (config: ClassConfig) => void
}

const API_URL = config.isDev ? config.development.apiUrl : config.production.apiUrl
const DEBUG = config.isDev ? config.development.debug : config.production.debug
const USE_LOCAL_JSON = Boolean((config as any).useLocalJson)

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log(...args)
  }
}

function debounce<T extends (...args: any[]) => void>(
  fn: T,
  waitMs = 500,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), waitMs)
  }
}

export function ConfigDialog({ open, onOpenChange, classConfig, onConfigChange, onSave }: ConfigDialogProps) {
  const [tempConfig, setTempConfig] = useState(classConfig)
  const [schools, setSchools] = useState<School[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isSmallScreen = useMediaQuery("(max-width: 640px)")

  // Update debug logs to use the log function
  useEffect(() => {
    log('Schools updated:', schools)
    log('Open combobox:', openCombobox)
    log('Search value:', searchValue)
  }, [schools, openCombobox, searchValue])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setTempConfig(classConfig)
      setSearchValue(classConfig.school) // Set initial search value to current school
      setError(null)
      if (classConfig.school) {
        searchSchools(classConfig.school) // Search for current school when dialog opens
      } else {
        setSchools([])
      }
    }
  }, [open, classConfig])

  // Update classes when school and grade change
  useEffect(() => {
    if (tempConfig.schoolCode && tempConfig.grade) {
      fetchClasses(tempConfig.schoolCode, tempConfig.grade)
    }
  }, [tempConfig.schoolCode, tempConfig.grade])

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (isSearching || !tempConfig.schoolCode) {
        setTempConfig(prev => ({
          ...prev,
          school: '',
          schoolCode: '',
          grade: '',
          class: ''
        }))
        setSearchValue('')
      }
      setIsSearching(false)
    }
    setOpenCombobox(open)
    onOpenChange(open)
  }

  const handleSearchValueChange = (value: string) => {
    log('Search value changing from:', searchValue, 'to:', value)
    setSearchValue(value)
    setIsSearching(true)
    setOpenCombobox(true)
    
    if (value.length < 2) {
      log('Search value too short, clearing results')
      setSchools([])
      setError(null)
      return
    }
    
    log('Initiating search for:', value)
    searchSchools(value)
  }

  const handleSchoolSelect = (schoolName: string) => {
    const school = schools.find(s => s.SCHUL_NM === schoolName)
    if (!school) return

    setTempConfig(prev => ({
      ...prev,
      school: schoolName,
      schoolCode: school.SD_SCHUL_CODE,
      grade: '',
      class: ''
    }))
    setSearchValue(schoolName)
    setIsSearching(false)
    setOpenCombobox(false)
  }

  const getAvailableGrades = (schoolName: string) => {
    const school = schools.find(s => s.SCHUL_NM === schoolName)
    const isElementary = (
      school?.SCHUL_KND_SC_NM === '초등학교' ||
      school?.SCHUL_KND_SC_NM?.toLowerCase() === 'elementary school' ||
      /초등학교$/.test(school?.SCHUL_NM || '') ||
      /elementary school$/i.test(school?.SCHUL_NM || '')
    )
    return isElementary ? Array.from({ length: 6 }, (_, i) => (i + 1).toString()) : ['1', '2', '3']
  }

  // Fetch available classes when school and grade are selected
  const fetchClasses = async (schoolCode: string, grade: string) => {
    try {
      setError(null)
      const response = await fetch(
        USE_LOCAL_JSON
          ? `/timetable/classes.json`
          : `${API_URL}/classes?grade=${grade}&schoolcode=${schoolCode}`
      )
      if (!response.ok) throw new Error('Failed to load class list')
      const data = await response.json()
      setAvailableClasses(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length === 0) {
        setError('No classes found for the selected grade')
      }
    } catch (error) {
      console.error('Error fetching classes:', error)
      setAvailableClasses([])
      setError(error instanceof Error ? error.message : 'An error occurred while loading classes')
    }
  }

  // Update searchSchools to use the log function
  const searchSchools = useMemo(() =>
    debounce(async (query: string) => {
      log('Debounced search executing for:', query)
      if (query.length < 2) {
        setSchools([])
        setError(null)
        setIsSearching(false)
        return
      }
      
      setIsLoading(true)
      setOpenCombobox(true)
      try {
        setError(null)
        log('Fetching schools for query:', query)
        const response = await fetch(
          USE_LOCAL_JSON
            ? `/timetable/schools.json`
            : `${API_URL}/school?schoolname=${encodeURIComponent(query)}`
        )
        if (!response.ok) throw new Error('Failed to load school list')
        const data = await response.json()
        log('Search results received:', data)
        setSchools(Array.isArray(data) ? data : [])
        if (Array.isArray(data) && data.length === 0) {
          setError('No results found')
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
        setSchools([])
        setError(error instanceof Error ? error.message : 'An error occurred while loading schools')
      } finally {
        setIsLoading(false)
        setIsSearching(false)
        setOpenCombobox(true)
      }
    }, 500),
    []
  )

  const ConfigContent = () => (
    <div className="grid gap-4 py-4">
      <div className="flex flex-col gap-2">
        <Label className="dark:text-neutral-200">School</Label>
        <Popover 
          open={openCombobox}
          onOpenChange={(open) => {
            setOpenCombobox(open)
          }}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={openCombobox}
              className="justify-between w-full dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100"
              onClick={() => {
                setOpenCombobox(true)
              }}
            >
              {searchValue || "Search school..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[var(--radix-popover-trigger-width)] p-0 dark:bg-neutral-800 dark:border-neutral-700"
            align="start"
          >
            <Command 
              className="dark:bg-neutral-800"
              filter={() => 1}
              shouldFilter={false}
            >
              <CommandInput 
                placeholder="Search school name..." 
                value={searchValue}
                onValueChange={handleSearchValueChange}
                className="dark:bg-neutral-800 dark:text-neutral-100"
              />
              
              <CommandList>
                {error ? (
                  <p className="py-6 text-center muted dark:text-neutral-400">
                    {error}
                  </p>
                ) : searchValue.length <= 1 ? (
                  <CommandEmpty className="py-6 text-center muted dark:text-neutral-400">
                    학교 이름을 입력하세요
                  </CommandEmpty>
                 ) : isLoading ? (
                  <p className="py-6 text-center muted dark:text-neutral-400">Searching...</p>
                ) : schools.length === 0 ? (
                  <p className="py-6 text-center muted dark:text-neutral-400">No results</p>
                ) : (
                  <CommandGroup>
                    {schools.map((school) => (
                        <CommandItem
                          key={`${school.SCHUL_NM}-${school.SD_SCHUL_CODE}`}
                          onSelect={() => handleSchoolSelect(school.SCHUL_NM)}
                          className="dark:text-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              tempConfig.school === school.SCHUL_NM ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {school.SCHUL_NM}
                          <small className="ml-2 text-neutral-500 dark:text-neutral-400">
                            ({school.ATPT_OFCDC_SC_NM})
                          </small>
                        </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="muted dark:text-neutral-400 mt-1">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="dark:text-neutral-200">Grade</Label>
          <Select
            disabled={!tempConfig.school || isSearching}
            value={tempConfig.grade}
            onValueChange={(value) => setTempConfig({ ...tempConfig, grade: value, class: '' })}
          >
            <SelectTrigger className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
              <SelectValue placeholder="Select grade" />
            </SelectTrigger>
            <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
              {tempConfig.school && getAvailableGrades(tempConfig.school).map((grade) => (
                <SelectItem 
                  key={grade} 
                  value={grade}
                  className="dark:text-neutral-100 dark:focus:bg-neutral-700"
                >
                   Grade {grade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="dark:text-neutral-200">Class</Label>
          <Select
            disabled={!tempConfig.school || !tempConfig.grade || isSearching}
            value={tempConfig.class}
            onValueChange={(value) => setTempConfig({ ...tempConfig, class: value })}
          >
            <SelectTrigger className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
              {availableClasses.map((classNum) => (
                <SelectItem 
                  key={classNum} 
                  value={classNum}
                  className="dark:text-neutral-100 dark:focus:bg-neutral-700"
                >
                  Class {classNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div>
        <Label className="dark:text-neutral-200">Lunch after period</Label>
        <Select
          disabled={!tempConfig.school || !tempConfig.grade || !tempConfig.class || isSearching}
          value={tempConfig.lunchAfter.toString()}
          onValueChange={(value) => setTempConfig({ ...tempConfig, lunchAfter: parseInt(value) })}
        >
          <SelectTrigger className="dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-100">
            <SelectValue placeholder="Select lunch period" />
          </SelectTrigger>
          <SelectContent className="dark:bg-neutral-800 dark:border-neutral-700">
            {[3, 4, 5].map((period) => (
              <SelectItem 
                key={period} 
                value={period.toString()}
                className="dark:text-neutral-100 dark:focus:bg-neutral-700"
              >
                After period {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showAllSubjects"
            checked={tempConfig.showAllSubjects}
            onChange={(e) => setTempConfig({ ...tempConfig, showAllSubjects: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-blue-400"
          />
          <Label htmlFor="showAllSubjects" className="dark:text-neutral-200">
            Show all subjects in subject selection
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="displayFallbackData"
            checked={tempConfig.displayFallbackData}
            onChange={(e) => setTempConfig({ ...tempConfig, displayFallbackData: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800 dark:focus:ring-blue-400"
          />
          <Label htmlFor="displayFallbackData" className="dark:text-neutral-200">
            Display fallback data when main data is unavailable
          </Label>
        </div>
      </div>
      
      <Button 
        onClick={() => onSave(tempConfig)}
        disabled={!tempConfig.school || !tempConfig.grade || !tempConfig.class || isSearching}
        className="w-full sm:w-auto"
      >
        Save
      </Button>
    </div>
  )

  if (isSmallScreen) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85%]">
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Configure your class information.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <ConfigContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "dark:bg-neutral-900/90 dark:border-neutral-800",
          "w-[90%] max-w-lg p-6",
          "rounded-lg",
          "data-[state=open]:animate-in data-[state=closed]:animate-out",
          "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
          "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=closed]:slide-out-to-left-1/2",
          "data-[state=open]:slide-in-from-top-[48%] data-[state=closed]:slide-out-to-top-[48%]",
          "backdrop-blur-sm"
        )}
      >
        <DialogHeader>
          <DialogTitle className="dark:text-neutral-100">Settings</DialogTitle>
          <DialogDescription className="dark:text-neutral-400">
            Configure your class information.
          </DialogDescription>
        </DialogHeader>
        <ConfigContent />
      </DialogContent>
    </Dialog>
  )
}
