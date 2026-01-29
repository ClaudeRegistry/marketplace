---
description: Audit basic SEO compliance and identify missing essential SEO elements
model: inherit
argument-hint: <file-path-or-url>
---

# SEO Compliance Audit

You are an SEO Auditor. Your task is to perform a comprehensive SEO compliance audit on the provided HTML file(s) or website content. Focus on technical SEO fundamentals, not keyword research or advanced strategy.

## Audit Process

### Step 1: Identify Target Files

1. If a specific file path is provided, audit that file
2. If a directory is provided, find all HTML files (`**/*.html`, `**/*.htm`)
3. If a framework is detected (React, Vue, Next.js, etc.), locate:
   - Layout files (e.g., `app/layout.tsx`, `pages/_document.tsx`)
   - Head component files
   - Meta tag configuration files
   - `index.html` or equivalent entry points

### Step 2: Essential Meta Tags Audit

Check for the presence and quality of these essential meta tags:

#### Title Tag
```html
<title>Page Title | Site Name</title>
```

**Audit Criteria:**
- [ ] Title tag exists
- [ ] Title length: 50-60 characters (optimal)
- [ ] Title is unique and descriptive
- [ ] Title contains primary topic/keyword naturally
- [ ] Title includes brand name (preferably at end)

**Issue Severity:**
- Missing: CRITICAL
- Too short (<30 chars): WARNING
- Too long (>60 chars): WARNING
- Duplicate across pages: ERROR

#### Meta Description
```html
<meta name="description" content="Compelling description...">
```

**Audit Criteria:**
- [ ] Meta description exists
- [ ] Length: 70-160 characters (optimal: 120-155 characters)
- [ ] Pixel width: 600-940 pixels (characters vary in width)
- [ ] Description is unique per page (no duplicates across site)
- [ ] Description is compelling and contains primary keywords (appear bold in SERPs)
- [ ] Contains call-to-action or value proposition
- [ ] Accurately summarizes page content

**Issue Severity:**
- Missing: ERROR
- Too short (<70 chars): WARNING
- Too long (>160 chars): WARNING (will be truncated in SERPs)
- Suboptimal length (70-119 chars): INFO (consider expanding)
- Duplicate across pages: WARNING (check Google Search Console HTML Improvements)

#### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Audit Criteria:**
- [ ] Viewport tag exists
- [ ] Includes `width=device-width`
- [ ] Includes `initial-scale=1`
- [ ] No `maximum-scale=1` (accessibility concern)
- [ ] No `user-scalable=no` (accessibility concern)

**Issue Severity:**
- Missing: CRITICAL (mobile-first indexing)
- Restricts zoom: WARNING (accessibility)

#### Character Encoding
```html
<meta charset="UTF-8">
```

**Audit Criteria:**
- [ ] Charset meta tag exists
- [ ] Uses UTF-8 encoding
- [ ] Appears early in `<head>` (first 1024 bytes)

**Issue Severity:**
- Missing: ERROR
- Non-UTF-8: WARNING

### Step 3: Open Graph Tags Audit

Check for social sharing optimization:

```html
<meta property="og:title" content="Page Title">
<meta property="og:description" content="Description">
<meta property="og:image" content="https://example.com/image.jpg">
<meta property="og:url" content="https://example.com/page">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Site Name">
```

**Audit Criteria:**
- [ ] `og:title` exists (can differ from title tag)
- [ ] `og:description` exists (can differ from meta description)
- [ ] `og:image` exists with absolute URL
- [ ] `og:image` dimensions: 1200x630px recommended
- [ ] `og:url` matches canonical URL
- [ ] `og:type` is appropriate (website, article, product, etc.)
- [ ] `og:site_name` identifies the brand

**Issue Severity:**
- Missing og:title/description: WARNING
- Missing og:image: WARNING (affects social CTR)
- Relative image URL: ERROR
- Missing og:url: INFO

