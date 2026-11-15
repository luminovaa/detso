<#
.SYNOPSIS
  Build Detso Mobile Android Release APK using Docker (no local Android SDK/JDK 17 needed).
#>
param(
  [ValidateSet('release', 'debug')]
  [string]$BuildType = 'release',
  [string]$Archs = 'arm64-v8a,armeabi-v7a',
  [switch]$RebuildImage,
  [switch]$CleanCache
)

$ErrorActionPreference = 'Stop'

$MobileDir = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$OutDir = Join-Path $MobileDir 'dist'
$ImageName = 'detso-android-builder:sdk54'
$EnvFile = Join-Path $MobileDir '.env.production'

if (-not (Test-Path $EnvFile)) {
  throw "File $EnvFile tidak ditemukan. Buat .env.production terlebih dahulu."
}

# Pastikan Docker daemon menyala
docker info *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Docker daemon tidak berjalan. Nyalakan Docker Desktop terlebih dahulu."
}

if (-not (Test-Path $OutDir)) {
  New-Item -ItemType Directory -Path $OutDir | Out-Null
}

$ImageExists = docker images -q $ImageName
if ($RebuildImage -or [string]::IsNullOrWhiteSpace($ImageExists)) {
  Write-Host ">>> Building Docker toolchain image ($ImageName)..." -ForegroundColor Cyan
  docker build -f (Join-Path $MobileDir 'Dockerfile.android') -t $ImageName $MobileDir
  if ($LASTEXITCODE -ne 0) { throw "Gagal build Docker image $ImageName." }
}

