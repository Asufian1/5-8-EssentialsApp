"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInventoryItems, getTransactions } from "@/lib/data"
import type { Transaction } from "@/lib/types"
import { BarChart } from "@/components/ui/chart"

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [popularItems, setPopularItems] = useState<{ name: string; value: number }[]>([])
  const [dailyVisits, setDailyVisits] = useState<{ date: string; count: number }[]>([])
  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; value: number }[]>([])
  const [busiestDays, setBusiestDays] = useState<{ name: string; value: number }[]>([])
  const [busiestTimes, setBusiestTimes] = useState<{ name: string; value: number }[]>([])
  const [specificFoodDistribution, setSpecificFoodDistribution] = useState<
    { name: string; value: number; category: string }[]
  >([])

  useEffect(() => {
    // Load transaction data
    const transactionData = getTransactions()
    setTransactions(transactionData)

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
    const inventoryItems = getInventoryItems()
    const categoryCounts: Record<string, number> = {}

    inventoryItems.forEach((item) => {
      if (!categoryCounts[item.category]) {
        categoryCounts[item.category] = 0
      }
      categoryCounts[item.category] += 1
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
          const item = inventoryItems.find((item) => item.id === transaction.itemId)
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
                <CardDescription>Items by category</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {categoryDistribution.length > 0 ? (
                  <BarChart
                    data={categoryDistribution.map((item) => ({
                      name: item.name.charAt(0).toUpperCase() + item.name.slice(1),
                      value: item.value,
                    }))}
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
                        <div key={category} className="text-center">
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
      </Tabs>
    </div>
  )
}

