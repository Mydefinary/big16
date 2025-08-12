# 스크립트가 위치한 디렉토리로 이동합니다.
# 이렇게 하면 어떤 위치에서 스크립트를 실행해도 항상 올바른 경로에서 작동합니다.
Set-Location -Path $PSScriptRoot

# 현재 폴더 및 하위 폴더에 있는 모든 .yaml, .yml 파일을 찾습니다.
$yamlFiles = Get-ChildItem -Path ".\deployments" -Recurse -Include *.yaml, *.yml

# 찾은 파일이 없는 경우 메시지를 출력하고 스크립트를 종료합니다.
if ($yamlFiles.Length -eq 0) {
    Write-Host "배포할 YAML 파일을 'deployments' 폴더에서 찾을 수 없습니다."
    exit
}

# 찾은 각 파일에 대해 kubectl apply 명령을 실행합니다.
foreach ($file in $yamlFiles) {
    Write-Host "Applying $($file.FullName)..."
    kubectl apply -f $file.FullName
    
    # kubectl 명령어 실행 후 성공/실패 여부를 확인합니다.
    if ($LASTEXITCODE -ne 0) {
        Write-Error "'$($file.Name)' 파일 적용에 실패했습니다. 스크립트를 중단합니다."
        exit 1 # 오류가 발생하면 스크립트 중단
    }
}

Write-Host "all YAML files apply success."