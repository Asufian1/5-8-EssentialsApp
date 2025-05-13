"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getInventoryItems, getTransactions } from "@/lib/data-db"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, TrendingDown, TrendingUp, DollarSign, ShoppingCart, RefreshCw } from "lucide-react"
import type { InventoryItem, Transaction } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"

// Helper function to format currency
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

// Helper function to truncate text with ellipsis
const truncateText = (text: string, maxLength = 20): string => {
  if (!text) return ""
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
}

// Helper function to format the popularity-to-cost ratio
const formatRatio = (value: number): string => {
  return value.toFixed(2)
}

export function PriceAndUsageAnalytics() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([])
  const [topItems, setTopItems] = useState<{ name: string; value: number; efficiency: number }[]>([])
  const [popularityToCostData, setPopularityToCostData] = useState<
    { name: string; value: number; fullName: string; usage: number; price: number }[]
  >([])
  const [recommendedItems, setRecommendedItems] = useState<{
    worthBuying: Array<{
      id: string
      name: string
      cost: number
      reason: string
      score: number
      quantity: number
      usage: number
    }>
    notWorthBuying: Array<{
      id: string
      name: string
      cost: number
      reason: string
      score: number
      quantity: number
      usage: number
    }>
  }>({ worthBuying: [], notWorthBuying: [] })
  const [totalCost, setTotalCost] = useState(0)
  const [averageCost, setAverageCost] = useState(0)
  const [loading, setLoading] = useState(true)
  const [usageFrequencyData, setUsageFrequencyData] = useState<{ name: string; value: number; fullName: string }[]>([])
  const [usageFrequencyMap, setUsageFrequencyMap] = useState<Record<string, number>>({})
  const [totalUsage, setTotalUsage] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [averagePopularityToCost, setAveragePopularityToCost] = useState(0)

  const loadData = async () => {
    try {
      setLoading(true)
      console.log("Loading cost analytics data...")

      // Get real data with detailed logging
      console.log("Fetching inventory items from database...")
      const items = await getInventoryItems()
      console.log(`Successfully loaded ${items.length} inventory items`)
      setInventoryItems(items)

      console.log("Fetching transactions from database...")
      const txns = await getTransactions()
      console.log(`Successfully loaded ${txns.length} transactions`)
      setTransactions(txns)

      // Calculate total cost
      console.log("Calculating total cost...")
      const total = items.reduce((sum, item) => {
        const cost = item.cost || 0
        return sum + cost * item.quantity
      }, 0)
      setTotalCost(total)
      console.log(`Total cost: ${total}`)

      // Calculate average cost per item
      console.log("Calculating average cost per item...")
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
      const avg = totalItems > 0 ? total / totalItems : 0
      setAverageCost(avg)
      console.log(`Average cost: ${avg}`)

      // Calculate cost by category
      console.log("Calculating cost by category...")
      const categoryCosts: Record<string, number> = {}
      items.forEach((item) => {
        const cost = item.cost || 0
        if (!categoryCosts[item.category]) {
          categoryCosts[item.category] = 0
        }
        categoryCosts[item.category] += cost * item.quantity
      })

      const categoryChartData = Object.entries(categoryCosts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      setCategoryData(categoryChartData)
      console.log(`Calculated costs for ${categoryChartData.length} categories`)

      // Calculate top cost items
      console.log("Calculating top cost items...")
      const itemCosts = items
        .filter((item) => item.cost !== undefined && item.cost > 0)
        .map((item) => ({
          name: item.name,
          value: (item.cost || 0) * item.quantity,
          efficiency: item.quantity > 0 ? (item.cost || 0) / item.quantity : 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      setTopItems(itemCosts)
      console.log(`Calculated costs for ${itemCosts.length} top items`)

      // Calculate usage frequency
      console.log("Calculating usage frequency...")
      const usageFrequencyMap: Record<string, number> = {}
      const outTransactions = txns.filter((t) => t.type === "out")

      outTransactions.forEach((t) => {
        if (!usageFrequencyMap[t.itemId]) {
          usageFrequencyMap[t.itemId] = 0
        }
        usageFrequencyMap[t.itemId] += t.quantity
      })

      setUsageFrequencyMap(usageFrequencyMap)

      // Calculate total usage
      console.log("Calculating total usage...")
      const totalUsageCount = outTransactions.reduce((sum, t) => sum + t.quantity, 0)
      setTotalUsage(totalUsageCount)
      console.log(`Total usage: ${totalUsageCount}`)

      // Map to items and sort by usage
      console.log("Mapping items by usage...")
      const usageData = items
        .map((item) => ({
          name: truncateText(item.name, 15),
          fullName: item.name,
          value: usageFrequencyMap[item.id] || 0,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)

      setUsageFrequencyData(usageData)
      console.log(`Mapped ${usageData.length} items by usage`)

      // Calculate popularity-to-cost ratio
      console.log("Calculating popularity-to-cost ratio...")
      const popularityToCostItems = items
        .filter((item) => item.cost !== undefined && item.cost > 0)
        .map((item) => {
          const usage = usageFrequencyMap[item.id] || 0
          const price = item.cost || 0
          // Higher ratio means more popular per dollar spent (better value)
          const ratio = price > 0 ? usage / price : 0
          return {
            name: truncateText(item.name, 15),
            fullName: item.name,
            value: ratio,
            usage,
            price,
          }
        })
        .sort((a, b) => b.value - a.value) // Sort by highest ratio first (most popular per dollar)

      setPopularityToCostData(popularityToCostItems)
      console.log(`Calculated popularity-to-cost ratio for ${popularityToCostItems.length} items`)

      // Calculate average popularity-to-cost ratio
      console.log("Calculating average popularity-to-cost ratio...")
      const validRatios = popularityToCostItems.filter((item) => item.value > 0)
      const avgRatio =
        validRatios.length > 0 ? validRatios.reduce((sum, item) => sum + item.value, 0) / validRatios.length : 0
      setAveragePopularityToCost(avgRatio)
      console.log(`Average popularity-to-cost ratio: ${avgRatio}`)

      // Generate purchase recommendations
      console.log("Generating purchase recommendations...")
      generatePurchaseRecommendations(items, txns, avg, usageFrequencyMap)
      console.log("Purchase recommendations generated")
    } catch (error) {
      console.error("Error loading cost analytics data:", error)
      // Reset states on error
      setInventoryItems([])
      setTransactions([])
      setCategoryData([])
      setTopItems([])
      setPopularityToCostData([])
      setTotalCost(0)
      setAverageCost(0)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  // Function to generate purchase recommendations
  const generatePurchaseRecommendations = (
    items: InventoryItem[],
    transactions: Transaction[],
    averageCost: number,
    usageFrequency: Record<string, number>,
  ) => {
    // Only consider items with cost data
    const itemsWithCost = items.filter((item) => item.cost !== undefined && item.cost > 0)

    if (itemsWithCost.length === 0) {
      setRecommendedItems({ worthBuying: [], notWorthBuying: [] })
      return
    }

    // Calculate a score for each item based primarily on usage
    const scoredItems = itemsWithCost.map((item) => {
      const cost = item.cost || 0
      const usage = usageFrequency[item.id] || 0

      // Calculate usage score (higher usage = higher score) - now weighted more heavily
      const usageScore = usage > 15 ? 5 : usage > 10 ? 4 : usage > 5 ? 3 : usage > 0 ? 2 : 1

      // Calculate inventory level score (lower inventory = higher priority to buy)
      const inventoryScore = item.quantity < 5 ? 4 : item.quantity < 10 ? 3 : item.quantity < 20 ? 2 : 1

      // Calculate cost efficiency score (lower cost = higher score) - now weighted less
      const costScore = cost < averageCost * 0.7 ? 3 : cost < averageCost ? 2 : 1

      // Calculate final score with usage having the highest weight
      const finalScore = usageScore * 0.6 + inventoryScore * 0.3 + costScore * 0.1

      // Determine reason for recommendation
      let reason = ""
      if (usageScore >= 4) {
        reason = "High demand item"
      } else if (inventoryScore >= 3 && usageScore >= 2) {
        reason = "Low stock, regular usage"
      } else if (costScore === 3 && usageScore >= 2) {
        reason = "Good value, regular usage"
      } else if (inventoryScore === 4) {
        reason = "Critical low inventory"
      } else if (usage === 0) {
        reason = "No recent usage"
      } else if (cost > averageCost * 1.5) {
        reason = "Expensive compared to average"
      } else {
        reason = "Average demand"
      }

      return {
        id: item.id,
        name: item.name,
        cost,
        quantity: item.quantity,
        usage,
        score: finalScore,
        reason,
      }
    })

    // Sort by score (descending)
    scoredItems.sort((a, b) => b.score - a.score)

    // Split into worth buying and not worth buying
    const worthBuying = scoredItems.filter((item) => item.score >= 2.5)
    const notWorthBuying = scoredItems.filter((item) => item.score < 2.5)

    // Limit to top 5 in each category
    setRecommendedItems({
      worthBuying: worthBuying.slice(0, 5),
      notWorthBuying: notWorthBuying.slice(0, 5),
    })
  }

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if we have any cost data
  const hasCostData = inventoryItems.some((item) => item.cost !== undefined && item.cost > 0) || transactions.length > 0

  if (!hasCostData) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Price & Usage Analytics</CardTitle>
            <CardDescription>
              No price data available. Add items with price information to see analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-6 rounded-md text-center">
              <p className="text-muted-foreground mb-4">
                To use price and usage analytics, add price information to your inventory items when:
              </p>
              <ul className="text-left list-disc pl-6 mb-4 space-y-2">
                <li>Adding new items to inventory</li>
                <li>Importing items via CSV</li>
                <li>Editing existing items to add price data</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                Usage data will be automatically collected as items are taken out of inventory.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Price & Usage Analytics</h2>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Item Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageCost)}</div>
            <p className="text-xs text-muted-foreground">Per inventory item</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsage}</div>
            <p className="text-xs text-muted-foreground">Items taken out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {(() => {
                const categoryUsage: Record<string, number> = {}
                const items = inventoryItems
                items.forEach((item) => {
                  const usage = usageFrequencyMap[item.id] || 0
                  if (!categoryUsage[item.category]) {
                    categoryUsage[item.category] = 0
                  }
                  categoryUsage[item.category] += usage
                })
                const sortedCategories = Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])
                return sortedCategories.length > 0 ? sortedCategories[0][0] : "N/A"
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Highest usage category</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Value Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const bestValueItem = popularityToCostData.length > 0 ? popularityToCostData[0] : null
                return bestValueItem ? truncateText(bestValueItem.fullName, 15) : "N/A"
              })()}
            </div>
            <p className="text-xs text-muted-foreground">Most popular per dollar spent</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usage-frequency" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage-frequency">Usage Frequency</TabsTrigger>
          <TabsTrigger value="price-analysis">Value Analysis</TabsTrigger>
          <TabsTrigger value="category-costs">Category Breakdown</TabsTrigger>
          <TabsTrigger value="recommendations">Purchase Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="usage-frequency">
          <Card>
            <CardHeader>
              <CardTitle>Most Frequently Used Items</CardTitle>
              <CardDescription>Items with the highest usage frequency</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {usageFrequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={usageFrequencyData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [value, "Times Used"]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return payload[0].payload.fullName || label
                        }
                        return label
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Usage Frequency" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No usage data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-analysis">
          <Card>
            <CardHeader>
              <CardTitle>Value Analysis</CardTitle>
              <CardDescription>Items with the best popularity-to-cost ratio (higher is better)</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="text-lg font-medium mb-4">Popularity-to-Cost Ratio</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This chart shows which items give you the most usage per dollar spent. Higher values indicate better
                  value.
                </p>
                <div className="h-80">
                  {popularityToCostData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={popularityToCostData.filter((item) => item.value > 0).slice(0, 10)}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 120, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value) => [formatRatio(Number(value)), "Uses per dollar"]}
                          labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                              return payload[0].payload.fullName || label
                            }
                            return label
                          }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Popularity-to-Cost Ratio" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">No price and usage data available</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Value Analysis Table</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead className="text-right">Uses per Dollar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {popularityToCostData
                      .filter((item) => item.value > 0)
                      .slice(0, 8)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.fullName}</TableCell>
                          <TableCell>{formatCurrency(item.price)}</TableCell>
                          <TableCell>{item.usage}</TableCell>
                          <TableCell className="text-right">
                            {formatRatio(item.value)}
                            {item.value > averagePopularityToCost * 2 ? (
                              <Badge className="ml-2 bg-green-500">Excellent</Badge>
                            ) : item.value > averagePopularityToCost * 1.5 ? (
                              <Badge className="ml-2 bg-green-400">Good</Badge>
                            ) : item.value > averagePopularityToCost ? (
                              <Badge className="ml-2 bg-yellow-500">Average</Badge>
                            ) : (
                              <Badge className="ml-2 bg-red-500">Poor</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    {popularityToCostData.filter((item) => item.value > 0).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No value analysis data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="category-costs">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Category</CardTitle>
              <CardDescription>Total inventory cost broken down by category</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 20, right: 30, left: 70, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis dataKey="name" type="category" width={70} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total Cost"]} />
                    <Legend />
                    <Bar dataKey="value" name="Total Cost" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No category cost data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="bg-green-50 dark:bg-green-950 border-b">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <CardTitle>Worth Buying</CardTitle>
                </div>
                <CardDescription>
                  Items recommended for purchase based on cost, usage, and inventory levels
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {recommendedItems.worthBuying.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendedItems.worthBuying.map((item) => (
                      <li key={item.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>{formatCurrency(item.cost)} per unit</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>Usage: {item.usage || 0} times</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>Current inventory: {item.quantity} units</span>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100">
                            {item.reason}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No recommended items available</p>
                    <p className="text-sm mt-2">Add more cost data to get recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-red-50 dark:bg-red-950 border-b">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <CardTitle>Not Worth Buying</CardTitle>
                </div>
                <CardDescription>Items not recommended for purchase due to high cost or low demand</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {recommendedItems.notWorthBuying.length > 0 ? (
                  <ul className="space-y-4">
                    {recommendedItems.notWorthBuying.map((item) => (
                      <li key={item.id} className="border-b pb-3 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>{formatCurrency(item.cost)} per unit</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <TrendingDown className="h-3.5 w-3.5" />
                              <span>Usage: {item.usage || 0} times</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <ShoppingCart className="h-3.5 w-3.5" />
                              <span>Current inventory: {item.quantity} units</span>
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-100">
                            {item.reason}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No items flagged as not worth buying</p>
                    <p className="text-sm mt-2">Add more cost data to get recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>How Recommendations Work</CardTitle>
              <CardDescription>
                Our recommendation system analyzes multiple factors to determine which items are worth buying
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Usage Frequency</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Items that are frequently taken out of inventory are given higher priority, as they represent items
                    with higher demand.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Inventory Levels</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Items with low inventory levels are prioritized for restocking, especially if they have high usage
                    frequency.
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-5 w-5 text-blue-500" />
                    <h3 className="font-medium">Cost Efficiency</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Items with lower cost per unit are prioritized. Items costing less than 80% of the average cost are
                    considered highly efficient.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
