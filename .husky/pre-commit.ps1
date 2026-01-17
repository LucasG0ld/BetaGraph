# Pre-commit validation script for BetaGraph
# This script runs TypeScript typecheck and ESLint before allowing commits

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PRE-COMMIT CHECKS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: TypeScript typecheck
Write-Host ">>> [1/2] Running TypeScript typecheck..." -ForegroundColor Yellow
Write-Host ""

npm run typecheck
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[X] ERROR: Typecheck failed!" -ForegroundColor Red
    Write-Host "    Fix TypeScript errors before committing." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Typecheck passed" -ForegroundColor Green
Write-Host ""

# Step 2: ESLint
Write-Host ">>> [2/2] Running ESLint..." -ForegroundColor Yellow
Write-Host ""

npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[X] ERROR: Lint failed!" -ForegroundColor Red
    Write-Host "    Fix linting errors before committing." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[OK] Lint passed" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  [OK] ALL CHECKS PASSED - COMMITTING" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit 0
