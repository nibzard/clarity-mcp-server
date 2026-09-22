// ABOUTME: Zod schemas for the session recordings and natural language query tool inputs.
// ABOUTME: Field descriptions double as guidance for the calling model, so keep them accurate.
import { z } from "zod";

export enum SortOptionsEnum {
  SessionStart_DESC = 0,
  SessionStart_ASC = 1,
  SessionDuration_ASC = 2,
  SessionDuration_DESC = 3,
  SessionClickCount_ASC = 4,
  SessionClickCount_DESC = 5,
  PageCount_ASC = 6,
  PageCount_DESC = 7,
}

export type FiltersType = z.infer<typeof Filters>;

export type SortOptionsType = z.infer<typeof SortOptions>;

const UrlFilter = z.object({
  url: z.string(),
  operator: z.enum(["contains", "startsWith", "endsWith", "excludes", "isExactly", "isExactlyNot", "matchesRegex", "excludesRegex"]),
});

const createRangeFilter = (min: number, max: number) => z.object({
  min: z.number().min(min).max(max).nullable(),
  max: z.number().min(min).max(max).nullable(),
});

const NullableRangeFilter = z.object({
  min: z.number().nullable(),
  max: z.number().nullable(),
});

const UtcTimestamp = z.string().datetime({
  message: "Use UTC ISO 8601 format, for example 2024-01-01T00:00:00.000Z",
});

// Reject a start after the end. Unparseable values are already reported by UtcTimestamp.
const isOrderedDateRange = (range: { start: string; end: string }): boolean => {
  const start = Date.parse(range.start);
  const end = Date.parse(range.end);
  return Number.isNaN(start) || Number.isNaN(end) || start <= end;
};

