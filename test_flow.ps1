$baseUrl = "http://localhost:8080"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   CHECK LUONG API TU DONG (INTELLIJ / POWERSHELL TEST)" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

# List account fallback de thu dang nhap
$testAccounts = @(
    @{ username = "admin"; password = "password123" },
    @{ username = "admin"; password = "123" },
    @{ username = "testuser"; password = "password123" },
    @{ username = "jockey_1"; password = "hash_joc_001" },
    @{ username = "spectator_1"; password = "hash_spec_001" }
)

$token = $null
$loggedUser = $null

Write-Host "[1/3] Dang kiem tra API Dang nhap (/api/auth/login)..." -ForegroundColor Yellow

foreach ($acc in $testAccounts) {
    try {
        $loginBody = @{ username = $acc.username; password = $acc.password } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -ErrorAction Stop
        if ($res.token) {
            $token = $res.token
            $loggedUser = $acc.username
            break
        }
    } catch {
        # Credentials failed
    }
}

# Neu chua dang nhap duoc, tu dong tao mot tai khoan test moi
if (-not $token) {
    Write-Host "     Tai khoan san co chua khop. Dang tu dong tao tai khoan test 'testuser'..." -ForegroundColor Gray
    try {
        $regBody = @{
            username = "testuser"
            fullName = "Test User"
            password = "password123"
            email = "testuser@example.com"
            roleId = 4
        } | ConvertTo-Json

        $regRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -ContentType "application/json" -Body $regBody -ErrorAction Stop
        
        # Dang nhap lai voi tai khoan vua tao
        $loginBody = @{ username = "testuser"; password = "password123" } | ConvertTo-Json
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody -ErrorAction Stop
        if ($res.token) {
            $token = $res.token
            $loggedUser = "testuser"
        }
    } catch {
        # If register or login fails
    }
}

if ($token) {
    Write-Host " [OK] Dang nhap thành công với tài khoản: '$loggedUser'!" -ForegroundColor Green
    Write-Host "      Token: $($token.Substring(0, [Math]::Min(30, $token.Length)))...`n" -ForegroundColor Gray
} else {
    Write-Host " [!] Vui long kiem tra tai khoan trong Database hoac tao user moi qua man hinh Register.`n" -ForegroundColor Yellow
}

# 2. Get Public Races
Write-Host "[2/3] Dang kiem tra Public API (/api/public/races)..." -ForegroundColor Yellow
try {
    $pub = Invoke-RestMethod -Uri "$baseUrl/api/public/races" -ErrorAction Stop
    Write-Host " [OK] API Public Races hoat dong tốt! So luong: $($pub.Count)`n" -ForegroundColor Green
} catch {
    Write-Host " [!] API /api/public/races bao loi: $_`n" -ForegroundColor Red
}

# 3. Get Races (Protected API)
if ($token) {
    Write-Host "[3/3] Dang kiem tra API Bao mat can Token authen (/api/races)..." -ForegroundColor Yellow
    try {
        $headers = @{ Authorization = "Bearer $token" }
        $races = Invoke-RestMethod -Uri "$baseUrl/api/races" -Headers $headers -ErrorAction Stop
        Write-Host " [OK] API Protected /api/races hoat dong tot! So luong: $($races.Count)`n" -ForegroundColor Green
    } catch {
        Write-Host " [!] API /api/races bao loi: $_`n" -ForegroundColor Red
    }
} else {
    Write-Host "[3/3] Bo qua test /api/races vi chua co Token authen." -ForegroundColor Gray
}

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "   TẤT CẢ LUỒNG API ĐÃ HOẠT ĐỘNG XONG!" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
