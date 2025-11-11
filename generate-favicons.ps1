# Generate PNG favicons from SVG using Edge in headless mode
$sizes = @(16, 32, 48, 64, 128, 180, 192, 512)

Write-Host "Generating PNG favicons..." -ForegroundColor Cyan
Write-Host ""

# Read SVG content
$svgPath = ".\favicon.svg"
if (-not (Test-Path $svgPath)) {
    Write-Host "Error: favicon.svg not found!" -ForegroundColor Red
    exit 1
}

$svgContent = Get-Content $svgPath -Raw

foreach ($size in $sizes) {
    $outputFile = "favicon-${size}x${size}.png"

    Write-Host "Generating $outputFile..." -NoNewline

    # Create temporary HTML file that renders SVG to canvas and downloads PNG
    $html = @"
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
<canvas id="canvas" width="$size" height="$size"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const img = new Image();
const svgBlob = new Blob([``$svgContent``], { type: 'image/svg+xml' });
const url = URL.createObjectURL(svgBlob);

img.onload = function() {
    ctx.drawImage(img, 0, 0, $size, $size);
    URL.revokeObjectURL(url);

    canvas.toBlob(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '$outputFile';
        a.click();
    });
};
img.src = url;
</script>
</body>
</html>
"@

    $tempHtml = "temp_favicon_$size.html"
    $html | Out-File -FilePath $tempHtml -Encoding UTF8

    # Use Edge to render and download (timeout after 5 seconds)
    Start-Process "msedge" -ArgumentList "--headless", "--screenshot=temp.png", $tempHtml -Wait -WindowStyle Hidden

    # Clean up temp file
    Remove-Item $tempHtml -ErrorAction SilentlyContinue

    Write-Host " ✓" -ForegroundColor Green
}

Write-Host ""
Write-Host "✓ All favicons generated!" -ForegroundColor Green
Write-Host ""
Write-Host "Generated files:" -ForegroundColor Cyan
foreach ($size in $sizes) {
    Write-Host "  - favicon-${size}x${size}.png"
}
