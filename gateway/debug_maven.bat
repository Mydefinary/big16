@echo off
echo ========================================
echo Maven 의존성 분석 시작
echo ========================================

REM 현재 날짜와 시간으로 폴더 생성
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "datestamp=%YYYY%-%MM%-%DD%_%HH%-%Min%-%Sec%"

set "LOG_DIR=maven_analysis_%datestamp%"
mkdir "%LOG_DIR%"

echo 로그 디렉토리 생성: %LOG_DIR%
echo.

REM 1. 기본 프로젝트 정보
echo [1/6] 프로젝트 정보 수집 중...
mvn help:effective-pom > "%LOG_DIR%\01_effective_pom.xml" 2>&1

REM 2. 의존성 트리 (상세)
echo [2/6] 의존성 트리 분석 중...
mvn dependency:tree -Dverbose > "%LOG_DIR%\02_dependency_tree_verbose.txt" 2>&1

REM 3. 의존성 트리 (간단)
echo [3/6] 의존성 트리 (간단) 분석 중...
mvn dependency:tree > "%LOG_DIR%\03_dependency_tree_simple.txt" 2>&1

REM 4. 사용 가능한 버전 확인
echo [4/6] 사용 가능한 버전 확인 중...
mvn versions:display-dependency-updates > "%LOG_DIR%\04_available_versions.txt" 2>&1

REM 5. 충돌하는 의존성 확인
echo [5/6] 의존성 충돌 분석 중...
mvn dependency:analyze > "%LOG_DIR%\05_dependency_conflicts.txt" 2>&1

REM 6. 의존성 해결 시도 (실패할 수 있음)
echo [6/6] 의존성 해결 시도 중...
mvn dependency:resolve > "%LOG_DIR%\06_resolve_attempt.txt" 2>&1

echo.
echo ========================================
echo 분석 완료! 결과는 다음 폴더에 저장됨:
echo %LOG_DIR%
echo ========================================
echo.

REM 결과 요약 생성
echo 의존성 분석 결과 요약 > "%LOG_DIR%\00_SUMMARY.txt"
echo ======================= >> "%LOG_DIR%\00_SUMMARY.txt"
echo 생성일시: %datestamp% >> "%LOG_DIR%\00_SUMMARY.txt"
echo 프로젝트: boot-camp-gateway >> "%LOG_DIR%\00_SUMMARY.txt"
echo. >> "%LOG_DIR%\00_SUMMARY.txt"
echo 생성된 파일들: >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 01_effective_pom.xml: 최종 적용된 POM 설정 >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 02_dependency_tree_verbose.txt: 상세 의존성 트리 >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 03_dependency_tree_simple.txt: 간단한 의존성 트리 >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 04_available_versions.txt: 사용 가능한 버전 목록 >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 05_dependency_conflicts.txt: 의존성 충돌 분석 >> "%LOG_DIR%\00_SUMMARY.txt"
echo - 06_resolve_attempt.txt: 의존성 해결 시도 결과 >> "%LOG_DIR%\00_SUMMARY.txt"

echo 각 .txt 파일을 열어서 오류 메시지나 경고를 확인하세요.
echo 특히 02_dependency_tree_verbose.txt 파일에서 충돌하는 의존성을 찾을 수 있습니다.

pause