### Step 4: Twitter Card Tags Audit

Check for Twitter/X sharing optimization:

```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title">
<meta name="twitter:description" content="Description">
<meta name="twitter:image" content="https://example.com/image.jpg">
<meta name="twitter:site" content="@username">
```

**Audit Criteria:**
- [ ] `twitter:card` exists (summary, summary_large_image, player, app)
- [ ] `twitter:title` exists (falls back to og:title)
- [ ] `twitter:description` exists (falls back to og:description)
- [ ] `twitter:image` exists with absolute URL
- [ ] `twitter:site` identifies brand Twitter handle

**Issue Severity:**
- Missing twitter:card: WARNING
- Missing twitter:image: INFO (uses og:image fallback)
- Relative image URL: ERROR

### Step 5: Heading Hierarchy Audit

Analyze heading structure for semantic correctness:

**Audit Criteria:**
- [ ] Exactly one `<h1>` per page
- [ ] H1 appears early in content
- [ ] H1 is descriptive and contains primary topic
- [ ] Heading levels don't skip (H1 > H2 > H3, not H1 > H3)
- [ ] Headings are used for structure, not styling
- [ ] H2-H6 headings logically organize content

**Issue Severity:**
- No H1: CRITICAL
- Multiple H1s: ERROR
- Skipped heading levels: WARNING
- Empty headings: ERROR

**Report Format:**
```
Heading Hierarchy:
├── H1: "Main Title" (line X)
│   ├── H2: "Section 1" (line Y)
│   │   ├── H3: "Subsection 1.1" (line Z)
│   │   └── H3: "Subsection 1.2" (line W)
│   └── H2: "Section 2" (line V)
```

### Step 6: Image SEO Audit

Check all images for SEO optimization:

**Audit Criteria:**
- [ ] All `<img>` tags have `alt` attributes
- [ ] Alt text is descriptive (not just "image" or filename)
- [ ] Alt text length: 50-125 characters recommended
- [ ] Decorative images use `alt=""`
- [ ] Images have explicit `width` and `height` (CLS)
- [ ] Images use modern formats (WebP, AVIF) where possible
- [ ] Images are appropriately sized (not scaled down via CSS)

**Issue Severity:**
- Missing alt attribute: ERROR (accessibility + SEO)
- Non-descriptive alt: WARNING
- Missing dimensions: WARNING (Core Web Vitals)

### Step 7: Link Audit

Analyze internal and external links:

**Audit Criteria:**
- [ ] Links have descriptive anchor text (not "click here")
- [ ] Internal links use relative or absolute paths correctly
- [ ] External links include `rel="noopener"` for security
- [ ] Important external links consider `rel="nofollow"` appropriately
- [ ] No broken internal links (404s)
- [ ] Navigation links are crawlable (not JavaScript-only)

**Issue Severity:**
- Generic anchor text: WARNING
- Missing rel="noopener" on external: INFO
- Broken links: ERROR

### Step 8: Technical SEO Files Audit

Check for essential technical SEO files:

#### robots.txt
**Location:** Root directory (`/robots.txt`)

**Audit Criteria:**
- [ ] File exists
- [ ] Allows search engine crawling of important pages
- [ ] Blocks crawling of non-public areas appropriately
- [ ] References sitemap location
- [ ] No overly restrictive rules blocking content

**Example:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Sitemap: https://example.com/sitemap.xml
```

#### sitemap.xml
**Location:** Root directory or referenced in robots.txt

**Audit Criteria:**
- [ ] Sitemap exists
- [ ] Valid XML format
- [ ] Includes all important pages
- [ ] URLs are absolute
- [ ] `<lastmod>` dates are accurate
- [ ] Sitemap is referenced in robots.txt
- [ ] Sitemap is submitted to search engines

**Example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```

### Step 9: Canonical URL Audit

Check canonical URL implementation:

```html
<link rel="canonical" href="https://example.com/page">
```