if ($CleanCache) {
  Write-Host ">>> Membersihkan Docker cache volumes..." -ForegroundColor Yellow
  docker volume rm `
    detso-mobile-node-modules `
    detso-gradle-cache `
    detso-android-ndk `
    detso-android-gradle-project `
    detso-android-root-build `
    detso-android-app-build `
    detso-android-app-cxx 2>$null | Out-Null
}

$GradleTask = if ($BuildType -eq 'debug') { 'assembleDebug' } else { 'assembleRelease' }
$ExtraGradleArgs = if ($BuildType -eq 'release') {
  '-x lintVitalRelease -x lintVitalReportRelease -x lintVitalAnalyzeRelease -x generateReleaseLintVitalModel -x generateReleaseLintVitalReportModel'
} else {
  ''
}
$ApkRelSource = if ($BuildType -eq 'debug') {
  'android/app/build/outputs/apk/debug/app-debug.apk'
} else {
  'android/app/build/outputs/apk/release/app-release.apk'
}
$ApkOutName = if ($BuildType -eq 'debug') {
  'Detso-Mobile-v1.0.0-debug.apk'
} else {
  'Detso-Mobile-v1.0.0-release.apk'
}

$ContainerScript = @'
set -euo pipefail

echo ">>> Menyalin source ke /app (tanpa node_modules & build artifacts)..."
mkdir -p /app
tar -C /src \
  --exclude='./node_modules' \
  --exclude='./.expo' \
  --exclude='./ios' \
  --exclude='./dist' \
  --exclude='./android/.gradle' \
  --exclude='./android/build' \
  --exclude='./android/app/build' \
  --exclude='./android/.cxx' \
  --exclude='./android/app/.cxx' \
  -cf - . | tar -C /app -xf -

cd /app

# Load environment variables dari .env.production (jangan set NODE_ENV=production sebelum npm ci agar devDependencies ikut terpasang)
set -a
. /app/.env.production
set +a

export NODE_OPTIONS="--max-old-space-size=640"
export EXPO_METRO_MAX_WORKERS=1
export GRADLE_OPTS="-Xmx128m -XX:MaxMetaspaceSize=96m"
export CMAKE_BUILD_PARALLEL_LEVEL=1

free -h || true
echo ">>> Target API URL: ${EXPO_PUBLIC_API_URL:-<EMPTY>}"
if [ -z "${EXPO_PUBLIC_API_URL:-}" ]; then
  echo "ERROR: EXPO_PUBLIC_API_URL kosong di .env.production" >&2
  exit 1
fi

LOCK_HASH=$(sha256sum package-lock.json | awk '{print $1}')
CACHED_HASH=$(cat /app/node_modules/.dev-lock.sha256 2>/dev/null || true)
if [ "$LOCK_HASH" != "$CACHED_HASH" ] || [ ! -d /app/node_modules/babel-plugin-transform-remove-console ]; then
  echo ">>> Installing npm dependencies (termasuk devDependencies) di Linux..."
  NODE_ENV=development npm ci --include=dev --prefer-offline --no-audit --no-fund
  echo "$LOCK_HASH" > /app/node_modules/.dev-lock.sha256
else
  echo ">>> Menggunakan cache node_modules (package-lock.json sama)."
fi

export NODE_ENV=production
export BABEL_ENV=production

chmod +x android/gradlew

# Batasi parallelism Ninja C++/CMake agar tidak spawn 14 clang++ sekaligus dan memicu OOM di Docker VM 2GB
NINJA_BIN="/opt/android-sdk/cmake/3.22.1/bin/ninja"
if [ -x "$NINJA_BIN" ] && [ ! -f "${NINJA_BIN}.real" ]; then
  mv "$NINJA_BIN" "${NINJA_BIN}.real"
  cat <<'EOF' > "$NINJA_BIN"
#!/bin/sh
case " $* " in
  *" --version "*|*" -h "*|*" --help "*) exec /opt/android-sdk/cmake/3.22.1/bin/ninja.real "$@" ;;
  *) exec /opt/android-sdk/cmake/3.22.1/bin/ninja.real -j 1 "$@" ;;
esac
EOF
  chmod +x "$NINJA_BIN"
fi

echo ">>> Membersihkan bundle JS & output APK lama agar env/kode terbaru selalu terpakai..."
rm -rf /app/android/app/build/generated/assets \
       /app/android/app/build/generated/res/createBundle* \
       /app/android/app/build/generated/sourcemaps \
       /app/android/app/build/intermediates/assets \
       /app/android/app/build/intermediates/compressed_assets \
       /app/android/app/build/outputs/apk

echo ">>> Menjalankan Gradle: __GRADLE_TASK__ (archs: __ARCHS__)..."
cd android
./gradlew __GRADLE_TASK__ __EXTRA_GRADLE_ARGS__ \
  --no-daemon \
  --build-cache \
  --max-workers=1 \
  -Dorg.gradle.caching=true \
  -Dorg.gradle.parallel=false \
  -Dorg.gradle.workers.max=1 \
  -Dorg.gradle.jvmargs="-Xms256m -Xmx1280m -XX:MaxMetaspaceSize=448m -XX:+UseSerialGC -Djava.util.concurrent.ForkJoinPool.common.parallelism=2" \
  -Dkotlin.compiler.execution.strategy=in-process \
  -Pkotlin.compiler.execution.strategy=in-process \
  -Dkotlin.daemon.jvm.options="-Xmx320m" \
  -PreactNativeArchitectures=__ARCHS__

cd /app
cp -f "__APK_SOURCE__" "/out/__APK_OUT__"
ls -lh "/out/__APK_OUT__"
unzip -p "/out/__APK_OUT__" assets/index.android.bundle > /tmp/check.bundle
if grep -qaF "${EXPO_PUBLIC_API_URL}" /tmp/check.bundle; then
  echo ">>> Verified API URL embedded in APK bundle: ${EXPO_PUBLIC_API_URL}"
else
  echo ">>> WARNING: ${EXPO_PUBLIC_API_URL} tidak terdeteksi di string table bundle."
fi
rm -f /tmp/check.bundle
# end
'@

$ContainerScript = $ContainerScript `
  -replace '__GRADLE_TASK__', $GradleTask `
  -replace '__EXTRA_GRADLE_ARGS__', $ExtraGradleArgs `
  -replace '__ARCHS__', $Archs `
  -replace '__APK_SOURCE__', $ApkRelSource `
  -replace '__APK_OUT__', $ApkOutName `
  -replace "`r`n", "`n"

Write-Host ">>> Memulai build Android ($BuildType) lewat Docker..." -ForegroundColor Cyan
$ContainerScript | docker run --rm -i `
  -v "${MobileDir}:/src:ro" `
  -v "${OutDir}:/out" `
  -v "detso-mobile-node-modules:/app/node_modules" `
  -v "detso-gradle-cache:/root/.gradle" `
  -v "detso-android-ndk:/opt/android-sdk/ndk" `
  -v "detso-android-gradle-project:/app/android/.gradle" `
  -v "detso-android-root-build:/app/android/build" `
  -v "detso-android-app-build:/app/android/app/build" `
  -v "detso-android-app-cxx:/app/android/app/.cxx" `
  $ImageName bash -c 'cat >/tmp/build.sh && exec bash /tmp/build.sh </dev/null'

if ($LASTEXITCODE -ne 0) {
  throw "Build Android di Docker gagal (exit code $LASTEXITCODE)."
}

Write-Host ">>> Selesai! APK tersimpan di: $(Join-Path $OutDir $ApkOutName)" -ForegroundColor Green
