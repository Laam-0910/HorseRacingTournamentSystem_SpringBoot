try {
    $conn = New-Object System.Data.SqlClient.SqlConnection("Server=localhost;Database=HorseRacingDB;User Id=sa;Password=12345;Encrypt=False;")
    $conn.Open()
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT column_name FROM information_schema.columns WHERE table_name = 'Race'"
    $reader = $cmd.ExecuteReader()
    Write-Host "Columns in Race table:"
    while ($reader.Read()) {
        Write-Host " - $($reader.GetString(0))"
    }
    $reader.Close()
    $conn.Close()
} catch {
    Write-Host "Error: $_"
}
