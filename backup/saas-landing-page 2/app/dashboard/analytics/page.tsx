"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInventoryItems, getTransactions, getProductAnalytics, getCategoryAnalytics } from "@/lib/data"
import type { Transaction, InventoryItem } from "@/lib/types"
import { BarChart } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ChevronDown,
  ChevronUp,
  Search,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Info,
  Download,
  Calendar,
  FileText,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format, subDays, isAfter, isBefore } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { PriceAndUsageAnalytics } from "@/components/cost-analytics"

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [popularItems, setPopularItems] = useState<{ name: string; value: number }[]>([])
  const [dailyVisits, setDailyVisits] = useState<{ date: string; count: number }[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number }[]>([])
  const [busiestDays, setBusiestDays] = useState<{ name: string; value: number }[]>([])
  const [busiestTimes, setBusiestTimes] = useState<{ name: string; value: number }[]>([])
  const [specificFoodDistribution, setSpecificFoodDistribution] = useState<
    { name: string; value: number; category: string }[]
  >([])

  // New states for enhanced analytics
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [categoryItemsDialogOpen, setCategoryItemsDialogOpen] = useState(false)
  const [categoryItems, setCategoryItems] = useState<{ name: string; value: number; currentStock: number }[]>([])
  const [productAnalytics, setProductAnalytics] = useState<
    {
      id: string
      name: string
      category: string
      currentStock: number
      totalSold: number
      totalRestocked: number
      popularityScore: number
      turnoverRate: number
    }[]
  >([])
  const [filteredProductAnalytics, setFilteredProductAnalytics] = useState<typeof productAnalytics>([])
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productSortField, setProductSortField] = useState("totalSold")
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("desc")

  // Date range states
  const [timeRange, setTimeRange] = useState("all") // all, week, month, custom
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30))
  const [dateTo, setDateTo] = useState<Date>(new Date())
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)

  // Filtered data based on date range
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Format number to show at most 1 decimal place
  const formatNumber = (num: number): string => {
    return Number.isInteger(num) ? num.toString() : num.toFixed(1)
  }

  useEffect(() => {
    // Load transaction data
    const transactionData = getTransactions()
    setTransactions(transactionData)

    // Load inventory items
    const items = getInventoryItems()
    setInventoryItems(items)

    // Get product analytics data
    const analytics = getProductAnalytics()
    setProductAnalytics(analytics)

    // Calculate popular items
    const itemCounts: Record<string, number> = {}
    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        if (!itemCounts[transaction.itemName]) {
          itemCounts[transaction.itemName] = 0
        }
        itemCounts[transaction.itemName] += transaction.quantity
      }
    })

    const sortedItems = Object.entries(itemCounts)
      .map(([name, count]) => ({
        name,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    setPopularItems(sortedItems)

    // Calculate daily visits
    const visitsByDate: Record<string, Set<string>> = {}
    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        const date = new Date(transaction.timestamp).toLocaleDateString()
        if (!visitsByDate[date]) {
          visitsByDate[date] = new Set()
        }
        visitsByDate[date].add(transaction.user)
      }
    })

    const dailyVisitData = Object.entries(visitsByDate)
      .map(([date, users]) => ({ date, count: users.size }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Last 7 days

    setDailyVisits(dailyVisitData)

    // Calculate category distribution
    const categoryCounts: Record<string, number> = {}

    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        const item = items.find((i) => i.id === transaction.itemId)
        if (item) {
          if (!categoryCounts[item.category]) {
            categoryCounts[item.category] = 0
          }
          categoryCounts[item.category] += transaction.quantity
        }
      }
    })

    const categoryData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
    setCategoryDistribution(categoryData)

    // Calculate busiest days of the week
    const dayOfWeekCounts: Record<string, number> = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    }

    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        const date = new Date(transaction.timestamp)
        const dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()]
        dayOfWeekCounts[dayOfWeek] += 1
      }
    })

    const busiestDaysData = Object.entries(dayOfWeekCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        // Sort by day of week order
        const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        return days.indexOf(a.name) - days.indexOf(b.name)
      })

    setBusiestDays(busiestDaysData)

    // Calculate busiest times of day
    const timeOfDayCounts: Record<string, number> = {
      "Morning (6-11AM)": 0,
      "Afternoon (12-5PM)": 0,
      "Evening (6-11PM)": 0,
      "Night (12-5AM)": 0,
    }

    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        const date = new Date(transaction.timestamp)
        const hour = date.getHours()

        if (hour >= 6 && hour < 12) {
          timeOfDayCounts["Morning (6-11AM)"] += 1
        } else if (hour >= 12 && hour < 18) {
          timeOfDayCounts["Afternoon (12-5PM)"] += 1
        } else if (hour >= 18 && hour < 24) {
          timeOfDayCounts["Evening (6-11PM)"] += 1
        } else {
          timeOfDayCounts["Night (12-5AM)"] += 1
        }
      }
    })

    const busiestTimesData = Object.entries(timeOfDayCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        // Sort by time of day order
        const times = ["Morning (6-11AM)", "Afternoon (12-5PM)", "Evening (6-11PM)", "Night (12-5AM)"]
        return times.indexOf(a.name) - times.indexOf(b.name)
      })

    setBusiestTimes(busiestTimesData)

    // Calculate specific food distribution with categories
    const specificFoodCounts: Record<string, { count: number; category: string }> = {}

    transactionData.forEach((transaction) => {
      if (transaction.type === "out") {
        if (!specificFoodCounts[transaction.itemName]) {
          // Find the category for this item
          const item = items.find((item) => item.id === transaction.itemId)
          specificFoodCounts[transaction.itemName] = {
            count: 0,
            category: item?.category || "unknown",
          }
        }
        specificFoodCounts[transaction.itemName].count += transaction.quantity
      }
    })

    const specificFoodData = Object.entries(specificFoodCounts)
      .map(([name, data]) => ({
        name,
        value: data.count,
        category: data.category,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15) // Top 15 items

    setSpecificFoodDistribution(specificFoodData)

    // Initialize filtered transactions
    filterTransactionsByDateRange(transactionData, analytics, timeRange, dateFrom, dateTo)
  }, [])

  // Function to filter transactions by date range
  const filterTransactionsByDateRange = (
    allTransactions: Transaction[],
    allProductAnalytics: typeof productAnalytics,
    range: string,
    from: Date,
    to: Date,
  ) => {
    let filtered: Transaction[]

    // Create new Date objects to avoid modifying the original dates
    const fromDate = new Date(from)
    const toDate = new Date(to)

    // Set time to beginning and end of day
    fromDate.setHours(0, 0, 0, 0)
    toDate.setHours(23, 59, 59, 999)

    switch (range) {
      case "week":
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        weekAgo.setHours(0, 0, 0, 0)
        filtered = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.timestamp)
          return transactionDate >= weekAgo
        })
        break
      case "month":
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        monthAgo.setHours(0, 0, 0, 0)
        filtered = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.timestamp)
          return transactionDate >= monthAgo
        })
        break
      case "custom":
        filtered = allTransactions.filter((transaction) => {
          const transactionDate = new Date(transaction.timestamp)
          return transactionDate >= fromDate && transactionDate <= toDate
        })
        break
      default: // 'all'
        filtered = allTransactions
    }

    setFilteredTransactions(filtered)

    // Filter product analytics based on the date range
    if (range !== "all") {
      const filteredProductData = allProductAnalytics.map((product) => {
        // Get transactions for this product within the date range
        const productTransactions = filtered.filter((t) => t.itemId === product.id)

        // Calculate total sold within date range
        const totalSold = productTransactions.filter((t) => t.type === "out").reduce((sum, t) => sum + t.quantity, 0)

        // Calculate total restocked within date range
        const totalRestocked = productTransactions
          .filter((t) => t.type === "in")
          .reduce((sum, t) => sum + t.quantity, 0)

        // Calculate popularity score based on filtered data
        const popularityScore = totalSold > 0 ? totalSold : 0

        return {
          ...product,
          totalSold,
          totalRestocked,
          popularityScore,
          turnoverRate: totalSold / (product.currentStock || 1),
        }
      })

      setFilteredProductAnalytics(filteredProductData)
    } else {
      setFilteredProductAnalytics(allProductAnalytics)
    }
  }

  // Function to handle category bar click
  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)

    // Get category analytics data
    const categoryAnalytics = getCategoryAnalytics(category)

    // Transform data for display
    const itemsInCategory = categoryAnalytics.map((item) => ({
      name: item.name,
      value: item.totalSold,
      currentStock: item.currentStock,
    }))

    setCategoryItems(itemsInCategory)
    setCategoryItemsDialogOpen(true)
  }

  // Function to handle time range change
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    filterTransactionsByDateRange(transactions, productAnalytics, range, dateFrom, dateTo)
  }

  // Function to handle date range change
  const handleDateRangeChange = (from: Date, to: Date) => {
    setDateFrom(from)
    setDateTo(to)
    setTimeRange("custom")
    filterTransactionsByDateRange(transactions, productAnalytics, "custom", from, to)
  }

  // Function to handle product sorting
  const handleProductSort = (field: string) => {
    if (productSortField === field) {
      // Toggle direction if same field
      setProductSortDirection(productSortDirection === "asc" ? "desc" : "asc")
    } else {
      // New field, default to descending
      setProductSortField(field)
      setProductSortDirection("desc")
    }
  }

  // Function to generate and download reports
  const generateReport = (reportType: string) => {
    setIsGeneratingReport(true)

    try {
      let csvContent = ""
      let filename = ""

      // Get date range for filename
      const dateRangeStr =
        timeRange === "all"
          ? "all-time"
          : timeRange === "week"
            ? "last-7-days"
            : timeRange === "month"
              ? "last-30-days"
              : `${format(dateFrom, "yyyy-MM-dd")}-to-${format(dateTo, "yyyy-MM-dd")}`

      switch (reportType) {
        case "product-analytics":
          // Create CSV header
          csvContent = "Name,Category,Current Stock,Total Sold,Total Restocked,Popularity Score,Turnover Rate\n"

          // Add data rows
          const sortedProducts = [...filteredProductAnalytics].sort((a, b) => {
            if (productSortField === "name" || productSortField === "category") {
              return productSortDirection === "asc"
                ? a[productSortField].localeCompare(b[productSortField])
                : b[productSortField].localeCompare(a[productSortField])
            } else {
              const fieldA = a[productSortField as keyof typeof a] as number
              const fieldB = b[productSortField as keyof typeof b] as number
              return productSortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA
            }
          })

          sortedProducts.forEach((product) => {
            csvContent += `${product.name},${product.category},${formatNumber(product.currentStock)},${formatNumber(product.totalSold)},${formatNumber(product.totalRestocked)},${product.popularityScore.toFixed(1)},${product.turnoverRate.toFixed(1)}\n`
          })

          filename = `product-analytics-${dateRangeStr}.csv`
          break

        case "category-distribution":
          // Create CSV header
          csvContent = "Category,Items Distributed\n"

          // Add data rows
          categoryDistribution.forEach((category) => {
            csvContent += `${category.name},${formatNumber(category.value)}\n`
          })

          filename = `category-distribution-${dateRangeStr}.csv`
          break

        case "popular-items":
          // Create CSV header
          csvContent = "Item Name,Quantity Distributed\n"

          popularItems.forEach((item) => {
            csvContent += `${item.name},${formatNumber(item.value)}\n`
          })

          filename = `popular-items-${dateRangeStr}.csv`
          break

        case "transactions":
          // Create CSV header
          csvContent = "Type,Item Name,Quantity,User,Timestamp,Unit\n"

          // Add data rows
          filteredTransactions.forEach((transaction) => {
            csvContent += `${transaction.type},${transaction.itemName},${formatNumber(transaction.quantity)},${transaction.user},${transaction.timestamp},${transaction.unit}\n`
          })

          filename = `transactions-${dateRangeStr}.csv`
          break

        case "cost-analytics":
          // Create CSV header
          csvContent = "Item Name,Category,Cost Per Unit,Quantity,Total Cost\n"

          // Add data rows
          inventoryItems
            .filter((item) => item.cost !== undefined)
            .forEach((item) => {
              csvContent += `${item.name},${item.category},${item.cost},${item.quantity},${(item.cost || 0) * item.quantity}\n`
            })

          filename = `cost-analytics-${dateRangeStr}.csv`
          break

        default:
          throw new Error("Unknown report type")
      }

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Report Downloaded",
        description: `${filename} has been downloaded successfully.`,
      })
    } catch (error) {
      console.error("Error generating report:", error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
    }
  }

  // Filter products based on search query
  const searchFilteredProducts = filteredProductAnalytics
    .filter(
      (product) =>
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearchQuery.toLowerCase()),
    )
    .sort((a, b) => {
      const field = productSortField as keyof typeof a

      // Handle string vs number comparison
      if (typeof a[field] === "string" && typeof b[field] === "string") {
        return productSortDirection === "asc"
          ? (a[field] as string).localeCompare(b[field] as string)
          : (b[field] as string).localeCompare(a[field] as string)
      } else {
        return productSortDirection === "asc"
          ? (a[field] as number) - (b[field] as number)
          : (b[field] as number) - (a[field] as number)
      }
    })

  // Function to get color based on category
  const getCategoryColor = (category: string) => {
    // Create a mapping of known categories to colors
    const categoryColors: Record<string, string> = {
      essentials: "bg-amber-500",
      grains: "bg-orange-500",
      canned: "bg-gray-500",
      produce: "bg-green-500",
      dairy: "bg-blue-500",
      "south-asian": "bg-purple-500",
      beverages: "bg-cyan-500",
      snacks: "bg-pink-500",
      hygiene: "bg-indigo-500",
      household: "bg-emerald-500",
    }

    // Return the color if it exists in our mapping, otherwise use a default color
    return categoryColors[category] || "bg-gray-400"
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Price & Usage Analytics</h1>
                <p className="text-lg text-primary mt-2">
                  Analyze item prices and usage patterns to make better purchasing decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range and Report Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {timeRange === "custom" && (
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[250px] justify-start text-left font-normal">
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>
                    {format(dateFrom, "MMM d, yyyy")} - {format(dateTo, "MMM d, yyyy")}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex flex-col sm:flex-row gap-2 p-3">
                  <div>
                    <div className="mb-2 font-medium">From</div>
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => date && setDateFrom(date)}
                      disabled={(date) => isAfter(date, dateTo) || isAfter(date, new Date())}
                    />
                  </div>
                  <div>
                    <div className="mb-2 font-medium">To</div>
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => date && setDateTo(date)}
                      disabled={(date) => isBefore(date, dateFrom) || isAfter(date, new Date())}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-3 border-t">
                  <Button variant="outline" onClick={() => setIsDatePickerOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      handleDateRangeChange(dateFrom, dateTo)
                      setIsDatePickerOpen(false)
                    }}
                  >
                    Apply Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button disabled={isGeneratingReport}>
              <Download className="mr-2 h-4 w-4" />
              {isGeneratingReport ? "Generating..." : "Download Report"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => generateReport("product-analytics")}>
              <FileText className="mr-2 h-4 w-4" />
              Product Analytics
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateReport("category-distribution")}>
              <FileText className="mr-2 h-4 w-4" />
              Category Distribution
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateReport("popular-items")}>
              <FileText className="mr-2 h-4 w-4" />
              Popular Items
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateReport("transactions")}>
              <FileText className="mr-2 h-4 w-4" />
              Transaction Log
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => generateReport("cost-analytics")}>
              <FileText className="mr-2 h-4 w-4" />
              Cost Analytics
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Overview
          </TabsTrigger>
          <TabsTrigger value="items" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Popular Items
          </TabsTrigger>
          <TabsTrigger value="timing" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Busiest Times
          </TabsTrigger>
          <TabsTrigger value="detailed" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Detailed Analysis
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Product Analytics
          </TabsTrigger>
          <TabsTrigger value="costs" className="data-[state=active]:bg-primary data-[state=active]:text-black">
            Price & Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overview content remains the same */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle>Total Transactions</CardTitle>
                <CardDescription>All-time transaction count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{filteredTransactions.length}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle>Unique Users</CardTitle>
                <CardDescription>Total unique students served</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(filteredTransactions.filter((t) => t.type === "out").map((t) => t.user)).size}
                </div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle>Items Distributed</CardTitle>
                <CardDescription>Total items taken by students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(
                    filteredTransactions.filter((t) => t.type === "out").reduce((sum, t) => sum + t.quantity, 0),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rest of overview content */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Category Distribution card */}
            <Card className="col-span-1 border-t-4 border-primary">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Items by category (click bars for details)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {categoryDistribution.length > 0 ? (
                  <div className="h-full overflow-y-auto space-y-4">
                    {categoryDistribution.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{formatNumber(item.value)} items</span>
                        </div>
                        <div
                          className="w-full bg-gray-200 rounded-full h-2.5 cursor-pointer hover:opacity-80"
                          onClick={() => handleCategoryClick(item.name)}
                        >
                          <div
                            className={`${getCategoryColor(item.name)} h-2.5 rounded-full`}
                            style={{
                              width: `${(item.value / Math.max(...categoryDistribution.map((i) => i.value))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => generateReport("category-distribution")}
                  className="ml-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </CardFooter>
            </Card>

            {/* Top 5 Popular Items card */}
            <Card className="col-span-1 border-t-4 border-primary">
              <CardHeader>
                <CardTitle>Top 5 Popular Items</CardTitle>
                <CardDescription>Most frequently taken items</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {popularItems.length > 0 ? (
                  <div className="space-y-4">
                    {popularItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{formatNumber(item.value)} items</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-primary h-2.5 rounded-full"
                            style={{ width: `${(item.value / popularItems[0].value) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => generateReport("popular-items")} className="ml-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs content remains the same */}
        <TabsContent value="items">
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Most Popular Items</CardTitle>
              <CardDescription>Items most frequently taken by students</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
              {popularItems.length > 0 ? (
                <BarChart
                  data={popularItems}
                  index="name"
                  categories={["value"]}
                  colors={["primary"]}
                  valueFormatter={(value) => `${formatNumber(value)} items`}
                  layout="vertical"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" onClick={() => generateReport("popular-items")} className="ml-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="timing" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-t-4 border-primary">
              <CardHeader>
                <CardTitle>Busiest Days of the Week</CardTitle>
                <CardDescription>Number of transactions by day</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {busiestDays.length > 0 ? (
                  <BarChart
                    data={busiestDays}
                    index="name"
                    categories={["value"]}
                    colors={["primary"]}
                    valueFormatter={(value) => `${formatNumber(value)} transactions`}
                    layout="vertical"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => generateReport("transactions")} className="ml-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-t-4 border-primary">
              <CardHeader>
                <CardTitle>Busiest Times of Day</CardTitle>
                <CardDescription>Number of transactions by time period</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {busiestTimes.length > 0 ? (
                  <BarChart
                    data={busiestTimes}
                    index="name"
                    categories={["value"]}
                    colors={["primary"]}
                    valueFormatter={(value) => `${formatNumber(value)} transactions`}
                    layout="vertical"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => generateReport("transactions")} className="ml-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Daily Activity Heatmap</CardTitle>
              <CardDescription>Transaction patterns throughout the week</CardDescription>
            </CardHeader>
            <CardContent className="h-80 overflow-x-auto">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-8 gap-2">
                  <div className="font-medium text-center">Time / Day</div>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                    <div key={day} className="font-medium text-center">
                      {day}
                    </div>
                  ))}

                  {["Morning", "Afternoon", "Evening", "Night"].map((time) => (
                    <>
                      <div key={time} className="text-sm py-2">
                        {time}
                      </div>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                        // Generate random activity level for demonstration
                        // In a real app, you would calculate this from actual data
                        const activityLevel = Math.floor(Math.random() * 4) // 0-3: low, medium, high, very high
                        let bgColor
                        switch (activityLevel) {
                          case 0:
                            bgColor = "bg-green-100"
                            break
                          case 1:
                            bgColor = "bg-green-200"
                            break
                          case 2:
                            bgColor = "bg-green-300"
                            break
                          case 3:
                            bgColor = "bg-green-400"
                            break
                          default:
                            bgColor = "bg-gray-100"
                        }
                        return (
                          <div
                            key={`${day}-${time}`}
                            className={`h-10 rounded ${bgColor} flex items-center justify-center text-xs`}
                          >
                            {activityLevel === 0
                              ? "Low"
                              : activityLevel === 1
                                ? "Medium"
                                : activityLevel === 2
                                  ? "High"
                                  : "Very High"}
                          </div>
                        )
                      })}
                    </>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Detailed Food Item Distribution</CardTitle>
              <CardDescription>Breakdown of specific food items taken by students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {specificFoodDistribution.slice(0, 10).map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(item.category)}`}></div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatNumber(item.value)} items</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${getCategoryColor(item.category)}`}
                          style={{ width: `${(item.value / specificFoodDistribution[0].value) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize">Category: {item.category}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Category Breakdown</h3>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-4 min-w-max">
                      {/* Get unique categories from the data instead of hardcoding */}
                      {Array.from(new Set(specificFoodDistribution.map((item) => item.category))).map((category) => {
                        const count = specificFoodDistribution
                          .filter((item) => item.category === category)
                          .reduce((sum, item) => sum + item.value, 0)

                        return (
                          <div
                            key={category}
                            className="text-center cursor-pointer hover:opacity-80 min-w-[100px]"
                            onClick={() => handleCategoryClick(category)}
                          >
                            <div
                              className={`mx-auto w-16 h-16 rounded-full ${getCategoryColor(category)} flex items-center justify-center mb-2`}
                            >
                              <span className="text-white font-bold">{formatNumber(count)}</span>
                            </div>
                            <p className="text-sm font-medium capitalize">{category}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateReport("category-distribution")}
                className="ml-auto"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Data
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-t-4 border-primary">
            <CardHeader>
              <CardTitle>Food Consumption Trends</CardTitle>
              <CardDescription>How food preferences change over time</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <div className="flex h-full items-center justify-center flex-col gap-4">
                <div className="w-full max-w-md bg-amber-100 rounded-lg p-6 text-center">
                  <h3 className="font-bold text-lg mb-2">Top Trending Items</h3>
                  <ul className="space-y-2 text-left">
                    <li className="flex justify-between">
                      <span>Rice</span>
                      <span className="text-green-600">↑ 24%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Lentils</span>
                      <span className="text-green-600">↑ 18%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Canned Soup</span>
                      <span className="text-green-600">↑ 15%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Cereal</span>
                      <span className="text-red-600">↓ 8%</span>
                    </li>
                    <li className="flex justify-between">
                      <span>Bread</span>
                      <span className="text-red-600">↓ 5%</span>
                    </li>
                  </ul>
                </div>

                <p className="text-muted-foreground text-sm text-center max-w-md">
                  Note: Trend data is based on month-over-month changes in item popularity. Positive percentages
                  indicate increasing popularity.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Analytics Tab with Info Buttons */}
        <TabsContent value="products" className="space-y-4">
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Product-Level Analytics</CardTitle>
                  <CardDescription>Detailed analysis of individual product performance</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("name")}
                        >
                          <div className="flex items-center gap-1">
                            Product
                            {productSortField === "name" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("category")}
                        >
                          <div className="flex items-center gap-1">
                            Category
                            {productSortField === "category" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("currentStock")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Current Stock
                            {productSortField === "currentStock" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("totalSold")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Total Sold
                            {productSortField === "totalSold" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("popularityScore")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Popularity
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <Info className="h-4 w-4" />
                                  <span className="sr-only">Popularity Info</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent side="top" className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Popularity Score</h4>
                                  <p className="text-sm text-muted-foreground">
                                    The popularity score is calculated based on how frequently an item is taken relative
                                    to other items. A higher score indicates higher demand among students.
                                  </p>
                                  <div className="text-sm">
                                    <span className="font-medium">Formula: </span>
                                    (Item's total quantity taken / Average quantity taken across all items)
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Interpretation: </span>
                                    <ul className="list-disc pl-5 space-y-1">
                                      <li>Score &gt; 1: More popular than average</li>
                                      <li>Score = 1: Average popularity</li>
                                      <li>Score &lt; 1: Less popular than average</li>
                                    </ul>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            {productSortField === "popularityScore" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                        <TableHead
                          className="text-right cursor-pointer hover:bg-muted/50"
                          onClick={() => handleProductSort("turnoverRate")}
                        >
                          <div className="flex items-center justify-end gap-1">
                            Turnover Rate
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                  <Info className="h-4 w-4" />
                                  <span className="sr-only">Turnover Rate Info</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent side="top" className="w-80">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Turnover Rate</h4>
                                  <p className="text-sm text-muted-foreground">
                                    The turnover rate measures how quickly an item moves through inventory. It indicates
                                    the efficiency of inventory management for each product.
                                  </p>
                                  <div className="text-sm">
                                    <span className="font-medium">Formula: </span>
                                    Total quantity sold / (Average inventory + Current stock)
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Interpretation: </span>
                                    <ul className="list-disc pl-5 space-y-1">
                                      <li>High rate (&gt;0.7): Fast-moving item, efficient inventory</li>
                                      <li>Medium rate (0.3-0.7): Average turnover</li>
                                      <li>Low rate (&lt;0.3): Slow-moving item, potential overstocking</li>
                                    </ul>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            {productSortField === "turnoverRate" &&
                              (productSortDirection === "asc" ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              ))}
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {searchFilteredProducts.length > 0 ? (
                        searchFilteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="capitalize">{product.category}</TableCell>
                            <TableCell className="text-right">
                              {formatNumber(product.currentStock)}
                              {product.currentStock < 5 && (
                                <Badge variant="destructive" className="ml-2">
                                  Low
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatNumber(product.totalSold)}
                              {product.totalSold > 20 && <TrendingUp className="h-4 w-4 text-green-500 inline ml-2" />}
                              {product.totalSold === 0 && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 inline ml-2" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.popularityScore.toFixed(1)}
                              {product.popularityScore > 1 && (
                                <Badge variant="outline" className="ml-2 bg-green-50">
                                  High
                                </Badge>
                              )}
                              {product.popularityScore < 0.1 && (
                                <Badge variant="outline" className="ml-2 bg-red-50">
                                  Low
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.turnoverRate.toFixed(1)}
                              {product.turnoverRate > 0.7 ? (
                                <TrendingUp className="h-4 w-4 text-green-500 inline ml-2" />
                              ) : product.turnoverRate < 0.3 ? (
                                <TrendingDown className="h-4 w-4 text-red-500 inline ml-2" />
                              ) : null}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            No products found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <div>
                    Showing {searchFilteredProducts.length} of {filteredProductAnalytics.length} products
                  </div>
                  <div>
                    {timeRange === "all"
                      ? "All time data"
                      : timeRange === "week"
                        ? "Last 7 days"
                        : timeRange === "month"
                          ? "Last 30 days"
                          : "Custom date range"}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => generateReport("product-analytics")} className="ml-auto">
                    <Download className="mr-2 h-4 w-4" />
                    Download Product Analytics Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-green-500">
            <CardHeader>
              <CardTitle>Best Selling Products</CardTitle>
              <CardDescription>Products with highest sales volume</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {searchFilteredProducts
                  .sort((a, b) => b.totalSold - a.totalSold)
                  .slice(0, 10) // Show more items
                  .map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          <span className="text-green-600">{formatNumber(product.totalSold)} sold</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current stock: {formatNumber(product.currentStock)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-red-500">
            <CardHeader>
              <CardTitle>Non-Moving Products</CardTitle>
              <CardDescription>Products with low or no sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {searchFilteredProducts
                  .filter((product) => product.totalSold === 0 || product.popularityScore < 0.1)
                  .slice(0, 15) // Show more items
                  .map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {product.totalSold === 0 ? (
                            <span className="text-red-500">Never sold</span>
                          ) : (
                            <span className="text-amber-600">Low popularity</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Current stock: {formatNumber(product.currentStock)}
                        </p>
                      </div>
                    </div>
                  ))}

                {searchFilteredProducts.filter((product) => product.totalSold === 0 || product.popularityScore < 0.1)
                  .length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="mx-auto h-12 w-12 opacity-50 mb-2" />
                    <p>No non-moving products found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Cost Analytics Tab */}
        <TabsContent value="costs" className="space-y-4">
          <PriceAndUsageAnalytics />
        </TabsContent>
      </Tabs>

      {/* Category Items Dialog */}
      <Dialog open={categoryItemsDialogOpen} onOpenChange={setCategoryItemsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="capitalize">{selectedCategory} Category Items</DialogTitle>
            <DialogDescription>Detailed breakdown of items in the {selectedCategory} category</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {categoryItems.length > 0 ? (
              <div className="space-y-4">
                {categoryItems.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{item.name}</span>
                      <div className="text-right">
                        <span className="text-sm text-muted-foreground">{formatNumber(item.value)} sold</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          (Stock: {formatNumber(item.currentStock)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${getCategoryColor(selectedCategory || "")}`}
                        style={{ width: `${(item.value / Math.max(...categoryItems.map((i) => i.value))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No items found in this category</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setCategoryItemsDialogOpen(false)} className="mr-2">
              Close
            </Button>
            <Button
              onClick={() => {
                generateReport("category-distribution")
                setCategoryItemsDialogOpen(false)
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