const Filters = z.object({
  referringUrl: z.string().optional().describe("Filter by the referring URL that brought users to the site"),
  userType: z.enum(["NewUser", "ReturningUser"]).optional().describe("Filter by user type. Accepted values: NewUser, ReturningUser"),
  sessionIntent: z.enum(["Low Intention", "Medium Intention", "High Intention"]).optional().describe("Filter by session intention level/user behavior classification."),
  visitedUrls: z.array(UrlFilter).optional().describe("Filter by URLs visited during the session with pattern matching."),
  entryUrls: z.array(UrlFilter).optional().describe("Filter by entry/landing page URLs with pattern matching."),
  exitUrls: z.array(UrlFilter).optional().describe("Filter by exit page URLs with pattern matching."),
  country: z.array(z.string()).optional().describe("Filter by country names (e.g., ['United States', 'Canada', 'United Kingdom'])"),
  city: z.array(z.string()).optional().describe("Filter by city names (e.g., ['New York', 'London', 'Tokyo'])"),
  state: z.array(z.string()).optional().describe("Filter by state/province names (e.g., ['California', 'Ontario', 'Bavaria'])"),
  deviceType: z.array(z.enum(["Mobile", "Tablet", "PC", "Email", "Other"])).optional().describe("Filter by device types."),
  browser: z.array(z.enum(["Bot", "MiuiBrowser", "Chrome", "CoralWebView", "Edge", "Other", "Firefox", "IE", "Unknown", "Headless", "MobileApp", "Opera", "OperaMini", "Safari", "Samsung", "SamsungInternet", "Sogou", "UCBrowser", "YandexBrowser", "QQBrowser"])).optional().describe("Filter by browser types."),
  os: z.array(z.enum(["BlackBerry", "Android", "ChromeOS", "iOS", "Linux", "MacOS", "Other", "Windows", "WindowsMobile"])).optional().describe("Filter by operating systems."),
  source: z.array(z.string()).optional().describe("Filter by UTM source parameter values (e.g., ['google', 'facebook', 'direct'])"),
  medium: z.array(z.string()).optional().describe("Filter by UTM medium parameter values. Common values: ['organic', 'cpc', 'email', 'social', 'referral']"),
  campaign: z.array(z.string()).optional().describe("Filter by UTM campaign parameter values (e.g., ['summer_sale', 'product_launch'])"),
  channel: z.array(z.enum(["OrganicSearch", "Direct", "Email", "Display", "Social", "PaidSearch", "Other", "Affiliate", "Referral", "Video", "Audio", "SMS", "AITools", "PaidAITools"])).optional().describe("Filter by marketing channel classifications."),
  smartEvents: z.array(z.string()).optional().describe("Filter by smart event names/IDs. Can be user-defined events or Clarity auto events: 'Purchase', 'ContactUs', 'SubmitForm', 'AddToCart', 'RequestQuote', 'SignUp', 'BeginCheckout', 'Download', 'Login', 'Search', 'Play', 'Deposit', 'Schedule', 'Subscribe', 'FindLocation', 'OutboundClick', 'ShowMore', 'Book', 'RetryRefresh', 'Pay', 'Pause', 'Upload', 'CheckAvailability', 'Withdraw', 'Export', 'SeeReviews', 'AddPaymentMethod', 'AddToWishlist', 'NotifyMe', 'CheckIn', 'TransferMoney', 'Upgrade', 'ContinueAsGuest', 'Mute', 'Exchange', 'ApplyCoupon', 'Unsubscribe', 'AddToCalendar', 'Unmute', 'EnterFullScreen', 'DeleteAccount', 'AppInstall', 'Checkout', 'OrderSuccess'"),
  javascriptErrors: z.array(z.string()).optional().describe("Filter by JavaScript error messages or patterns. Use empty string '' to match any JavaScript error"),
  clickErrors: z.array(z.string()).optional().describe("Filter by click error patterns or messages. Use empty string '' to match any click error"),
  clickedText: z.string().optional().describe("Filter by specific text content that was clicked (partial match supported)"),
  enteredTextPresent: z.boolean().optional().describe("Filter sessions where text input events occurred. Set to true to include only sessions with text input"),
  selectedTextPresent: z.boolean().optional().describe("Filter sessions where text selection events occurred. Set to true to include only sessions with text selection"),
  resizeEventPresent: z.boolean().optional().describe("Filter sessions where page resize events occurred. Set to true to include only sessions with resize events"),
  cursorMovement: z.boolean().optional().describe("Filter sessions with cursor/pointer movement activity. Set to true to include only sessions with cursor movement"),
  deadClickPresent: z.boolean().optional().describe("Filter sessions containing dead clicks (clicks with no response). Set to true to include only sessions with dead clicks"),
  rageClickPresent: z.boolean().optional().describe("Filter sessions containing rage clicks (rapid repeated clicks). Set to true to include only sessions with rage clicks"),
  excessiveScrollPresent: z.boolean().optional().describe("Filter sessions with excessive scrolling behavior. Set to true to include only sessions with excessive scrolling"),
  quickbackClickPresent: z.boolean().optional().describe("Filter sessions with quick back navigation clicks. Set to true to include only sessions with quick back clicks"),
  visiblePageDuration: NullableRangeFilter.optional().describe("Filter by time spent on visible pages in minutes. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  hiddenPageDuration: NullableRangeFilter.optional().describe("Filter by time spent on hidden/background pages in minutes. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  pageDuration: NullableRangeFilter.optional().describe("Filter by total page duration in minutes. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  sessionDuration: NullableRangeFilter.optional().describe("Filter by total session duration in minutes. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  scrollDepth: createRangeFilter(0, 100).optional().describe("Filter by maximum scroll depth percentage. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  pagesCount: NullableRangeFilter.optional().describe("Filter by number of pages visited in session. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  pageClickEventCount: NullableRangeFilter.optional().describe("Filter by number of clicks per page. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  sessionClickEventCount: NullableRangeFilter.optional().describe("Filter by total clicks per session. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  performanceScore: createRangeFilter(0, 100).optional().describe("Filter by overall performance score. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  largestContentfulPaint: NullableRangeFilter.optional().describe("Filter by Largest Contentful Paint web vital in seconds. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  cumulativeLayoutShift: NullableRangeFilter.optional().describe("Filter by Cumulative Layout Shift web vital in seconds. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  firstInputDelay: NullableRangeFilter.optional().describe("Filter by First Input Delay web vital in milliseconds. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  productRating: NullableRangeFilter.optional().describe("Filter by product ratings (e.g., 1-5 stars). Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  productRatingsCount: NullableRangeFilter.optional().describe("Filter by number of product ratings. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  productPrice: NullableRangeFilter.optional().describe("Filter by product price range. Omit this filter to ignore it. Set min or max to null to leave that bound open."),
  productName: z.string().optional().describe("Filter by product name (partial match supported using contains operator)"),
  productPurchases: z.boolean().optional().describe("Filter sessions with checkout conversion/purchases. Set to true to include only sessions with purchases"),
  productAvailability: z.boolean().optional().describe("Filter by product availability status. Set to true to include only sessions with available products"),
  productBrand: z.array(z.string()).optional().describe("Filter by product brand names (e.g., ['Nike', 'Apple', 'Samsung'])"),
  checkoutAbandonmentStep: z.array(z.string()).optional().describe("Filter by checkout abandonment steps/stages (e.g., ['cart', 'shipping', 'payment'])"),
  date: z.object({
    start: UtcTimestamp.describe("The start date of the time interval in UTC ISO 8601 with milliseconds format (yyyy-MM-ddTHH:mm:ss.fffZ)."),
    end: UtcTimestamp.describe("The end date of the time interval in UTC ISO 8601 with milliseconds format (yyyy-MM-ddTHH:mm:ss.fffZ)."),
  }).refine(isOrderedDateRange, {
    message: "The start date must not be after the end date",
    path: ["start"],
  }),
})
  .describe("A set of filters that can be applied to the Microsoft Clarity to session recordings. This allows you to filter recordings based on various criteria such as URLs, device types, browser, OS, country, city, and more. The date filter is required and must be in UTC ISO 8601 format.");

const SampleCount = z.number()
  .int("Sample count must be a whole number")
  .min(1, "Minimum sample count is 1")
  .max(250, "Maximum sample count is 250")
  .default(100)
  .describe("The number of sample session recordings to return. Default is 100. Minimum is 1. Maximum is 250.");

const SortOptions = z.enum([
  "SessionStart_DESC",
  "SessionStart_ASC",
  "SessionDuration_ASC",
  "SessionDuration_DESC",
  "SessionClickCount_ASC",
  "SessionClickCount_DESC",
  "PageCount_ASC",
  "PageCount_DESC",
]).default("SessionStart_DESC").describe("Sort option for session recordings. Default is SessionStart_DESC (newest first).");

const SearchQuery = z.string().describe("A natural language search query string for filtering and shaping analytics data. The query should be specific and include temporal constraints when available. (e.g., 'Top browsers last 3 days', 'The active time duration for mobile devices in United States last week'). Time ranges should be explicitly specified when possible. If no time range is provided, prompt the user to specify one.");

export const ListRequest = {
  filters: Filters,
  sortBy: SortOptions,
  count: SampleCount
};

export const SearchRequest = {
  query: SearchQuery,
};
