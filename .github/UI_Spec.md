# UI Specification – Kenya Land Trust

**Version:** 1.0  
**Last Updated:** February 2026

This document defines the user interface standards, component patterns, and design system for the Kenya Land Trust marketplace platform.

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [Layout Patterns](#layout-patterns)
5. [Trust Badge System](#trust-badge-system)
6. [Page Specifications](#page-specifications)
7. [Responsive Design](#responsive-design)
8. [Accessibility](#accessibility)
9. [Interaction Patterns](#interaction-patterns)

---

## Design Principles

### Core Values
- **Trust First**: Every UI element reinforces transparency and credibility
- **Documentation Clarity**: Make complex legal documents accessible and understandable
- **Kenyan Context**: Design for local connectivity, devices, and user expectations
- **Progressive Disclosure**: Don't overwhelm; reveal complexity as needed

### Visual Philosophy
- Clean, professional aesthetic that builds confidence
- Earth tones reflecting Kenyan landscapes (terracotta, sage, warm neutrals)
- Generous whitespace to reduce cognitive load
- Clear visual hierarchy with documentation quality front and center

---

## Design System

### Color Palette

#### Primary Colors
```css
--primary-50: #f0fdf4    /* lightest green */
--primary-100: #dcfce7
--primary-500: #22c55e   /* main brand green */
--primary-600: #16a34a   /* hover state */
--primary-700: #15803d   /* active state */
--primary-900: #14532d   /* darkest */
```

#### Trust Badge Colors
```css
--gold: #f59e0b          /* Gold badge */
--gold-bg: #fef3c7       /* Gold badge background */
--silver: #64748b        /* Silver badge */
--silver-bg: #f1f5f9     /* Silver badge background */
--bronze: #a16207        /* Bronze badge */
--bronze-bg: #fef9c3     /* Bronze badge background */
```

#### Semantic Colors
```css
--success: #22c55e       /* confirmation, verified */
--warning: #f59e0b       /* caution, pending */
--error: #ef4444         /* errors, rejections */
--info: #3b82f6          /* informational */
```

#### Neutrals
```css
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-200: #e5e7eb
--gray-300: #d1d5db      /* borders */
--gray-500: #6b7280      /* secondary text */
--gray-700: #374151      /* body text */
--gray-900: #111827      /* headings */
```

### Typography

#### Font Stack
```css
font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

#### Type Scale
```css
--text-xs: 0.75rem;      /* 12px - labels, captions */
--text-sm: 0.875rem;     /* 14px - body small */
--text-base: 1rem;       /* 16px - body */
--text-lg: 1.125rem;     /* 18px - emphasized body */
--text-xl: 1.25rem;      /* 20px - subheadings */
--text-2xl: 1.5rem;      /* 24px - section titles */
--text-3xl: 1.875rem;    /* 30px - page titles */
--text-4xl: 2.25rem;     /* 36px - hero titles */
--text-5xl: 3rem;        /* 48px - landing hero */
```

#### Font Weights
- `400` (normal) – body text
- `500` (medium) – emphasized text, buttons
- `600` (semibold) – headings, card titles
- `700` (bold) – hero text, key metrics

### Spacing Scale
Based on Tailwind's 4px base unit:
```
4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128px
```

### Border Radius
```css
--radius-sm: 0.25rem;    /* 4px - tags, small elements */
--radius-md: 0.5rem;     /* 8px - cards, buttons */
--radius-lg: 0.75rem;    /* 12px - large cards */
--radius-xl: 1rem;       /* 16px - modals, drawers */
```

### Shadows
```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

---

## Component Library

### Buttons

#### Primary Button
```tsx
<button className="
  px-6 py-3 
  bg-primary-600 hover:bg-primary-700 active:bg-primary-800
  text-white font-medium
  rounded-md shadow-sm
  transition-colors duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  List Your Land
</button>
```

**Usage**: Primary CTAs, form submissions, main actions

#### Secondary Button
```tsx
<button className="
  px-6 py-3
  bg-white hover:bg-gray-50
  text-gray-700 font-medium
  border border-gray-300
  rounded-md shadow-sm
  transition-colors duration-200
">
  Learn More
</button>
```

**Usage**: Secondary actions, cancellations, alternative paths

#### Ghost Button
```tsx
<button className="
  px-4 py-2
  text-primary-600 hover:text-primary-700 hover:bg-primary-50
  font-medium
  rounded-md
  transition-colors duration-200
">
  View Details
</button>
```

**Usage**: Tertiary actions, inline links, low-emphasis actions

### Trust Badges

#### Gold Badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-bg rounded-full">
  <svg className="w-5 h-5 text-gold" />
  <span className="text-sm font-semibold text-gold">Gold Verified</span>
</div>
```

**Requirements**: 
- Title deed uploaded
- Land survey uploaded
- Rate clearance uploaded
- Seller ID verified
- Photos uploaded (min 3)

#### Silver Badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-silver-bg rounded-full">
  <svg className="w-5 h-5 text-silver" />
  <span className="text-sm font-semibold text-silver">Silver Verified</span>
</div>
```

**Requirements**: 
- Title deed OR survey uploaded
- Seller ID verified
- Photos uploaded (min 2)

#### Bronze Badge
```tsx
<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bronze-bg rounded-full">
  <svg className="w-5 h-5 text-bronze" />
  <span className="text-sm font-semibold text-bronze">Bronze</span>
</div>
```

**Requirements**: 
- At least one document uploaded
- Basic listing information complete

### Cards

#### Listing Card (Grid View)
```tsx
<div className="
  bg-white rounded-lg shadow-md overflow-hidden
  border border-gray-200
  hover:shadow-lg hover:border-primary-300
  transition-all duration-200
  cursor-pointer
">
  {/* Image */}
  <div className="relative h-48 bg-gray-100">
    <img src="..." className="w-full h-full object-cover" />
    <div className="absolute top-3 right-3">
      {/* Trust Badge */}
    </div>
  </div>
  
  {/* Content */}
  <div className="p-4 space-y-3">
    {/* Location & Size */}
    <div className="flex items-center justify-between text-sm text-gray-500">
      <span className="flex items-center gap-1">
        <MapPin className="w-4 h-4" />
        Nairobi, Kenya
      </span>
      <span>2.5 acres</span>
    </div>
    
    {/* Title */}
    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
      Prime Residential Land in Karen
    </h3>
    
    {/* Price */}
    <div className="text-2xl font-bold text-primary-600">
      KES 15M
    </div>
    
    {/* Documents Preview */}
    <div className="flex items-center gap-2 text-xs text-gray-600">
      <FileText className="w-3.5 h-3.5" />
      <span>5 documents</span>
    </div>
  </div>
</div>
```

#### Info Card
```tsx
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <div className="flex gap-3">
    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
    <div className="space-y-1">
      <h4 className="font-semibold text-blue-900">What are Trust Badges?</h4>
      <p className="text-sm text-blue-800">
        Trust badges indicate the quality and completeness of documentation...
      </p>
    </div>
  </div>
</div>
```

**Variants**: Success (green), Warning (amber), Error (red)

### Forms

#### Text Input
```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    Property Title
    <span className="text-red-500 ml-1">*</span>
  </label>
  <input 
    type="text"
    className="
      w-full px-4 py-2.5
      border border-gray-300 rounded-md
      focus:ring-2 focus:ring-primary-500 focus:border-transparent
      placeholder:text-gray-400
      disabled:bg-gray-50 disabled:text-gray-500
    "
    placeholder="e.g., Prime Land in Karen"
  />
  <p className="text-xs text-gray-500">
    Be clear and descriptive to attract buyers
  </p>
</div>
```

#### File Upload
```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    Title Deed
    <span className="text-red-500 ml-1">*</span>
  </label>
  <div className="
    border-2 border-dashed border-gray-300
    rounded-lg p-8
    hover:border-primary-400 hover:bg-primary-50
    transition-colors duration-200
    cursor-pointer
  ">
    <div className="flex flex-col items-center gap-2 text-center">
      <Upload className="w-8 h-8 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-700">
          Drop file here or click to upload
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, JPG, or PNG up to 10MB
        </p>
      </div>
    </div>
  </div>
</div>
```

#### Select Dropdown
```tsx
<div className="space-y-1.5">
  <label className="block text-sm font-medium text-gray-700">
    County
  </label>
  <select className="
    w-full px-4 py-2.5
    border border-gray-300 rounded-md
    focus:ring-2 focus:ring-primary-500 focus:border-transparent
    bg-white
  ">
    <option>Select county...</option>
    <option>Nairobi</option>
    <option>Kiambu</option>
    <option>Kajiado</option>
  </select>
</div>
```

### Navigation

#### Header (Buyer)
```tsx
<header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <img src="/logo.svg" className="h-8 w-8" />
        <span className="text-xl font-bold text-gray-900">
          Kenya Land Trust
        </span>
      </div>
      
      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-6">
        <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
          Browse Listings
        </a>
        <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
          How It Works
        </a>
        <a href="#" className="text-gray-700 hover:text-primary-600 font-medium">
          About
        </a>
      </nav>
      
      {/* CTA */}
      <div className="flex items-center gap-4">
        <button className="text-gray-700 hover:text-primary-600 font-medium">
          Sign In
        </button>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-md font-medium">
          List Your Land
        </button>
      </div>
    </div>
  </div>
</header>
```

#### Sidebar (Seller/Admin)
```tsx
<aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
  <div className="p-6">
    {/* Logo */}
    <div className="flex items-center gap-2 mb-8">
      <img src="/logo.svg" className="h-8 w-8" />
      <span className="text-lg font-bold">KLT Seller</span>
    </div>
    
    {/* Nav Items */}
    <nav className="space-y-1">
      <a href="#" className="
        flex items-center gap-3 px-3 py-2
        text-primary-700 bg-primary-50
        rounded-md font-medium
      ">
        <LayoutDashboard className="w-5 h-5" />
        Dashboard
      </a>
      <a href="#" className="
        flex items-center gap-3 px-3 py-2
        text-gray-700 hover:bg-gray-50
        rounded-md
      ">
        <FileText className="w-5 h-5" />
        My Listings
      </a>
      <a href="#" className="
        flex items-center gap-3 px-3 py-2
        text-gray-700 hover:bg-gray-50
        rounded-md
      ">
        <PlusCircle className="w-5 h-5" />
        Create Listing
      </a>
    </nav>
  </div>
</aside>
```

### Modals

#### Standard Modal
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50" />
  
  {/* Modal */}
  <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6">
    {/* Header */}
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-semibold text-gray-900">
        Confirm Deletion
      </h2>
      <button className="text-gray-400 hover:text-gray-600">
        <X className="w-5 h-5" />
      </button>
    </div>
    
    {/* Content */}
    <p className="text-gray-600 mb-6">
      Are you sure you want to delete this listing? This action cannot be undone.
    </p>
    
    {/* Actions */}
    <div className="flex items-center justify-end gap-3">
      <button className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md">
        Cancel
      </button>
      <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
        Delete
      </button>
    </div>
  </div>
</div>
```

---

## Layout Patterns

### Landing Page Layout
```tsx
<div className="min-h-screen flex flex-col">
  {/* Header */}
  <Header />
  
  {/* Main Content */}
  <main className="flex-1">
    <Hero />
    <Features />
    <BadgeLegend />
    <Listings />
    <Testimonials />
    <CTA />
  </main>
  
  {/* Footer */}
  <Footer />
</div>
```

### Workspace Layout (Seller/Admin)
```tsx
<div className="flex h-screen overflow-hidden">
  {/* Sidebar */}
  <Sidebar />
  
  {/* Main Content */}
  <main className="flex-1 overflow-y-auto bg-gray-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, John</p>
      </div>
      
      {/* Page Content */}
      {children}
    </div>
  </main>
</div>
```

### Listing Detail Layout
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Main Content (2/3) */}
    <div className="lg:col-span-2 space-y-6">
      <ImageGallery />
      <ListingDetails />
      <DocumentsList />
      <LocationMap />
    </div>
    
    {/* Sidebar (1/3) */}
    <div className="space-y-6">
      <PriceCard />
      <SellerCard />
      <SafetyTips />
    </div>
  </div>
</div>
```

---

## Trust Badge System

### Visual Hierarchy
1. **Badge Placement**: Always top-right of listing images, consistent size
2. **Badge Popover**: Clicking badge shows detailed requirements checklist
3. **Legend Prominence**: Featured section on landing page, always accessible

### Badge Popover Content
```tsx
<Popover>
  <PopoverTrigger>
    <GoldBadge />
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gold-bg rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Gold Verified</h3>
          <p className="text-xs text-gray-500">Highest trust level</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">Requirements Met:</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <span className="text-gray-700">Title deed verified</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <span className="text-gray-700">Land survey uploaded</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <span className="text-gray-700">Rate clearance verified</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <span className="text-gray-700">Seller ID confirmed</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600 mt-0.5" />
            <span className="text-gray-700">3+ photos uploaded</span>
          </div>
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

### Badge Legend Section
Full-width section on landing page explaining the badge system:

- **Headline**: "How We Build Trust" or "Understanding Trust Badges"
- **Layout**: Three columns (Gold, Silver, Bronze)
- **Each column includes**:
  - Large badge icon
  - Badge name and tagline
  - Checklist of requirements
  - "What this means" explanation
  - % of listings at this level

---

## Page Specifications

### Buyer Landing Page

#### Hero Section
- **Layout**: Full-width, centered content
- **Height**: 600px (desktop), 500px (mobile)
- **Background**: Gradient overlay on hero image of Kenyan landscape
- **Content**:
  - H1: "Find Verified Land in Kenya" (text-5xl, font-bold)
  - Subheadline: 1-2 sentences about trust and documentation
  - Primary CTA: "Browse Listings" (large, prominent)
  - Secondary CTA: "How It Works" (ghost button)
  - Trust indicators: "500+ Verified Listings" badge

#### Listings Grid
- **Container**: max-w-7xl, responsive padding
- **Grid**: 
  - Desktop: 3 columns
  - Tablet: 2 columns
  - Mobile: 1 column
- **Spacing**: gap-6
- **Pagination**: Bottom-aligned, 10 per page default
- **Empty State**: Centered illustration + "No listings found" message

#### Filters Sidebar
- **Position**: Sticky, left-aligned (desktop) or drawer (mobile)
- **Sections**:
  - County dropdown
  - Price range slider
  - Trust badge checkboxes
  - Size range input
  - "Apply Filters" button (sticky bottom on mobile)

### Seller Dashboard

#### Stats Cards
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
  <StatCard
    title="Active Listings"
    value="4"
    change="+1 this month"
    icon={<FileText />}
  />
  <StatCard
    title="Total Views"
    value="1,247"
    change="+156 this week"
    icon={<Eye />}
  />
  <StatCard
    title="Inquiries"
    value="23"
    change="5 unread"
    icon={<Mail />}
    alert={true}
  />
</div>
```

#### Recent Activity Feed
- **Layout**: Vertical list, most recent first
- **Items**: Avatar + action description + timestamp
- **Max visible**: 10 items, "View all" link
- **Styling**: Subtle borders, hover highlight

#### Listings Table
- **Columns**: Thumbnail, Title, Status, Badge, Views, Actions
- **Row actions**: Edit, View, Delete (icon buttons)
- **Responsive**: Collapses to cards on mobile
- **Status badges**: 
  - Published (green)
  - Pending Review (amber)
  - Rejected (red)
  - Draft (gray)

### Admin Workspace

#### Moderation Queue
- **Layout**: Kanban board or table view (togglable)
- **Filters**: Status, date range, badge level
- **Actions**: Approve, Reject, Request Changes
- **Bulk actions**: Multi-select with toolbar

#### Analytics Dashboard
- **Charts**: Line chart (views over time), bar chart (listings by county), pie chart (badge distribution)
- **Date range picker**: Last 7 days, 30 days, 90 days, custom
- **Export**: CSV download option

---

## Responsive Design

### Breakpoints
```css
sm: 640px   /* Small devices */
md: 768px   /* Tablets */
lg: 1024px  /* Laptops */
xl: 1280px  /* Desktops */
2xl: 1536px /* Large screens */
```

### Mobile Optimizations

#### Navigation
- Hamburger menu for mobile
- Full-screen drawer navigation
- Fixed bottom CTA bar on listing pages

#### Listings
- Single column grid
- Larger tap targets (min 44x44px)
- Simplified card layout
- Swipeable image galleries

#### Forms
- Full-width inputs
- Larger touch targets for file uploads
- Single-column layout
- Sticky "Save" button at bottom

#### Images
- Lazy loading for all listing images
- Responsive images with srcset
- Optimized sizes: 400px (mobile), 800px (tablet), 1200px (desktop)

---

## Accessibility

### Color Contrast
- **Text on white**: Minimum 4.5:1 for body text, 3:1 for large text
- **Links**: Underlined or with sufficient contrast difference
- **Interactive elements**: Clear focus states with 3px outline

### Keyboard Navigation
- **Tab order**: Logical flow through page
- **Focus indicators**: Visible 2-3px ring on all interactive elements
- **Skip links**: "Skip to main content" at top of page
- **Keyboard shortcuts**: Document in Help section

### Screen Readers
- **Alt text**: Descriptive alt text for all images
- **ARIA labels**: For icon-only buttons and controls
- **Heading hierarchy**: Proper H1-H6 structure
- **Live regions**: For dynamic content updates (form errors, notifications)

### Form Accessibility
- **Labels**: Always associated with inputs (for/id or aria-label)
- **Required fields**: Marked with asterisk AND aria-required
- **Error messages**: Announced by screen readers, linked to inputs
- **Help text**: Associated using aria-describedby

---

## Interaction Patterns

### Loading States
```tsx
{/* Skeleton Loader for Cards */}
<div className="bg-white rounded-lg shadow-md p-4 space-y-3">
  <div className="h-48 bg-gray-200 rounded animate-pulse" />
  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
</div>

{/* Spinner for Buttons */}
<button disabled className="flex items-center gap-2">
  <Loader2 className="w-4 h-4 animate-spin" />
  Saving...
</button>
```

### Empty States
```tsx
<div className="flex flex-col items-center justify-center py-12 px-4">
  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
    <Inbox className="w-10 h-10 text-gray-400" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    No listings yet
  </h3>
  <p className="text-gray-600 text-center max-w-sm mb-6">
    You haven't created any listings. Start by adding your first property.
  </p>
  <button className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium">
    Create First Listing
  </button>
</div>
```

### Notifications/Toasts
- **Position**: Top-right corner
- **Duration**: 5 seconds (success), 10 seconds (error), indefinite (info with action)
- **Stacking**: Max 3 visible, older ones fade out
- **Actions**: Dismissable with X button
- **Types**:
  ```tsx
  // Success
  <Toast variant="success">
    <Check className="w-5 h-5" />
    <span>Listing published successfully</span>
  </Toast>
  
  // Error
  <Toast variant="error">
    <AlertCircle className="w-5 h-5" />
    <span>Failed to upload document. Please try again.</span>
  </Toast>
  ```

### Hover States
- **Cards**: Lift with shadow increase, border color change
- **Buttons**: Darken background 1 shade
- **Links**: Underline + color change
- **Images**: Subtle zoom (1.05 scale) with overflow hidden

### Transitions
```css
/* Default for most interactive elements */
transition: all 0.2s ease-in-out;

/* For larger movements (modals, drawers) */
transition: transform 0.3s ease-out, opacity 0.3s ease-out;

/* For color changes only */
transition: background-color 0.2s ease, color 0.2s ease;
```

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Set up Tailwind config with custom colors and spacing
- [ ] Create base button components (Primary, Secondary, Ghost)
- [ ] Implement trust badge components with popover
- [ ] Build standard form inputs with validation states
- [ ] Create card components (Listing, Info, Stat)

### Phase 2: Layouts
- [ ] Build buyer header with navigation
- [ ] Build workspace sidebar for seller/admin
- [ ] Implement footer component
- [ ] Create page layout wrappers
- [ ] Set up responsive container utilities

### Phase 3: Pages
- [ ] Landing page with hero, listings grid, badge legend
- [ ] Listing detail page with gallery and documents
- [ ] Seller dashboard with stats and listings table
- [ - Admin moderation queue and analytics

### Phase 4: Interactions
- [ ] Loading states and skeletons
- [ ] Toast notification system
- [ ] Modal/dialog system (Radix)
- [ ] Mobile navigation drawer
- [ ] Image gallery with lightbox

### Phase 5: Polish
- [ ] Accessibility audit and fixes
- [ ] Performance optimization (lazy loading, code splitting)
- [ ] Animation polish
- [ ] Error boundary components
- [ ] Analytics integration points

---

## Resources

### Design Tools
- Figma file: [Link to design system]
- Icon library: lucide-react
- Component library: Radix UI

### Code Examples
- Component Storybook: [Link if available]
- Design system docs: `/docs/design-system`

### References
- Kenya.go.ke design patterns (government sites)
- M-Pesa UI patterns (familiar to Kenyan users)
- Airbnb trust signals (inspiration for badges)

---

**Maintained by**: [Project Team]  
**Questions?**: Open an issue or contact design@kenyalandtrust.com