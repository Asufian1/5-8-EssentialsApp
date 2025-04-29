"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInventoryItems, getTransactions, getProductAnalytics, getCategoryAnalytics } from "@/lib/data"
import type { Transaction, InventoryItem } from "@/lib/types"
import { BarChart } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronDown, ChevronUp, Search, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

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
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [productSortField, setProductSortField] = useState("totalSold")
  const [productSortDirection, setProductSortDirection] = useState<"asc" | "desc">("desc")
  const [timeRange, setTimeRange] = useState("all") // all, week, month

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
      .map(([name, count]) => ({ name, value: count }))
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
  }, [])

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
    // In a real app, you would filter the data based on the time range
    // For now, we'll just update the state
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

  // Filter and sort product analytics
  const filteredProductAnalytics = productAnalytics
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
    switch (category) {
      case "essentials":
        return "bg-amber-500"
      case "grains":
        return "bg-orange-500"
      case "canned":
        return "bg-gray-500"
      case "produce":
        return "bg-green-500"
      case "dairy":
        return "bg-blue-500"
      case "south-asian":
        return "bg-purple-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative rounded-lg overflow-hidden h-40 bg-secondary">
        <div className="absolute inset-0 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="text-lg text-primary mt-2">Insights and statistics about store usage</p>
          </div>
        </div>
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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle>Total Transactions</CardTitle>
                <CardDescription>All-time transaction count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{transactions.length}</div>
              </CardContent>
            </Card>

            <Card className="border-t-4 border-primary">
              <CardHeader className="pb-2">
                <CardTitle>Unique Users</CardTitle>
                <CardDescription>Total unique students served</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(transactions.filter((t) => t.type === "out").map((t) => t.user)).size}
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
                  {transactions.filter((t) => t.type === "out").reduce((sum, t) => sum + t.quantity, 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-1 border-t-4 border-primary">
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Items by category (click bars for details)</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {categoryDistribution.length > 0 ? (
                  <div className="space-y-4">
                    {categoryDistribution.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium capitalize">{item.name}</span>
                          <span className="text-sm text-muted-foreground">{item.value} items</span>
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
            </Card>

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
                          <span className="text-sm text-muted-foreground">{item.value} items</span>
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
            </Card>
          </div>
        </TabsContent>

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
                  valueFormatter={(value) => `${value} items`}
                  layout="vertical"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No data available</p>
                </div>
              )}
            </CardContent>
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
                    valueFormatter={(value) => `${value} transactions`}
                    layout="vertical"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
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
                    valueFormatter={(value) => `${value} transactions`}
                    layout="vertical"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
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
                        <span className="text-sm text-muted-foreground">{item.value} items</span>
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {["essentials", "grains", "canned", "produce", "dairy", "south-asian"].map((category) => {
                      const count = specificFoodDistribution
                        .filter((item) => item.category === category)
                        .reduce((sum, item) => sum + item.value, 0)

                      return (
                        <div
                          key={category}
                          className="text-center cursor-pointer hover:opacity-80"
                          onClick={() => handleCategoryClick(category)}
                        >
                          <div
                            className={`mx-auto w-16 h-16 rounded-full ${getCategoryColor(category)} flex items-center justify-center mb-2`}
                          >
                            <span className="text-white font-bold">{count}</span>
                          </div>
                          <p className="text-sm font-medium capitalize">{category}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
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

        {/* New Product Analytics Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="border-t-4 border-primary">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle>Product-Level Analytics</CardTitle>
                  <CardDescription>Detailed analysis of individual product performance</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Time Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
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
                      {filteredProductAnalytics.length > 0 ? (
                        filteredProductAnalytics.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="capitalize">{product.category}</TableCell>
                            <TableCell className="text-right">
                              {product.currentStock}
                              {product.currentStock < 5 && (
                                <Badge variant="destructive" className="ml-2">
                                  Low
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.totalSold}
                              {product.totalSold > 20 && <TrendingUp className="h-4 w-4 text-green-500 inline ml-2" />}
                              {product.totalSold === 0 && (
                                <AlertTriangle className="h-4 w-4 text-amber-500 inline ml-2" />
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {product.popularityScore.toFixed(2)}
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
                              {product.turnoverRate.toFixed(2)}
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
                    Showing {filteredProductAnalytics.length} of {productAnalytics.length} products
                  </div>
                  <div>
                    {timeRange === "all" ? "All time data" : timeRange === "week" ? "Last 7 days" : "Last 30 days"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-t-4 border-green-500">
              <CardHeader>
                <CardTitle>Best Selling Products</CardTitle>
                <CardDescription>Products with highest sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredProductAnalytics
                    .sort((a, b) => b.totalSold - a.totalSold)
                    .slice(0, 5)
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
                            <span className="text-green-600">{product.totalSold} sold</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Current stock: {product.currentStock}</p>
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
                <div className="space-y-4">
                  {filteredProductAnalytics
                    .filter((product) => product.totalSold === 0 || product.popularityScore < 0.1)
                    .slice(0, 5)
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
                          <p className="text-xs text-muted-foreground">Current stock: {product.currentStock}</p>
                        </div>
                      </div>
                    ))}

                  {filteredProductAnalytics.filter(
                    (product) => product.totalSold === 0 || product.popularityScore < 0.1,
                  ).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="mx-auto h-12 w-12 opacity-50 mb-2" />
                      <p>No non-moving products found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
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
                        <span className="text-sm text-muted-foreground">{item.value} sold</span>
                        <span className="text-xs text-muted-foreground ml-2">(Stock: {item.currentStock})</span>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}
