Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Ashru\.gemini\antigravity-ide\brain\127abcdd-7da4-431f-a32f-007745bb5b5e\current_android_logo.png")
$bmp = New-Object System.Drawing.Bitmap(512, 512)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.Clear([System.Drawing.Color]::White)
$gfx.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gfx.DrawImage($img, 0, 0, 512, 512)
$bmp.Save("C:\Users\Ashru\.gemini\antigravity-ide\brain\127abcdd-7da4-431f-a32f-007745bb5b5e\current_android_logo_white.png", [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
$gfx.Dispose()
$bmp.Dispose()
