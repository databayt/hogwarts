"use client"

import * as React from "react"
import { useCallback, useMemo, useState } from "react"
import { addDays, differenceInDays, format, isPast } from "date-fns"
import {
  Archive,
  Barcode,
  Book,
  BookOpen,
  Calendar,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  Download,
  History,
  ListFilter,
  Minus,
  Plus,
  QrCode,
  Search,
  Star,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Book {
  id: string
  isbn: string
  title: string
  author: string
  publisher: string
  category: string
  location: string // Shelf location
  totalCopies: number
  availableCopies: number
  coverImage?: string
  publicationYear: number
  language: string
  pages?: number
  description?: string
  tags?: string[]
  rating?: number
  addedDate: Date
}

interface Transaction {
  id: string
  bookId: string
  book?: Book
  userId: string
  userName: string
  userType: "STUDENT" | "TEACHER" | "STAFF"
  type: "CHECKOUT" | "RETURN" | "RENEW" | "RESERVE"
  checkoutDate: Date
  dueDate: Date
  returnDate?: Date
  status: "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST"
  fineAmount?: number
  notes?: string
}

interface Reservation {
  id: string
  bookId: string
  book?: Book
  userId: string
  userName: string
  reservationDate: Date
  expiryDate: Date
  status: "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED"
}

interface LibraryManagementProps {
  books: Book[]
  transactions: Transaction[]
  reservations: Reservation[]
  onCheckout: (bookId: string, userId: string, dueDate: Date) => Promise<void>
  onReturn: (transactionId: string) => Promise<void>
  onRenew: (transactionId: string, newDueDate: Date) => Promise<void>
  onReserve: (bookId: string, userId: string) => Promise<void>
  onAddBook?: (book: Omit<Book, "id">) => Promise<void>
  currentUserId: string
  userRole: "LIBRARIAN" | "TEACHER" | "STUDENT"
}

const categoryColors: Record<string, string> = {
  Fiction: "bg-purple-100 text-purple-800",
  "Non-Fiction": "bg-blue-100 text-blue-800",
  Science: "bg-green-100 text-green-800",
  Mathematics: "bg-yellow-100 text-yellow-800",
  History: "bg-orange-100 text-orange-800",
  Literature: "bg-pink-100 text-pink-800",
  Reference: "bg-gray-100 text-gray-800",
  Magazine: "bg-indigo-100 text-indigo-800",
}

export function LibraryManagement({
  books,
  transactions,
  reservations,
  onCheckout,
  onReturn,
  onRenew,
  onReserve,
  onAddBook,
  currentUserId,
  userRole,
}: LibraryManagementProps) {
  const [selectedTab, setSelectedTab] = useState<
    "catalog" | "transactions" | "reservations"
  >("catalog")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false)
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBooks = books.reduce((sum, b) => sum + b.totalCopies, 0)
    const availableBooks = books.reduce((sum, b) => sum + b.availableCopies, 0)
    const checkedOut = totalBooks - availableBooks
    const overdueCount = transactions.filter(
      (t) => t.status === "OVERDUE"
    ).length
    const activeReservations = reservations.filter(
      (r) => r.status === "ACTIVE"
    ).length

    const popularBooks = [...books]
      .sort((a, b) => {
        const aCheckouts = transactions.filter((t) => t.bookId === a.id).length
        const bCheckouts = transactions.filter((t) => t.bookId === b.id).length
        return bCheckouts - aCheckouts
      })
      .slice(0, 5)

    return {
      totalBooks,
      availableBooks,
      checkedOut,
      overdueCount,
      activeReservations,
      popularBooks,
      circulationRate: totalBooks > 0 ? (checkedOut / totalBooks) * 100 : 0,
    }
  }, [books, transactions, reservations])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(books.map((b) => b.category))
    return Array.from(cats).sort()
  }, [books])

  // Filter books
  const filteredBooks = useMemo(() => {
    let filtered = books

    if (selectedCategory !== "all") {
      filtered = filtered.filter((b) => b.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(query) ||
          b.author.toLowerCase().includes(query) ||
          b.isbn.includes(query) ||
          b.tags?.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [books, selectedCategory, searchQuery])

  // Get user's transactions
  const userTransactions = useMemo(() => {
    if (userRole === "LIBRARIAN") return transactions
    return transactions.filter((t) => t.userId === currentUserId)
  }, [transactions, currentUserId, userRole])

  // Get user's reservations
  const userReservations = useMemo(() => {
    if (userRole === "LIBRARIAN") return reservations
    return reservations.filter((r) => r.userId === currentUserId)
  }, [reservations, currentUserId, userRole])

  const handleCheckout = async (bookId: string) => {
    const dueDate = addDays(new Date(), 14) // 2 weeks loan period
    try {
      await onCheckout(bookId, currentUserId, dueDate)
      toast.success("Book checked out successfully")
      setCheckoutDialogOpen(false)
    } catch (error) {
      toast.error("Failed to checkout book")
    }
  }

  const handleReturn = async (transactionId: string) => {
    try {
      await onReturn(transactionId)
      toast.success("Book returned successfully")
    } catch (error) {
      toast.error("Failed to return book")
    }
  }

  const handleRenew = async (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId)
    if (!transaction) return

    const newDueDate = addDays(transaction.dueDate, 7) // Extend by 1 week
    try {
      await onRenew(transactionId, newDueDate)
      toast.success("Book renewed successfully")
    } catch (error) {
      toast.error("Failed to renew book")
    }
  }

  const handleReserve = async (bookId: string) => {
    try {
      await onReserve(bookId, currentUserId)
      toast.success("Book reserved successfully")
    } catch (error) {
      toast.error("Failed to reserve book")
    }
  }

  const getDaysUntilDue = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date())
    if (days < 0) return `${Math.abs(days)} days overdue`
    if (days === 0) return "Due today"
    if (days === 1) return "Due tomorrow"
    return `${days} days remaining`
  }

  const getDueDateColor = (dueDate: Date) => {
    const days = differenceInDays(dueDate, new Date())
    if (days < 0) return "text-red-600"
    if (days <= 1) return "text-orange-600"
    if (days <= 3) return "text-yellow-600"
    return "text-muted-foreground"
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Books</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.availableBooks}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checked Out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.checkedOut}
            </div>
            <Progress value={stats.circulationRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueCount}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reservations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.activeReservations}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <div className="mb-4 flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="catalog">Book Catalog</TabsTrigger>
            <TabsTrigger value="transactions">
              Transactions
              {userTransactions.filter((t) => t.status === "ACTIVE").length >
                0 && (
                <Badge variant="destructive" className="ms-2">
                  {userTransactions.filter((t) => t.status === "ACTIVE").length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reservations">
              Reservations
              {userReservations.filter((r) => r.status === "ACTIVE").length >
                0 && (
                <Badge variant="secondary" className="ms-2">
                  {userReservations.filter((r) => r.status === "ACTIVE").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {userRole === "LIBRARIAN" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setScannerActive(!scannerActive)}
              >
                <Barcode className="me-2 h-4 w-4" />
                {scannerActive ? "Stop Scanner" : "Scan ISBN"}
              </Button>
              {onAddBook && (
                <Button onClick={() => setAddBookDialogOpen(true)}>
                  <Plus className="me-2 h-4 w-4" />
                  Add Book
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Book Catalog */}
        <TabsContent value="catalog">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Book Catalog</CardTitle>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBooks.map((book) => (
                  <Card
                    key={book.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-1 text-base">
                            {book.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-1">
                            {book.author}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            categoryColors[book.category] || "bg-gray-100"
                          }
                        >
                          {book.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ISBN:</span>
                          <span className="font-mono">{book.isbn}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Location:
                          </span>
                          <span>{book.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Available:
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              book.availableCopies > 0
                                ? "text-green-600"
                                : "text-red-600"
                            )}
                          >
                            {book.availableCopies} / {book.totalCopies}
                          </span>
                        </div>
                        {book.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-3 w-3",
                                  i < Math.floor(book.rating!)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                            <span className="text-muted-foreground ms-1 text-xs">
                              ({book.rating.toFixed(1)})
                            </span>
                          </div>
                        )}
                      </div>

                      {book.tags && book.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {book.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-3">
                      {book.availableCopies > 0 ? (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(book)
                            setCheckoutDialogOpen(true)
                          }}
                        >
                          <BookOpen className="me-2 h-4 w-4" />
                          Check Out
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          size="sm"
                          variant="outline"
                          onClick={() => handleReserve(book.id)}
                        >
                          <Clock className="me-2 h-4 w-4" />
                          Reserve
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === "LIBRARIAN"
                  ? "All Transactions"
                  : "My Borrowed Books"}
              </CardTitle>
              <CardDescription>Active and past book checkouts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {userRole === "LIBRARIAN" && <TableHead>User</TableHead>}
                    <TableHead>Checkout Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userTransactions.map((transaction) => {
                    const book = books.find((b) => b.id === transaction.bookId)
                    const isOverdue =
                      isPast(transaction.dueDate) &&
                      transaction.status === "ACTIVE"

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {book?.title || "Unknown Book"}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {book?.author}
                            </p>
                          </div>
                        </TableCell>
                        {userRole === "LIBRARIAN" && (
                          <TableCell>
                            <div>
                              <p className="text-sm">{transaction.userName}</p>
                              <Badge variant="outline" className="text-xs">
                                {transaction.userType}
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {format(transaction.checkoutDate, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={getDueDateColor(transaction.dueDate)}
                          >
                            {format(transaction.dueDate, "MMM dd, yyyy")}
                          </span>
                          {transaction.status === "ACTIVE" && (
                            <p className="text-muted-foreground text-xs">
                              {getDaysUntilDue(transaction.dueDate)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.status === "RETURNED"
                                ? "secondary"
                                : isOverdue
                                  ? "destructive"
                                  : "default"
                            }
                          >
                            {isOverdue ? "OVERDUE" : transaction.status}
                          </Badge>
                          {transaction.fineAmount &&
                            transaction.fineAmount > 0 && (
                              <Badge
                                variant="outline"
                                className="ms-2 text-red-600"
                              >
                                ${transaction.fineAmount.toFixed(2)} fine
                              </Badge>
                            )}
                        </TableCell>
                        <TableCell>
                          {transaction.status === "ACTIVE" && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReturn(transaction.id)}
                              >
                                Return
                              </Button>
                              {!isOverdue && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRenew(transaction.id)}
                                >
                                  Renew
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations */}
        <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === "LIBRARIAN"
                  ? "All Reservations"
                  : "My Reservations"}
              </CardTitle>
              <CardDescription>
                Reserved books waiting for pickup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {userRole === "LIBRARIAN" && <TableHead>User</TableHead>}
                    <TableHead>Reserved Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userReservations.map((reservation) => {
                    const book = books.find((b) => b.id === reservation.bookId)

                    return (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {book?.title || "Unknown Book"}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {book?.author}
                            </p>
                          </div>
                        </TableCell>
                        {userRole === "LIBRARIAN" && (
                          <TableCell>{reservation.userName}</TableCell>
                        )}
                        <TableCell>
                          {format(reservation.reservationDate, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {format(reservation.expiryDate, "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reservation.status === "ACTIVE"
                                ? "default"
                                : reservation.status === "FULFILLED"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {reservation.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reservation.status === "ACTIVE" &&
                            book?.availableCopies! > 0 && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedBook(book!)
                                  setCheckoutDialogOpen(true)
                                }}
                              >
                                Check Out
                              </Button>
                            )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Popular Books Section */}
      {stats.popularBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Popular Books</CardTitle>
            <CardDescription>Most frequently borrowed books</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 overflow-x-auto">
              {stats.popularBooks.map((book) => (
                <div key={book.id} className="min-w-[150px]">
                  <div className="bg-muted mb-2 aspect-[3/4] rounded" />
                  <p className="line-clamp-2 text-sm font-medium">
                    {book.title}
                  </p>
                  <p className="text-muted-foreground text-xs">{book.author}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Checkout Dialog */}
      <Dialog open={checkoutDialogOpen} onOpenChange={setCheckoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Checkout</DialogTitle>
            <DialogDescription>
              You are about to check out this book
            </DialogDescription>
          </DialogHeader>
          {selectedBook && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedBook.title}</h4>
                <p className="text-muted-foreground text-sm">
                  by {selectedBook.author}
                </p>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Checkout Date:</span>
                  <span className="font-medium">
                    {format(new Date(), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-medium">
                    {format(addDays(new Date(), 14), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Loan Period:</span>
                  <span className="font-medium">14 days</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCheckoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedBook && handleCheckout(selectedBook.id)}
            >
              Confirm Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
