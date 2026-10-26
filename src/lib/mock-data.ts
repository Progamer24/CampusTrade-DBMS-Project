export type ListingStatus = "Active" | "Pending" | "Flagged" | "Approved" | "Rejected" | "Sold";

export type Listing = {
  id: number;
  title: string;
  description: string;
  category: "Books" | "Electronics" | "Accessories";
  price: number;
  condition: "Like New" | "Good" | "Fair";
  seller: string;
  posted: string;
  color: "lavender" | "mint" | "peach" | "blue";
  emoji: string;
};

export const listings: Listing[] = [
  {
    id: 1,
    title: "Engineering Mathematics Textbook",
    description: "A well-kept reference copy with clear pages and useful notes for exam preparation.",
    category: "Books",
    price: 450,
    condition: "Good",
    seller: "Aarav",
    posted: "2 days ago",
    color: "lavender",
    emoji: "📚",
  },
  {
    id: 2,
    title: "Scientific Calculator",
    description: "Reliable calculator for coursework and exams, with the original protective case included.",
    category: "Electronics",
    price: 650,
    condition: "Like New",
    seller: "Riya",
    posted: "3 days ago",
    color: "mint",
    emoji: "🧮",
  },
  {
    id: 3,
    title: "Canvas Backpack",
    description: "Roomy everyday backpack with a padded laptop sleeve and comfortable shoulder straps.",
    category: "Accessories",
    price: 800,
    condition: "Good",
    seller: "Meera",
    posted: "5 days ago",
    color: "peach",
    emoji: "🎒",
  },
  {
    id: 4,
    title: "Wireless Headphones",
    description: "Comfortable headphones for library sessions and commuting, with a charging cable.",
    category: "Electronics",
    price: 1200,
    condition: "Good",
    seller: "Kabir",
    posted: "1 week ago",
    color: "blue",
    emoji: "🎧",
  },
  {
    id: 5,
    title: "Field Notes Journal Set",
    description: "A set of unused pocket notebooks for class notes, project ideas, or daily planning.",
    category: "Books",
    price: 250,
    condition: "Like New",
    seller: "Anaya",
    posted: "1 week ago",
    color: "mint",
    emoji: "📓",
  },
  {
    id: 6,
    title: "Desk Lamp",
    description: "Compact study lamp with adjustable neck and warm, comfortable light.",
    category: "Accessories",
    price: 550,
    condition: "Fair",
    seller: "Vihaan",
    posted: "2 weeks ago",
    color: "peach",
    emoji: "💡",
  },
];

export const mockStudent = {
  name: "Aarav Sharma",
  email: "aarav.sharma@campus.edu",
  studentId: "CT2024018",
};

export const mockStudentListings: { listingId: number; status: "Active" | "Sold" }[] = [
  { listingId: 1, status: "Active" },
  { listingId: 5, status: "Sold" },
];

export const mockStudentOrders: { id: string; title: string; detail: string; status: "Pending" | "Completed" }[] = [
  { id: "order-1", title: "Scientific Calculator", detail: "Request sent · 2 days ago", status: "Pending" },
  { id: "order-2", title: "Desk Lamp", detail: "Transaction completed · 1 week ago", status: "Completed" },
];

export const mockRecentActivity: { id: string; title: string; detail: string; status: ListingStatus }[] = [
  { id: "activity-1", title: "Your textbook listing was viewed", detail: "Today · Marketplace activity", status: "Active" },
  { id: "activity-2", title: "Your journal set was marked sold", detail: "1 week ago · Order completed", status: "Sold" },
];

export const mockModerationQueue: { listingId: number; status: "Pending" | "Flagged" }[] = [
  { listingId: 2, status: "Pending" },
  { listingId: 4, status: "Flagged" },
  { listingId: 6, status: "Pending" },
];