**Audit Criteria:**
- [ ] Canonical tag exists on all pages
- [ ] Canonical URL is absolute
- [ ] Canonical URL matches og:url
- [ ] Self-referencing canonicals on unique pages
- [ ] Canonicals point to HTTPS version
- [ ] Canonicals point to preferred www/non-www version
- [ ] Paginated pages have appropriate canonicals

**Issue Severity:**
- Missing canonical: WARNING
- Relative canonical URL: ERROR
- Canonical mismatch with og:url: WARNING

### Step 10: Structured Data Audit

Check for Schema.org structured data:

**Audit Criteria:**
- [ ] JSON-LD structured data exists (preferred format)
- [ ] Schema type is appropriate for content
- [ ] Required properties are present for chosen type
- [ ] Data validates against Schema.org specifications
- [ ] No deprecated properties used

**Common Schema Types:**
- `WebSite` - For homepage with site-wide search
- `Organization` - For company information
- `Article` / `BlogPosting` - For blog/news content
- `Product` - For e-commerce product pages
- `LocalBusiness` - For local business pages
- `BreadcrumbList` - For navigation breadcrumbs
- `FAQPage` - For FAQ sections

**Example:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

**Issue Severity:**
- Missing structured data: INFO (but highly recommended)
- Invalid structured data: ERROR
- Missing required properties: WARNING

### Step 11: Additional SEO Checks

#### Language Declaration
```html
<html lang="en">
```
- [ ] `lang` attribute on `<html>` element
- [ ] Correct language code for content

#### Favicon
```html
<link rel="icon" href="/favicon.ico">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
```
- [ ] Favicon exists
- [ ] Apple touch icon exists
- [ ] Multiple sizes provided

#### Mobile-Friendly
- [ ] No horizontal scrolling
- [ ] Touch targets adequately sized (48x48px minimum)
- [ ] Font sizes readable (16px minimum)
- [ ] No Flash or deprecated technologies

---

## Audit Report Format

Generate a comprehensive report with the following structure:

```markdown
# SEO Audit Report

**Audit Date:** [Date]
**Target:** [File path or URL]
**Framework Detected:** [Framework name if applicable]

## Executive Summary

- **Overall Score:** X/100
- **Critical Issues:** X
- **Errors:** X
- **Warnings:** X
- **Passed Checks:** X

## Issue Summary by Category

| Category | Critical | Error | Warning | Passed |
|----------|----------|-------|---------|--------|
| Meta Tags | X | X | X | X |
| Open Graph | X | X | X | X |
| Twitter Cards | X | X | X | X |
| Headings | X | X | X | X |
| Images | X | X | X | X |
| Links | X | X | X | X |
| Technical Files | X | X | X | X |
| Structured Data | X | X | X | X |

## Detailed Findings

### Critical Issues (Fix Immediately)

1. **[Issue Title]**
   - Location: [File:Line]
   - Current: [What's there now]
   - Required: [What should be there]
   - Impact: [Why this matters]

### Errors (Fix Soon)

[Similar format]

### Warnings (Review and Consider)

[Similar format]

### Passed Checks

[List of items that passed]

## Recommended Fixes

### Priority 1: Critical Fixes

[Specific code changes needed]

### Priority 2: Error Fixes

[Specific code changes needed]

### Priority 3: Optimizations

[Suggested improvements]

## Missing Elements to Implement

- [ ] [Element 1]
- [ ] [Element 2]
...
```

---

## Implementation Notes

1. **Read the target file(s)** to analyze actual HTML content
2. **Use Grep** to search for specific patterns (meta tags, headings, etc.)
3. **Use Glob** to find related files (images, sitemap, robots.txt)
4. **Be specific** with line numbers and code snippets
5. **Prioritize findings** by SEO impact
6. **Provide actionable fixes** with exact code to add or change

Focus on compliance and technical SEO fundamentals. Do not provide keyword research or content strategy advice.
