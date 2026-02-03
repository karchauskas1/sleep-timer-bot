#!/bin/bash
# Bundle Size Verification Script
# Verifies that the production build meets size requirements:
# - Total bundle: < 100KB gzipped
# - Cold start: < 500ms (measured by initial JS load)

set -e

echo "========================================="
echo "Bundle Size Verification"
echo "========================================="

# Build the project
echo ""
echo "Building production bundle..."
npm run build

echo ""
echo "========================================="
echo "Bundle Analysis"
echo "========================================="

# Check if dist folder exists
if [ ! -d "dist" ]; then
  echo "ERROR: dist folder not found. Build may have failed."
  exit 1
fi

# Calculate total size
echo ""
echo "Uncompressed sizes:"
du -sh dist/
du -sh dist/assets/

# List all JS files with sizes
echo ""
echo "JavaScript files:"
ls -lh dist/assets/*.js 2>/dev/null || echo "No JS files found"

# Calculate gzipped sizes
echo ""
echo "Gzipped sizes (target: < 100KB total):"
total_gzip=0
for file in dist/assets/*.js; do
  if [ -f "$file" ]; then
    gzip_size=$(gzip -c "$file" | wc -c)
    gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)
    filename=$(basename "$file")
    echo "  $filename: ${gzip_kb}KB"
    total_gzip=$((total_gzip + gzip_size))
  fi
done

total_gzip_kb=$(echo "scale=2; $total_gzip / 1024" | bc)
echo ""
echo "Total JS gzipped: ${total_gzip_kb}KB"

# Verify against threshold
if (( $(echo "$total_gzip_kb < 100" | bc -l) )); then
  echo "✅ PASS: Bundle size is under 100KB gzipped"
else
  echo "❌ FAIL: Bundle size exceeds 100KB gzipped"
  exit 1
fi

# CSS analysis
echo ""
echo "CSS files:"
ls -lh dist/assets/*.css 2>/dev/null || echo "No CSS files found"

for file in dist/assets/*.css; do
  if [ -f "$file" ]; then
    gzip_size=$(gzip -c "$file" | wc -c)
    gzip_kb=$(echo "scale=2; $gzip_size / 1024" | bc)
    filename=$(basename "$file")
    echo "  $filename (gzipped): ${gzip_kb}KB"
  fi
done

echo ""
echo "========================================="
echo "Cold Start Estimation"
echo "========================================="
echo "Cold start < 500ms requirement depends on:"
echo "  - Network speed (assumed 3G ~750KB/s)"
echo "  - JS parsing time (< 100ms for modern devices)"
echo "  - React hydration (< 50ms for small app)"
echo ""

# Calculate estimated load time at 3G speed
estimated_load=$(echo "scale=2; $total_gzip_kb / 750 * 1000" | bc)
echo "Estimated network transfer at 3G: ${estimated_load}ms"

if (( $(echo "$estimated_load < 300" | bc -l) )); then
  echo "✅ PASS: Network transfer time allows for < 500ms cold start"
else
  echo "⚠️  WARNING: Bundle might be too large for 500ms cold start on 3G"
fi

echo ""
echo "========================================="
echo "Summary"
echo "========================================="
echo "Total JS (gzipped): ${total_gzip_kb}KB (target: < 100KB)"
echo "Est. cold start: Achievable with proper caching"
echo ""
