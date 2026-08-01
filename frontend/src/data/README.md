# Portfolio Skills Data System

This file describes the portfolio data processing logic and the generation of dynamic skill statistics.

## Project Categories In MongoDB

Portfolio projects stored in MongoDB should use the `category` field with the following values:

### **Web Applications** - blue (`rgba(99, 102, 241, 0.8)`)

```
"web-app", "webapp", "web"
```

### **Mobile Apps** - green (`rgba(34, 197, 94, 0.8)`)

```
"mobile-apps", "mobile", "mobilne", "mobile apps", "mob"
```

### **E-commerce** - green (`rgba(34, 197, 94, 0.8)`)

```
"ecommerce", "e-commerce", "ekomercyjny", "sklep"
```

### **APIs & Services** - violet (`rgba(139, 92, 246, 0.8)`)

```
"api", "services", "usługi"
```

### **Tools & Utilities** - cyan (`rgba(6, 182, 212, 0.8)`)

```
"tools", "narzędzia", "utilities"
```

### **Landing Pages** - mint green (`rgba(16, 185, 129, 0.8)`)

```
"landing", "portfolio", "wizytówka"
```

### **Other** - orange (`rgba(245, 158, 11, 0.8)`)

```
"other", "inne", "" (empty), or a missing field
```

## Example MongoDB Document

### Simple Example (Single Category)

```javascript
{
  "_id": "ObjectId(...)",
  "title": "Electronics Store",
  "desc": "Modern e-commerce store",
  "tags": ["PHP", "Laravel", "MySQL"],
  "img": "/portfolio/shop.jpg",
  "href": "https://store.example.com",
  "category": "ecommerce",     // now used instead of "newTech": true
  "dateFrom": "2024-01-15",
  // ... other fields ...
}
```

### Example With Multiple Categories (Comma Separated)

```javascript
{
  "_id": "ObjectId(...)",
  "title": "Supermarket PWA",
  "desc": "Mobile and web application for a B2B client",
  "tags": ["React", "Next.js", "PWA", "TypeScript"],
  "img": "/portfolio/pwa-shop.jpg",
  "href": "https://shop.pwa.example.com",
  "category": "web-app, mobile-apps",  // multiple categories in one field
  "dateFrom": "2024-02-20",
  "dateTo": "2024-06-15",
  // ... other fields ...
}
```

### Additional Category Keyword Examples

```javascript
"category": "landing"                    // single landing page
"category": "tools, landing"            // tools + landing
"category": "web-app, ecommerce"        // web app + e-commerce
"category": "mobile-apps, web-app"      // mobile + web
```

## Functions And Behavior

### `calculatePortfolioCategories(portfolio)`

- Reads the `category` field directly from portfolio documents
- Maps discovered values to user-facing category labels automatically
- Calculates the percentage distribution of projects
- Falls back safely when category data is missing

### `calculateTechTrends(portfolio)`

- Analyzes year-over-year technology trends
- Compares technology usage across consecutive years
- Displays only meaningful trends (`+/- 10%` change)

### `calculateDynamicSkills(portfolio)`

- Generates skills from the technologies used across projects
- Derives skill levels from project frequency
- Calculates experience in months from project date ranges

## Backward Compatibility

- If a project has no `category` field, it falls back to `Other`
- Supports both Polish and English category names
- Normalizes category values case-insensitively

## Updating Portfolio Data

The canonical portfolio data source is `backend/scripts/portfolio.data.json`.
Published records are complete Polish and English case studies. In addition to
the short description and technology tags, each one defines `problem`, `role`,
`decisions`, and `result` fields with matching `_en` variants, plus a working
`href` or `repoUrl` as evidence. Draft records can stay intentionally partial.

Recommended workflow:

```bash
pnpm -F backend portfolio:pull
# edit backend/scripts/portfolio.data.json
pnpm -F backend portfolio:push
```

If the remote database should exactly match the file, including deletion of missing entries:

```bash
pnpm -F backend portfolio:push:prune
```

## Debugging

Open the browser console (`F12`) to inspect runtime logs:

- `Portfolio fetch:` - data loading status
- `Tech trends calculation:` - trend calculation details
- `Portfolio categories calculation:` - category processing details
